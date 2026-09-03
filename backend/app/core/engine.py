import uuid
from typing import Tuple, Dict, Any, Optional
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
from .policy_guardrails import evaluate_compliance_and_guardrails
from .audit_logger import audit_logger
from ..interventions.mandate_sequencer import MandateRetrySequencer
from ..interventions.hinglish_agent import HinglishRecoveryAgent
from ..interventions.checkout_rescuer import CheckoutDropOffRescuer
from ..interventions.b2b_chaser import B2BReceivablesChaser

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
        if not compliance.is_compliant:
            cost = 0.0
            recovered = 0.0
            settlement_ref = None
            
            if not compliance.not_hard_declined:
                final_status = RecoveryStatus.STOPPED_GUARDRAIL
                action_details = {
                    "rule": "HARD_STOP_FRAUD_OR_INVALID_INSTRUMENT",
                    "reason": compliance.reason,
                    "action_taken": "Zero retries attempted. Logged to merchant compliance ledger."
                }
            elif not compliance.dnd_clear:
                final_status = RecoveryStatus.STOPPED_GUARDRAIL
                action_details = {
                    "rule": "DND_REGISTRY_RESPECTED",
                    "reason": compliance.reason,
                    "action_taken": "Outreach suppressed per customer opt-out."
                }
            elif not compliance.dispute_clear:
                final_status = RecoveryStatus.STOPPED_GUARDRAIL
                action_details = {
                    "rule": "CUSTOMER_HARDSHIP_OR_DISPUTE_PAUSE",
                    "reason": compliance.reason,
                    "action_taken": "Automated dunning halted; escalated to human concierge."
                }
            elif not compliance.within_touch_limit:
                final_status = RecoveryStatus.STOPPED_GUARDRAIL
                action_details = {
                    "rule": "MAX_TOUCHPOINT_CEILING_REACHED",
                    "reason": compliance.reason,
                    "action_taken": "Outreach capped to prevent customer fatigue."
                }
            elif not compliance.rbi_hours_ok:
                final_status = RecoveryStatus.IN_PROGRESS
                action_details = {
                    "rule": "RBI_CONTACT_HOURS_DEFERRED",
                    "reason": compliance.reason,
                    "deferred_until": compliance.deferred_until_ist,
                    "action_taken": f"Action queued for dispatch at {compliance.deferred_until_ist}."
                }
            else:
                final_status = RecoveryStatus.STOPPED_GUARDRAIL
                action_details = {"rule": "GENERIC_GUARDRAIL_STOP", "reason": compliance.reason}

            entry = AuditLogEntry(
                id=audit_id,
                transaction_id=txn.id,
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
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
            cost_incurred = 1.25
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention in [InterventionType.HINGLISH_VOICE_P2P, InterventionType.WHATSAPP_MAGIC_LINK]:
            status, details, recovered = HinglishRecoveryAgent.simulate_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = 1.80
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention == InterventionType.CHECKOUT_DYNAMIC_OFFER:
            status, details, recovered = CheckoutDropOffRescuer.execute_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = 1.50 + details.get("discount_funded", 0.0)
            settlement_ref = details.get("settlement_ref")

        elif chosen_intervention == InterventionType.B2B_COMPLIANT_DUNNING:
            status, details, recovered = B2BReceivablesChaser.execute_recovery(txn)
            final_status = status
            action_details = details
            amount_recovered = recovered
            cost_incurred = 2.50
            settlement_ref = details.get("settlement_ref")

        else:
            final_status = RecoveryStatus.STOPPED_GUARDRAIL
            action_details = {"note": "No action permissible."}

        # Step 5: Immutable Audit Logging
        entry = AuditLogEntry(
            id=audit_id,
            transaction_id=txn.id,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
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
