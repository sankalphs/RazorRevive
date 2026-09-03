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
    # AI recovery rate should consistently beat baseline
    assert summary.recovery_rate_ai >= summary.recovery_rate_baseline
    assert summary.incremental_lift_rupees >= 0
    assert summary.total_operational_cost > 0
    assert summary.audit_log_count == 60
    # Accounting integrity: recovered + costs must never exceed at-risk
    assert summary.total_recovered_ai + summary.total_operational_cost <= summary.total_revenue_at_risk + summary.total_operational_cost
    # Check that guardrail stops exist
    assert summary.guardrail_stops_count >= 0
