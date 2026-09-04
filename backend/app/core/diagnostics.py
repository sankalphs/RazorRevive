import json
import logging
import httpx
from typing import Dict, Optional
from ..config import GMI_BASE_URL, GMI_API_KEY, GMI_MODEL
from ..models.schemas import (
    AtRiskTransaction,
    DiagnosisResult,
    FailureCategory,
    InterventionType
)

logger = logging.getLogger("RazorRevive.Diagnostics")

# Deterministic rule map for fast/reliable heuristics & fallback
DETERMINISTIC_RULES = {
    # Transient technical
    "GATEWAY_ERROR": (FailureCategory.TRANSIENT_TECHNICAL, InterventionType.SMART_MANDATE_RETRY, 2),
    "BANK_DEBIT_FAILED_TECHNICAL": (FailureCategory.TRANSIENT_TECHNICAL, InterventionType.SMART_MANDATE_RETRY, 3),
    "NPCI_TIMEOUT": (FailureCategory.TRANSIENT_TECHNICAL, InterventionType.SMART_MANDATE_RETRY, 1),
    "TOKENIZATION_TIMEOUT": (FailureCategory.TRANSIENT_TECHNICAL, InterventionType.SMART_MANDATE_RETRY, 2),
    "OTP_TIMEOUT": (FailureCategory.TRANSIENT_TECHNICAL, InterventionType.WHATSAPP_MAGIC_LINK, 0),

    # Soft financial
    "INSUFFICIENT_FUNDS": (FailureCategory.SOFT_FINANCIAL, InterventionType.HINGLISH_VOICE_P2P, 24),
    "UPI_DAILY_LIMIT_EXCEEDED": (FailureCategory.SOFT_FINANCIAL, InterventionType.WHATSAPP_MAGIC_LINK, 12),
    "MANDATE_AMOUNT_EXCEEDS_CAP": (FailureCategory.SOFT_FINANCIAL, InterventionType.WHATSAPP_MAGIC_LINK, 0),

    # Hard permanent
    "CARD_EXPIRED": (FailureCategory.HARD_PERMANENT, InterventionType.HARD_STOP_NO_ACTION, 0),
    "ACCOUNT_CLOSED": (FailureCategory.HARD_PERMANENT, InterventionType.HARD_STOP_NO_ACTION, 0),
    "FRAUD_DETECTED": (FailureCategory.HARD_PERMANENT, InterventionType.HARD_STOP_NO_ACTION, 0),
    "STOLEN_CARD": (FailureCategory.HARD_PERMANENT, InterventionType.HARD_STOP_NO_ACTION, 0),
    "INVALID_VPA_PERMANENT": (FailureCategory.HARD_PERMANENT, InterventionType.HARD_STOP_NO_ACTION, 0),

    # Behavioral dropoff
    "CHECKOUT_DROPPED_OFF": (FailureCategory.BEHAVIORAL_DROPOFF, InterventionType.CHECKOUT_DYNAMIC_OFFER, 0),
    "CART_ABANDONED_SHIPPING_FRICTION": (FailureCategory.BEHAVIORAL_DROPOFF, InterventionType.CHECKOUT_DYNAMIC_OFFER, 0),
    "PAYMENT_METHOD_UNAVAILABLE": (FailureCategory.BEHAVIORAL_DROPOFF, InterventionType.WHATSAPP_MAGIC_LINK, 0),

    # Commercial / B2B
    "INVOICE_OVERDUE_30_DAYS": (FailureCategory.COMMERCIAL_DISPUTE, InterventionType.B2B_COMPLIANT_DUNNING, 0),
    "INVOICE_APPROVAL_PENDING": (FailureCategory.COMMERCIAL_DISPUTE, InterventionType.B2B_COMPLIANT_DUNNING, 0),
    "PURCHASE_ORDER_MISMATCH": (FailureCategory.COMMERCIAL_DISPUTE, InterventionType.B2B_COMPLIANT_DUNNING, 0),
}

def fallback_diagnose(txn: AtRiskTransaction) -> DiagnosisResult:
    """Fast, deterministic diagnostic fallback matching error codes and heuristics."""
    code = txn.razorpay_error_code
    
    # Check exact match
    if code in DETERMINISTIC_RULES:
        cat, action, delay = DETERMINISTIC_RULES[code]
        reason = f"Deterministic rule match: {code} mapped to {cat.value}. Bank uptime is {txn.bank_uptime_pct}%."
        return DiagnosisResult(
            category=cat,
            root_cause=txn.razorpay_error_desc or code,
            confidence=0.96,
            recommended_action=action,
            ai_reasoning=reason,
            recommended_retry_delay_hours=delay
        )

    # Keyword heuristics
    desc_lower = (txn.razorpay_error_desc or "").lower()
    if any(k in desc_lower for k in ["insufficient", "balance", "funds", "limit"]):
        return DiagnosisResult(
            category=FailureCategory.SOFT_FINANCIAL,
            root_cause="Customer balance temporarily insufficient or UPI transaction limit reached",
            confidence=0.88,
            recommended_action=InterventionType.HINGLISH_VOICE_P2P,
            ai_reasoning="Soft financial decline. Best resolved via empathetic Hinglish conversational agent with Promise-to-Pay tracking.",
            recommended_retry_delay_hours=24
        )
    elif any(k in desc_lower for k in ["expired", "closed", "stolen", "fraud", "invalid"]):
        return DiagnosisResult(
            category=FailureCategory.HARD_PERMANENT,
            root_cause="Permanent failure code: Instrument expired or flagged",
            confidence=0.98,
            recommended_action=InterventionType.HARD_STOP_NO_ACTION,
            ai_reasoning="Permanent decline. Retrying will waste resources and annoy customer. Hard stop enforced.",
            recommended_retry_delay_hours=0
        )
    elif "abandon" in desc_lower or "drop" in desc_lower or txn.channel == "MAGIC_CHECKOUT":
        return DiagnosisResult(
            category=FailureCategory.BEHAVIORAL_DROPOFF,
            root_cause="User dropped off during checkout journey",
            confidence=0.91,
            recommended_action=InterventionType.CHECKOUT_DYNAMIC_OFFER,
            ai_reasoning="Cart drop-off detected. Dynamic Magic Checkout link with bounded incentive (5% discount or free delivery) recommended.",
            recommended_retry_delay_hours=0
        )
    elif txn.channel == "B2B_INVOICE" or "invoice" in desc_lower:
        return DiagnosisResult(
            category=FailureCategory.COMMERCIAL_DISPUTE,
            root_cause="Overdue B2B receivable awaiting enterprise procurement clearance",
            confidence=0.89,
            recommended_action=InterventionType.B2B_COMPLIANT_DUNNING,
            ai_reasoning="B2B accounts receivable dunning ladder: polite reminder with split payment / direct virtual account link.",
            recommended_retry_delay_hours=0
        )
    else:
        # Default to transient technical with bank-uptime retry
        return DiagnosisResult(
            category=FailureCategory.TRANSIENT_TECHNICAL,
            root_cause="Downstream issuer bank gateway glitch or timeout",
            confidence=0.84,
            recommended_action=InterventionType.SMART_MANDATE_RETRY,
            ai_reasoning=f"Transient technical gateway issue. Issuer bank {txn.issuer_bank} uptime currently at {txn.bank_uptime_pct}%. Smart delay recommended.",
            recommended_retry_delay_hours=4
        )

def _canonical_mapping_prose() -> str:
    """Renders the single rule table as prompt prose.

    The LLM prompt never hand-lists error codes again — it is generated
    from DETERMINISTIC_RULES, so the table is the one truth.
    """
    grouped: Dict[str, list] = {}
    for code, (cat, action, _delay) in DETERMINISTIC_RULES.items():
        grouped.setdefault(f"{cat.value} + {action.value}", []).append(code)
    lines = []
    for verdict, codes in sorted(grouped.items()):
        lines.append(f"- {', '.join(sorted(codes))} -> {verdict}")
    return "\n".join(lines)


def parse_llm_diagnosis_json(raw_text: str, txn: AtRiskTransaction) -> DiagnosisResult:
    """Parses LLM JSON output into a DiagnosisResult.

    Pure and directly testable: markdown-fence stripping, JSON decode,
    and enum coercion all live here instead of inline in the network caller.
    Raises ValueError on undecodable content so callers can fall back.
    """
    text = raw_text.strip()
    # Clean any markdown code blocks
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.strip().startswith("json"):
                text = text.strip()[4:]
    parsed = json.loads(text.strip())
    return DiagnosisResult(
        category=FailureCategory(parsed.get("category", "TRANSIENT_TECHNICAL")),
        root_cause=parsed.get("root_cause", txn.razorpay_error_desc),
        confidence=float(parsed.get("confidence", 0.92)),
        recommended_action=InterventionType(parsed.get("recommended_action", "SMART_MANDATE_RETRY")),
        ai_reasoning=parsed.get("ai_reasoning", "LLM agentic root-cause diagnosis completed."),
        recommended_retry_delay_hours=int(parsed.get("recommended_retry_delay_hours", 2))
    )


def deterministic_adapter(txn: AtRiskTransaction) -> DiagnosisResult:
    """In-memory deterministic adapter: no network, safe for tests.

    Cascade: exact rule match first (precision on known codes), then the
    local ML classifier (generalisation to novel/paraphrased gateway text),
    then keyword heuristics. Never blocks recovery.
    """
    if txn.razorpay_error_code in DETERMINISTIC_RULES:
        return fallback_diagnose(txn)
    try:
        from .ml_model import ml_diagnose

        ml_result = ml_diagnose(txn)
        if ml_result is not None:
            return ml_result
    except Exception as e:
        logger.warning(f"ML diagnosis skipped ({e}), using heuristics.")
    return fallback_diagnose(txn)


async def llm_adapter(txn: AtRiskTransaction) -> DiagnosisResult:
    """LLM adapter: network call with graceful fallback to deterministic."""
    prompt = f"""You are RazorRevive AI, an expert fintech recovery diagnostician for Razorpay.
Analyze this payment failure / revenue at risk event and output a JSON diagnosis:

Transaction Data:
- Merchant: {txn.merchant_name} ({txn.merchant_category})
- Amount: INR {txn.amount}
- Channel: {txn.channel}
- Razorpay Error Code: {txn.razorpay_error_code}
- Error Description: {txn.razorpay_error_desc}
- Issuer Bank: {txn.issuer_bank} (Current Bank Gateway Uptime: {txn.bank_uptime_pct}%)
- Customer Segment: {txn.customer.customer_segment}
- Attempts Made: {txn.attempts_made}

Classify into exactly one Category:
["TRANSIENT_TECHNICAL", "SOFT_FINANCIAL", "HARD_PERMANENT", "BEHAVIORAL_DROPOFF", "COMMERCIAL_DISPUTE"]

Select exactly one Recommended Action:
["SMART_MANDATE_RETRY", "HINGLISH_VOICE_P2P", "WHATSAPP_MAGIC_LINK", "CHECKOUT_DYNAMIC_OFFER", "B2B_COMPLIANT_DUNNING", "HARD_STOP_NO_ACTION"]

For known Razorpay error codes, use this canonical mapping unless the transaction data clearly contradicts it:
{_canonical_mapping_prose()}

Respond strictly in valid JSON without markdown formatting:
{{
  "category": "TRANSIENT_TECHNICAL",
  "root_cause": "brief explanation",
  "confidence": 0.95,
  "recommended_action": "SMART_MANDATE_RETRY",
  "ai_reasoning": "1-2 sentences explaining why this action wins back the money safely",
  "recommended_retry_delay_hours": 2
}}
"""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{GMI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GMI_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a precise JSON-only fintech risk diagnostics model."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
            )

            if res.status_code == 200:
                data = res.json()
                raw_text = data["choices"][0]["message"]["content"].strip()
                try:
                    return parse_llm_diagnosis_json(raw_text, txn)
                except Exception as e:
                    logger.warning(f"LLM diagnosis parse failed ({e}), falling back to deterministic engine.")
    except Exception as e:
        logger.warning(f"LLM diagnosis failed or timed out ({e}), falling back to deterministic engine.")

    return deterministic_adapter(txn)

async def diagnose_transaction_ai(txn: AtRiskTransaction, use_llm: bool = True) -> DiagnosisResult:
    """
    Single Diagnosis interface: deterministic adapter in tests / fallback,
    LLM adapter in prod. Two adapters justify the seam.
    """
    if not use_llm or not GMI_API_KEY:
        return deterministic_adapter(txn)
    return await llm_adapter(txn)


# Single-interface alias: prefer `diagnose_transaction` in new code.
async def diagnose_transaction(txn: AtRiskTransaction, use_llm: bool = True) -> DiagnosisResult:
    return await diagnose_transaction_ai(txn, use_llm=use_llm)
