import uuid
import random
import asyncio
from datetime import datetime
from typing import List, Dict, Any

from ..models.schemas import (
    AtRiskTransaction,
    BatchSummary,
    RecoveryStatus,
    InterventionType,
    FailureCategory
)
from .batch_generator import generate_synthetic_batch
from ..core.engine import RecoveryOrchestrator
from ..core.audit_logger import audit_logger
from ..core.policy_guardrails import baseline_should_skip

class BatchSimulationEngine:
    """
    Simulates and evaluates revenue recovery performance across batches.
    Produces rigorous, audited side-by-side financial measurements:
    Baseline (Naive Blind Dunning) vs. RazorRevive Autonomous AI.
    """

    @staticmethod
    def simulate_baseline_recovery(batch: List[AtRiskTransaction]) -> tuple:
        """
        Industry Baseline: Traditional merchant setup.
        - Fixed blind retries (exhausts 3 attempts quickly)
        - Generic automated email notification (open rate 18%, CTR 2%)
        - No bank uptime awareness
        - No conversational P2P tracking
        - No DND / hardship / touch-cap awareness: it keeps calling protected
          customers. That harassment produces churn, penalties and disputes —
          not recovery — so those rows contribute zero baseline revenue.
        """
        recovered_total = 0.0
        recovered_count = 0

        for txn in batch:
            # Stop logic is owned by the Guardrail module — the baseline
            # only asks whether a careful engine would refuse the row.
            # (Covers hard-stop codes, DND / hardship, and the touch ceiling.)
            if baseline_should_skip(txn):
                continue
            if txn.channel == "MAGIC_CHECKOUT":
                # Naive email cart abandonment has ~5% conversion
                if random.random() < 0.05:
                    recovered_total += txn.amount
                    recovered_count += 1
                continue
            if txn.channel == "B2B_INVOICE":
                # Naive monthly PDF statement has ~20% settlement rate
                if random.random() < 0.20:
                    recovered_total += txn.amount
                    recovered_count += 1
                continue

            # Standard mandate blind retry: ~19% success due to repeated bank downtime conflicts
            if random.random() < 0.19:
                recovered_total += txn.amount
                recovered_count += 1

        return recovered_total, recovered_count

    @staticmethod
    async def run_batch_simulation(
        size: int = 100,
        vertical_mix: List[str] = None,
        enable_llm: bool = False
    ) -> BatchSummary:
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        transactions = generate_synthetic_batch(size=size, vertical_mix=vertical_mix)
        
        total_at_risk = sum(t.amount for t in transactions)
        
        # 1. Run Baseline Simulation
        baseline_recovered, baseline_count = BatchSimulationEngine.simulate_baseline_recovery(transactions)
        baseline_rate = (baseline_recovered / total_at_risk * 100.0) if total_at_risk > 0 else 0.0

        # 2. Run RazorRevive Agentic Orchestration
        # The audit ledger is append-only: webhook-fired decisions survive
        # batch runs (the immutable trail stays immutable). Metrics below are
        # computed only from this batch's entries.
        
        # Process transactions concurrently in batches of 20
        # Simulate active operational hours (11:30 AM IST) for batch performance measurement
        from ..core.policy_guardrails import IST_OFFSET
        now = datetime.now(IST_OFFSET)
        simulation_daytime = now.replace(hour=11, minute=30, second=0)

        chunk_size = 20
        audit_entries = []
        
        for i in range(0, len(transactions), chunk_size):
            chunk = transactions[i : i + chunk_size]
            tasks = [
                RecoveryOrchestrator.process_at_risk_transaction(txn, use_llm=enable_llm, custom_time=simulation_daytime)
                for txn in chunk
            ]
            results = await asyncio.gather(*tasks)
            audit_entries.extend(results)

        # 3. Aggregate Financial and Operational Metrics
        ai_recovered = sum(e.amount_recovered for e in audit_entries)
        total_costs = sum(e.cost_incurred for e in audit_entries)
        ai_rate = (ai_recovered / total_at_risk * 100.0) if total_at_risk > 0 else 0.0
        
        incremental_lift = ai_recovered - baseline_recovered
        lift_percentage = ((ai_recovered - baseline_recovered) / baseline_recovered * 100.0) if baseline_recovered > 0 else 100.0
        net_economic_value = ai_recovered - total_costs
        roi_multiplier = (net_economic_value / total_costs) if total_costs > 0 else 0.0

        # Operational breakdowns
        guardrail_stops = sum(1 for e in audit_entries if e.final_status == RecoveryStatus.STOPPED_GUARDRAIL)
        
        interventions_breakdown: Dict[str, int] = {}
        categories_breakdown: Dict[str, int] = {}

        for e in audit_entries:
            iv = e.intervention.value
            cat = e.diagnosis.category.value
            interventions_breakdown[iv] = interventions_breakdown.get(iv, 0) + 1
            categories_breakdown[cat] = categories_breakdown.get(cat, 0) + 1

        summary = BatchSummary(
            batch_id=batch_id,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            total_transactions=len(transactions),
            total_revenue_at_risk=round(total_at_risk, 2),
            total_recovered_ai=round(ai_recovered, 2),
            recovery_rate_ai=round(ai_rate, 2),
            total_recovered_baseline=round(baseline_recovered, 2),
            recovery_rate_baseline=round(baseline_rate, 2),
            incremental_lift_rupees=round(incremental_lift, 2),
            lift_percentage=round(lift_percentage, 2),
            total_operational_cost=round(total_costs, 2),
            net_economic_value=round(net_economic_value, 2),
            roi_multiplier=round(roi_multiplier, 1),
            guardrail_stops_count=guardrail_stops,
            interventions_breakdown=interventions_breakdown,
            categories_breakdown=categories_breakdown,
            audit_log_count=len(audit_entries),
            sample_audit_entries=audit_entries[:15]
        )
        return summary
