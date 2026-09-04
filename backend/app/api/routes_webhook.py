import uuid
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from ..models.schemas import AtRiskTransaction, CustomerInfo, RecoveryStatus, AuditLogEntry
from ..core.engine import RecoveryOrchestrator

router = APIRouter(prefix="/api/webhook", tags=["Razorpay Webhooks"])

SAMPLE_PAYLOADS = {
    "payment_failed_gateway": {
        "event": "payment.failed",
        "entity": "event",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_O1j2K3l4M5n6P7",
                    "amount": 149900,  # in paise
                    "currency": "INR",
                    "status": "failed",
                    "method": "upi",
                    "bank": "SBIN",
                    "error_code": "GATEWAY_ERROR",
                    "error_description": "Payment processing failed due to bank partner gateway timeout.",
                    "notes": {
                        "merchant_name": "cult.fit",
                        "customer_name": "Rahul Sharma",
                        "customer_phone": "+91-9876543210",
                        "category": "SaaS"
                    }
                }
            }
        }
    },
    "subscription_halted_insufficient_funds": {
        "event": "subscription.halted",
        "entity": "event",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_K8l9M0n1O2p3Q4",
                    "plan_id": "plan_monthly_binge",
                    "status": "halted",
                    "current_start": 1756890000,
                    "notes": {
                        "merchant_name": "Tata Play Binge",
                        "customer_name": "Sneha Patel",
                        "customer_phone": "+91-9823456789",
                        "amount": 499.0,
                        "error_code": "INSUFFICIENT_FUNDS",
                        "error_description": "Mandate debit declined: Insufficient balance in customer account."
                    }
                }
            }
        }
    },
    "hard_decline_card_expired": {
        "event": "payment.failed",
        "entity": "event",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_X9y8Z7w6V5u4T3",
                    "amount": 350000,
                    "currency": "INR",
                    "status": "failed",
                    "method": "card",
                    "bank": "ICIC",
                    "error_code": "CARD_EXPIRED",
                    "error_description": "Card expiry date reached. Issuer declined mandate debit.",
                    "notes": {
                        "merchant_name": "boAt Lifestyle",
                        "customer_name": "Vikram Singh",
                        "customer_phone": "+91-9123456780",
                        "category": "D2C"
                    }
                }
            }
        }
    }
}

@router.get("/samples")
async def get_sample_webhooks():
    return SAMPLE_PAYLOADS

@router.post("/razorpay", response_model=AuditLogEntry)
async def handle_razorpay_webhook(req: Request):
    """
    Ingests and recovers live Razorpay webhooks in real-time.
    Routes by payload shape (payment / subscription entity) and uses the
    event type to channel non-payment events (e.g. invoice.overdue) to
    the right recovery lane. Unknown events still parse defensively.
    """
    try:
        body: Dict[str, Any] = await req.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload. Send a valid Razorpay webhook object.")
    event_type = str(body.get("event", "payment.failed"))
    raw_payload = body.get("payload", {})
    payload = raw_payload if isinstance(raw_payload, dict) else {}
    merchant_name = customer_name = category = ""

    # Extract entity details safely
    if isinstance(payload.get("payment"), dict):
        wrapped = payload["payment"].get("entity", {}) or {}
        entity = wrapped if isinstance(wrapped, dict) else {}
        # Preserve the caller's payment id so ledger entries correlate
        # 1:1 with the source webhook.
        source_ref = entity.get("id")
        try:
            amount = float(entity.get("amount", 100000)) / 100.0  # paise to INR
        except (TypeError, ValueError):
            amount = 1499.0
        error_code = entity.get("error_code") or "GATEWAY_ERROR"
        error_desc = entity.get("error_description") or "Payment transaction failed"
        bank = entity.get("bank") or "HDFC"
        raw_notes = entity.get("notes", {})
        notes = raw_notes if isinstance(raw_notes, dict) else {}
        channel = "UPI_AUTOPAY" if entity.get("method") == "upi" else "CARD_MANDATE"
    elif isinstance(payload.get("subscription"), dict):
        wrapped = payload["subscription"].get("entity", {}) or {}
        entity = wrapped if isinstance(wrapped, dict) else {}
        source_ref = entity.get("id")
        raw_notes = entity.get("notes", {})
        notes = raw_notes if isinstance(raw_notes, dict) else {}
        try:
            amount = float(notes.get("amount", 999.0))
        except (TypeError, ValueError):
            amount = 999.0
        error_code = notes.get("error_code") or "INSUFFICIENT_FUNDS"
        error_desc = notes.get("error_description") or "Subscription debit halted"
        bank = "SBIN"
        channel = "UPI_AUTOPAY"
    else:
        # Fallback generic parsing. The event type keeps invoice/receivable
        # events out of the card-mandate lane instead of fabricating a
        # gateway failure for them.
        entity = {}
        notes = payload.get("invoice", {}).get("entity", {}) if isinstance(payload.get("invoice"), dict) else {}
        if not isinstance(notes, dict):
            notes = {}
        source_ref = notes.get("id") or notes.get("invoice_id")
        try:
            amount = float(notes.get("amount", notes.get("amount_paid", 1499.0)))
        except (TypeError, ValueError):
            amount = 1499.0
        if "invoice" in event_type or "order" in event_type:
            error_code = "INVOICE_OVERDUE_30_DAYS"
            error_desc = "Invoice receivable event received via webhook"
            channel = "B2B_INVOICE"
        else:
            error_code = "GATEWAY_ERROR"
            error_desc = "Transaction failed"
            channel = "GATEWAY_CHECKOUT"
        bank = "HDFC"
        merchant_name = (notes.get("merchant_name") or "").strip()
        customer_name = (notes.get("customer_name") or "").strip()
        category = (notes.get("category") or "B2B" if "invoice" in event_type else "SaaS")
        if not customer_name and not merchant_name and not source_ref:
            # Nothing recognizable at all — fall back to checkout defaults
            error_code = "GATEWAY_ERROR"
            error_desc = "Transaction failed"
            channel = "GATEWAY_CHECKOUT"
            category = "SaaS"

    # Defensive defaults: partial / malformed webhook notes must never 500.
    # Preset vars (merchant_name/customer_name/category) survive from the
    # event-type branch above when the payload already provided them.
    merchant_name = (merchant_name or notes.get("merchant_name") or "Demo Merchant").strip() or "Demo Merchant"
    customer_name = (customer_name or notes.get("customer_name") or "Siddharth Verma").strip() or "Siddharth Verma"
    phone = (notes.get("customer_phone") or "+91-9876500000").strip() or "+91-9876500000"
    category = (category or notes.get("category") or "SaaS")
    category = category.strip() if isinstance(category, str) else "SaaS"
    category = category or "SaaS"

    # Resolve live issuer health behind the Mandate module seam.
    from ..interventions.mandate_sequencer import MandateRetrySequencer
    bank_health = MandateRetrySequencer.get_bank_health(bank)
    bank_uptime = bank_health.get("uptime_pct", 94.0)

    # Build internal AtRiskTransaction (keep the source id when present)
    txn = AtRiskTransaction(
        id=source_ref or f"txn_{uuid.uuid4().hex[:12]}",
        merchant_id=f"merch_{merchant_name.lower().replace(' ', '_')}",
        merchant_name=merchant_name,
        merchant_category=category,
        amount=amount,
        currency="INR",
        channel=channel,
        razorpay_error_code=error_code,
        razorpay_error_desc=error_desc,
        issuer_bank=bank,
        bank_uptime_pct=bank_uptime,
        customer=CustomerInfo(
            name=customer_name,
            phone=phone,
            email=f"{customer_name.split()[0].lower()}@example.in",
            vpa=f"{customer_name.split()[0].lower()}@okhdfcbank"
        ),
        attempts_made=0,
        status=RecoveryStatus.AT_RISK
    )
    # Process through autonomous orchestrator
    audit_entry = await RecoveryOrchestrator.process_at_risk_transaction(txn, use_llm=True)
    return audit_entry
