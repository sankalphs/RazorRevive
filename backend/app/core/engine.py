import uuid
import asyncio
import threading
from typing import Optional
from datetime import datetime

from ..models.schemas import (
    AtRiskTransaction,
    DiagnosisResult,
    ComplianceCheck,
    AuditLogEntry,
    RecoveryStatus,
    InterventionType,
    FailureCategory
)
from .diagnostics import diagnose_transaction_ai
from .policy_guardrails import (
    evaluate_compliance_and_guardrails,
    guardrail_stop_details,
    is_within_rbi_contact_hours,
    get_current_ist_time,
    ist_timestamp,
    IST_OFFSET,
)
from .audit_logger import audit_logger
from ..interventions.base import INTERVENTION_BASE_COSTS
from ..interventions.mandate_sequencer import MandateRetrySequencer
from ..interventions.hinglish_agent import HinglishRecoveryAgent
from ..interventions.checkout_rescuer import CheckoutDropOffRescuer
from ..interventions.b2b_chaser import B2BReceivablesChaser


class DeferralQueue:
    """Background queue for actions deferred by the RBI contact-hours rule.

    Out-of-hours traffic is parked here with its diagnosis and compliance
    record, including the exact deferred-until time the guardrail computed.
    A dispatcher loop wakes periodically and, once the current IST time is
    past that item's due time, re-runs the intervention — so "queued for
    dispatch at <time>" in the audit trail is backed by a real dispatcher
    instead of a promise.

    The queue uses a threading lock (not asyncio.Lock) because items are
    enqueued from request handlers and drained from a background task; the
    drain is made async by scheduling the (synchronous, in-memory) work as
    a coroutine per item.
    """

    _queue: list[dict] = []
    _lock = threading.Lock()
    _dispatcher_running: bool = False

    @classmethod
    def _now_provider(cls):
        return cls._now_fn if cls._now_fn else get_current_ist_time

    # Test seam: set to a callable returning a fixed datetime to make
    # dispatcher behaviour deterministic. Tests must reset to None.
    _now_fn = None

    @classmethod
    async def enqueue(cls, txn: AtRiskTransaction, diagnosis: DiagnosisResult,
                      compliance: ComplianceCheck) -> None:
        due = None
        if compliance.deferred_until_ist:
            try:
                due = datetime.strptime(
                    compliance.deferred_until_ist, "%Y-%m-%d %H:%M:%S IST"
                ).replace(tzinfo=IST_OFFSET)
            except ValueError:
                due = None
        item = {
            "txn": txn,
            "diagnosis": diagnosis,
            "compliance": compliance,
            "enqueued_at": ist_timestamp(),
            "due": due,
        }
        with cls._lock:
            cls._queue.append(item)
            start_dispatcher = not cls._dispatcher_running
            if start_dispatcher:
                cls._dispatcher_running = True
        if start_dispatcher:
            loop = asyncio.get_running_loop()
            loop.create_task(cls._dispatcher())

    @classmethod
    async def _dispatcher(cls) -> None:
        try:
            while True:
                for item in cls._pull_due():
                    try:
                        await cls._run_deferred(item)
                    except Exception:
                        # Never let one deferred item kill the dispatcher.
                        continue
                with cls._lock:
                    if not cls._queue:
                        cls._dispatcher_running = False
                        return
                await asyncio.sleep(60)
        except asyncio.CancelledError:
            raise
        except Exception:
            with cls._lock:
                cls._dispatcher_running = False
            raise

    @classmethod
    def _pull_due(cls) -> list[dict]:
        """Synchronously pull everything whose deferred-until time has
        passed (or whose time could not be parsed)."""
        now = cls._now_provider()()
        with cls._lock:
            due_items = [it for it in cls._queue if it["due"] is None or it["due"] <= now]
            if due_items:
                cls._queue = [it for it in cls._queue if it not in due_items]
        return due_items

    @classmethod
    async def _run_deferred(cls, item: dict) -> AuditLogEntry:
        return await RecoveryOrchestrator._execute_intervention(
            item["txn"], item["diagnosis"], item["compliance"],
            deferred_from=item["enqueued_at"],
        )

    @classmethod
    async def snapshot(cls) -> list[dict]:
        with cls._lock:
            return [
                {
                    "transaction_id": it["txn"].id,
                    "merchant_name": it["txn"].merchant_name,
                    "amount": it["txn"].amount,
                    "enqueued_at": it["enqueued_at"],
                    "deferred_until": it["compliance"].deferred_until_ist,
                }
                for it in cls._queue
            ]

    @classmethod
    def clear(cls) -> None:
        with cls._lock:
            cls._queue.clear()
            cls._dispatcher_running = False


class RecoveryOrchestrator:
    """
    Central autonomous engine for RazorRevive.
    Executes the bounded recovery pipeline:
    Detect -> Diagnose -> Guardrail Check -> Intervene -> Audit & Settle.
    """

    @staticmethod
    async def process_at_risk_transaction(
        txn: AtRiskTransaction,
        use_llm: bool = True,
        custom_time: Optional[datetime] = None
    ) -> AuditLogEntry:
        audit_id = f"audit_{uuid.uuid4().hex[:10]}"
        
        # Step 1: Diagnose Root Cause
        diagnosis = await diagnose_transaction_ai(txn, use_llm=use_llm)

        # Step 2: Guardrails and Compliance Evaluation
        compliance = evaluate_compliance_and_guardrails(txn, diagnosis.category, custom_time=custom_time)

        # Step 3: Handle Non-Compliant / Stopping Rules
        # Single owner of the stop mapping lives in the Guardrail module.
        if not compliance.is_compliant:
            final_status, action_details = guardrail_stop_details(compliance)

            # Out-of-hours traffic is deferred, not stopped: the dispatcher
            # re-runs the intervention inside the next RBI contact window.
            if not compliance.rbi_hours_ok:
                await DeferralQueue.enqueue(txn, diagnosis, compliance)

            entry = AuditLogEntry(
                id=audit_id,
                transaction_id=txn.id,
                timestamp=ist_timestamp(),
                event=f"Guardrail Enforced: {compliance.reason[:40]}...",
                merchant_name=txn.merchant_name,
                amount_at_risk=txn.amount,
                amount_recovered=0.0,
                cost_incurred=0.0,
                diagnosis=diagnosis,
                compliance=compliance,
                intervention=InterventionType.HARD_STOP_NO_ACTION,
                action_details=action_details,
                final_status=final_status,
                settlement_ref=None
            )
            audit_logger.record(entry)
            return entry

        # Step 4: Dispatch Approved Bounded Intervention
        return await RecoveryOrchestrator._execute_intervention(txn, diagnosis, compliance, audit_id=audit_id)

    @staticmethod
    async def _execute_intervention(
        txn: AtRiskTransaction,
        diagnosis: DiagnosisResult,
        compliance: ComplianceCheck,
        audit_id: Optional[str] = None,
        deferred_from: Optional[str] = None,
    ) -> AuditLogEntry:
        chosen_intervention = diagnosis.recommended_action
        final_status = RecoveryStatus.IN_PROGRESS
        action_details = {}
        amount_recovered = 0.0
        cost_incurred = 0.0
        settlement_ref = None

        if chosen_intervention == InterventionType.SMART_MANDATE_RETRY:
            status, details, recovered = MandateRetrySequencer.execute_mandate_retry(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = float(details.get("cost_incurred", INTERVENTION_BASE_COSTS["SMART_MANDATE_RETRY"]))
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention in [InterventionType.HINGLISH_VOICE_P2P, InterventionType.WHATSAPP_MAGIC_LINK]:
            status, details, recovered = HinglishRecoveryAgent.simulate_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = float(details.get("cost_incurred", INTERVENTION_BASE_COSTS["HINGLISH_VOICE_P2P"]))
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention == InterventionType.CHECKOUT_DYNAMIC_OFFER:
            status, details, recovered = CheckoutDropOffRescuer.execute_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            # Cost lives with the intervention (base fee + funded discount).
            cost_incurred = float(details.get(
                "cost_incurred",
                INTERVENTION_BASE_COSTS["CHECKOUT_DYNAMIC_OFFER"] + details.get("discount_funded", 0.0),
            ))
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention == InterventionType.B2B_COMPLIANT_DUNNING:
            status, details, recovered = B2BReceivablesChaser.execute_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = float(details.get("cost_incurred", INTERVENTION_BASE_COSTS["B2B_COMPLIANT_DUNNING"]))
            settlement_ref = details.get("settlement_ref")

        else:
            final_status = RecoveryStatus.STOPPED_GUARDRAIL
            action_details = {"note": "No action permissible."}

        if deferred_from:
            action_details = {
                "deferred_from": deferred_from,
                **action_details,
            }

        # Step 5: Immutable Audit Logging
        entry = AuditLogEntry(
            id=audit_id or f"audit_{uuid.uuid4().hex[:10]}",
            transaction_id=txn.id,
            timestamp=ist_timestamp(),
            event=f"Intervention Executed: {chosen_intervention.value}",
            merchant_name=txn.merchant_name,
            amount_at_risk=txn.amount,
            amount_recovered=amount_recovered,
            cost_incurred=cost_incurred,
            diagnosis=diagnosis,
            compliance=compliance,
            intervention=chosen_intervention,
            action_details=action_details,
            final_status=final_status,
            settlement_ref=settlement_ref
        )
        audit_logger.record(entry)
        return entry
