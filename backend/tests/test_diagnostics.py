import pytest
from backend.app.models.schemas import AtRiskTransaction, CustomerInfo, FailureCategory, InterventionType
from backend.app.core.diagnostics import fallback_diagnose

def make_test_txn(code: str, desc: str, channel: str = "UPI_AUTOPAY") -> AtRiskTransaction:
    return AtRiskTransaction(
        id="txn_test_001",
        merchant_id="merch_test",
        merchant_name="Test Merchant",
        merchant_category="SaaS",
        amount=1499.0,
        currency="INR",
        channel=channel,
        razorpay_error_code=code,
        razorpay_error_desc=desc,
        issuer_bank="SBIN",
        bank_uptime_pct=78.2,
        customer=CustomerInfo(
            name="Rahul Sharma",
            phone="+91-9876543210",
            email="rahul@example.in"
        ),
        attempts_made=0
    )

def test_transient_technical_diagnosis():
    txn = make_test_txn("GATEWAY_ERROR", "504 Gateway Timeout from NPCI")
    diag = fallback_diagnose(txn)
    assert diag.category == FailureCategory.TRANSIENT_TECHNICAL
    assert diag.recommended_action == InterventionType.SMART_MANDATE_RETRY
    assert diag.confidence > 0.8

def test_soft_financial_diagnosis():
    txn = make_test_txn("INSUFFICIENT_FUNDS", "Declined due to low balance")
    diag = fallback_diagnose(txn)
    assert diag.category == FailureCategory.SOFT_FINANCIAL
    assert diag.recommended_action == InterventionType.HINGLISH_VOICE_P2P

def test_hard_permanent_diagnosis():
    txn = make_test_txn("CARD_EXPIRED", "Card expired authorization failed")
    diag = fallback_diagnose(txn)
    assert diag.category == FailureCategory.HARD_PERMANENT
    assert diag.recommended_action == InterventionType.HARD_STOP_NO_ACTION

def test_behavioral_dropoff_diagnosis():
    txn = make_test_txn("CHECKOUT_DROPPED_OFF", "Customer abandoned session", channel="MAGIC_CHECKOUT")
    diag = fallback_diagnose(txn)
    assert diag.category == FailureCategory.BEHAVIORAL_DROPOFF
    assert diag.recommended_action == InterventionType.CHECKOUT_DYNAMIC_OFFER

def test_b2b_invoice_diagnosis():
    txn = make_test_txn("INVOICE_OVERDUE_30_DAYS", "Net-30 overdue", channel="B2B_INVOICE")
    diag = fallback_diagnose(txn)
    assert diag.category == FailureCategory.COMMERCIAL_DISPUTE
    assert diag.recommended_action == InterventionType.B2B_COMPLIANT_DUNNING
