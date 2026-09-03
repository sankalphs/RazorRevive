from datetime import datetime, timezone, timedelta
from backend.app.models.schemas import AtRiskTransaction, CustomerInfo, FailureCategory
from backend.app.core.policy_guardrails import (
    evaluate_compliance_and_guardrails,
    is_within_rbi_contact_hours,
    check_customer_opt_out,
    check_customer_hardship,
    IST_OFFSET
)

def make_txn(attempts: int = 0, is_dnd: bool = False, is_hardship: bool = False, code: str = "INSUFFICIENT_FUNDS") -> AtRiskTransaction:
    return AtRiskTransaction(
        id="txn_guardrail_001",
        merchant_id="merch_cultfit",
        merchant_name="cult.fit",
        merchant_category="SaaS",
        amount=1499.0,
        currency="INR",
        channel="UPI_AUTOPAY",
        razorpay_error_code=code,
        razorpay_error_desc="Debit failed",
        issuer_bank="HDFC",
        bank_uptime_pct=99.0,
        customer=CustomerInfo(
            name="Rahul Sharma",
            phone="+91-9876543210",
            email="rahul@example.in",
            is_dnd=is_dnd,
            is_hardship=is_hardship
        ),
        attempts_made=attempts
    )

def test_hard_stop_on_permanent_decline():
    txn = make_txn(code="FRAUD_DETECTED")
    compliance = evaluate_compliance_and_guardrails(txn, FailureCategory.HARD_PERMANENT)
    assert not compliance.is_compliant
    assert not compliance.not_hard_declined
    assert "HARD_STOP_TRIGGERED" in compliance.reason

def test_dnd_opt_out_stop():
    txn = make_txn(is_dnd=True)
    compliance = evaluate_compliance_and_guardrails(txn, FailureCategory.SOFT_FINANCIAL)
    assert not compliance.is_compliant
    assert not compliance.dnd_clear
    assert "DND_ACTIVE" in compliance.reason

def test_hardship_stop():
    txn = make_txn(is_hardship=True)
    compliance = evaluate_compliance_and_guardrails(txn, FailureCategory.SOFT_FINANCIAL)
    assert not compliance.is_compliant
    assert not compliance.dispute_clear
    assert "HARDSHIP_DETECTED" in compliance.reason

def test_touchpoint_ceiling():
    txn = make_txn(attempts=3)
    compliance = evaluate_compliance_and_guardrails(txn, FailureCategory.SOFT_FINANCIAL)
    assert not compliance.is_compliant
    assert not compliance.within_touch_limit
    assert "TOUCH_LIMIT_EXCEEDED" in compliance.reason

def test_rbi_contact_hours_compliance():
    # Test during permitted hours (e.g. 11:30 AM IST)
    permitted_time = datetime(2026, 9, 3, 11, 30, tzinfo=IST_OFFSET)
    rbi_ok, defer = is_within_rbi_contact_hours(permitted_time)
    assert rbi_ok
    assert defer is None

    # Test during restricted night hours (e.g. 11:00 PM IST)
    restricted_time = datetime(2026, 9, 3, 23, 0, tzinfo=IST_OFFSET)
    rbi_ok_night, defer_night = is_within_rbi_contact_hours(restricted_time)
    assert not rbi_ok_night
    assert defer_night is not None

def test_opt_out_keyword_detection():
    assert check_customer_opt_out("Please stop calling me")
    assert check_customer_opt_out("mat phone karo please")
    assert not check_customer_opt_out("Kal shaam ko link bhej do")

def test_hardship_keyword_detection():
    assert check_customer_hardship("I am in the hospital and jobless right now")
    assert check_customer_hardship("paise nahi hai mere paas abhi")
    assert not check_customer_hardship("I will pay tomorrow morning")
