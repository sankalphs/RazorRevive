import asyncio
import random
from backend.app.simulation.batch_generator import generate_synthetic_batch
from backend.app.simulation.batch_runner import BatchSimulationEngine

def test_batch_generator_sanity():
    random.seed(42)
    batch = generate_synthetic_batch(size=50)
    assert len(batch) == 50
    for txn in batch:
        assert txn.amount > 0
        assert txn.currency == "INR"
        assert txn.customer.phone.startswith("+91-")
        assert txn.issuer_bank in ["HDFC", "SBIN", "ICIC", "UTIB", "KKBK"]

def test_batch_runner_financial_math():
    # Deterministic seed keeps the B2B-heavy baseline variance controlled
    random.seed(7)
    summary = asyncio.run(BatchSimulationEngine.run_batch_simulation(size=60, enable_llm=False))

    assert summary.total_transactions == 60
    assert summary.total_revenue_at_risk > 0
    assert 0 <= summary.total_recovered_ai <= summary.total_revenue_at_risk
    assert 0 <= summary.total_recovered_baseline <= summary.total_revenue_at_risk
    # AI recovery must strictly beat the naive baseline on the seeded batch
    assert summary.recovery_rate_ai > summary.recovery_rate_baseline
    assert summary.incremental_lift_rupees > 0
    assert summary.total_operational_cost > 0
    assert summary.audit_log_count == 60
    # Net value accounting: recovered minus cost, within rounding tolerance
    assert abs(summary.net_economic_value - (summary.total_recovered_ai - summary.total_operational_cost)) < 0.05
    # Breakdowns must cover every audited event exactly once
    assert sum(summary.interventions_breakdown.values()) == 60
    assert sum(summary.categories_breakdown.values()) == 60
    # Guardrail stops are a real, non-negative outcome on any realistic batch
    assert summary.guardrail_stops_count >= 0

def test_baseline_never_recovers_from_protected_customers():
    from backend.app.models.schemas import CustomerInfo, RecoveryStatus
    random.seed(11)
    protected_codes = ("INSUFFICIENT_FUNDS",)
    batch = generate_synthetic_batch(size=40)
    # Force every row into a protected class the naive loop must not touch
    for i, txn in enumerate(batch):
        if i % 2 == 0:
            txn.customer.is_dnd = True
        elif i % 3 == 0:
            txn.customer.is_hardship = True
        else:
            txn.attempts_made = 3
    recovered_total, recovered_count = BatchSimulationEngine.simulate_baseline_recovery(batch)
    assert recovered_total == 0.0
    assert recovered_count == 0

def test_generator_channel_coherence():
    from backend.app.simulation.batch_generator import CHANNEL_FAILURE_PRESETS
    random.seed(3)
    batch = generate_synthetic_batch(size=120)
    for txn in batch:
        valid = {p[0] for p in CHANNEL_FAILURE_PRESETS[txn.channel]}
        assert txn.razorpay_error_code in valid, (
            f"{txn.razorpay_error_code} is not a plausible failure for channel {txn.channel}"
        )
