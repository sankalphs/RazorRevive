"""Tests for the local ML diagnosis layer (Phase 3 integration)."""

import pytest
from backend.app.models.schemas import (
    AtRiskTransaction,
    CustomerInfo,
    FailureCategory,
    InterventionType,
)
from backend.app.core.diagnostics import deterministic_adapter
from backend.app.core import ml_model


def make_txn(code: str, desc: str, channel: str = "UPI_AUTOPAY") -> AtRiskTransaction:
    return AtRiskTransaction(
        id="txn_ml_001",
        merchant_id="merch_test",
        merchant_name="Test Merchant",
        merchant_category="SaaS",
        amount=1499.0,
        channel=channel,
        razorpay_error_code=code,
        razorpay_error_desc=desc,
        issuer_bank="SBIN",
        bank_uptime_pct=78.2,
        customer=CustomerInfo(name="Rahul", phone="+91-9876543210", email="r@example.in"),
        attempts_made=0,
    )


def test_known_code_still_uses_exact_rule():
    txn = make_txn("INSUFFICIENT_FUNDS", "Declined due to low balance")
    diag = deterministic_adapter(txn)
    assert diag.category == FailureCategory.SOFT_FINANCIAL
    assert diag.confidence == pytest.approx(0.96)


def test_novel_code_uses_ml_classifier():
    pytest.importorskip("sklearn")
    if not ml_model.MODEL_PATH.exists():
        pytest.skip("model artefact not built")
    txn = make_txn("SOME_NEW_GATEWAY_BLIP", "account me paise nahi hai, balance insufficient")
    diag = deterministic_adapter(txn)
    assert diag.category == FailureCategory.SOFT_FINANCIAL
    assert diag.recommended_action == InterventionType.HINGLISH_VOICE_P2P
    assert "ML classifier" in diag.ai_reasoning


def test_gibberish_falls_back_to_heuristics():
    txn = make_txn("TOTALLY_UNKNOWN_XYZ", "zzzqqq kkk www 12345")
    diag = deterministic_adapter(txn)
    # Low ML confidence -> heuristic default (transient technical).
    assert diag.category == FailureCategory.TRANSIENT_TECHNICAL


def test_missing_model_never_blocks_recovery(monkeypatch):
    monkeypatch.setattr(ml_model, "MODEL_PATH", ml_model.MODEL_PATH.with_name("nope.joblib"))
    monkeypatch.setattr(ml_model, "_model", None)
    monkeypatch.setattr(ml_model, "_model_failed", False)
    txn = make_txn("SOME_NEW_BLIP", "account me paise nahi hai")
    diag = deterministic_adapter(txn)
    assert isinstance(diag.category, FailureCategory)
