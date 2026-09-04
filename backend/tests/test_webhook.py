from fastapi.testclient import TestClient

from backend.app.main import app

# Webhook tests must be hermetic: the route processes transactions with
# use_llm=True, but every case here is covered by the deterministic rules,
# so pin the LLM off to avoid live network calls in the test suite.
from backend.app.core import diagnostics

diagnostics.GMI_API_KEY = ""

client = TestClient(app)


def _post(payload: dict):
    res = client.post("/api/webhook/razorpay", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    return res.json()


def test_valid_payment_failed_webhook_processes():
    body = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_ok_1",
                    "amount": 149900,
                    "method": "upi",
                    "bank": "HDFC",
                    "error_code": "GATEWAY_ERROR",
                    "error_description": "Gateway timeout",
                    "notes": {
                        "merchant_name": "cult.fit",
                        "customer_name": "Rahul Sharma",
                        "customer_phone": "+91-9876543210",
                    },
                }
            }
        },
    }
    entry = _post(body)
    assert entry["transaction_id"] == "pay_test_ok_1"
    assert entry["intervention"] == "SMART_MANDATE_RETRY"


def test_empty_customer_name_does_not_crash():
    body = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_empty_name",
                    "amount": 50000,
                    "notes": {"merchant_name": "X", "customer_name": ""},
                }
            }
        },
    }
    entry = _post(body)
    assert entry["transaction_id"] == "pay_empty_name"


def test_whitespace_customer_name_does_not_crash():
    body = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_ws_name",
                    "amount": 50000,
                    "notes": {"merchant_name": "M", "customer_name": "   "},
                }
            }
        },
    }
    entry = _post(body)
    assert entry["transaction_id"] == "pay_ws_name"


def test_null_notes_does_not_crash():
    body = {
        "event": "payment.failed",
        "payload": {"payment": {"entity": {"id": "pay_null_notes", "amount": 50000, "notes": None}}},
    }
    entry = _post(body)
    assert entry["transaction_id"] == "pay_null_notes"


def test_non_dict_payload_does_not_crash():
    entry = _post({"event": "payment.failed", "payload": "garbage"})
    assert entry["transaction_id"].startswith("txn_")


def test_non_numeric_amount_does_not_crash():
    body = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_bad_amount",
                    "amount": "not-a-number",
                    "notes": {"customer_name": "Rahul Sharma"},
                }
            }
        },
    }
    entry = _post(body)
    assert entry["transaction_id"] == "pay_bad_amount"
    assert entry["amount_at_risk"] > 0


def test_empty_body_uses_generic_fallback():
    entry = _post({})
    assert entry["transaction_id"].startswith("txn_")


def test_invalid_json_returns_400():
    res = client.post("/api/webhook/razorpay", content="not-json{{", headers={"Content-Type": "application/json"})
    assert res.status_code == 400


def test_subscription_webhook_processes():
    body = {
        "event": "subscription.halted",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_test_1",
                    "notes": {
                        "amount": 499.0,
                        "error_code": "INSUFFICIENT_FUNDS",
                        "error_description": "Low balance",
                        "customer_name": "Sneha Patel",
                        "merchant_name": "Tata Play Binge",
                    },
                }
            }
        },
    }
    entry = _post(body)
    assert entry["transaction_id"] == "sub_test_1"
    assert entry["intervention"] == "HINGLISH_VOICE_P2P"


def test_health_and_samples_endpoints():
    assert client.get("/api/health").status_code == 200
    samples = client.get("/api/webhook/samples").json()
    assert len(samples) >= 3
