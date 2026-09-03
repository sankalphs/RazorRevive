import re
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from ..config import RBI_START_HOUR_IST, RBI_END_HOUR_IST, MAX_TOUCHPOINTS
from ..models.schemas import AtRiskTransaction, FailureCategory, ComplianceCheck

# IST Timezone: UTC + 5:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))

HARD_STOP_ERROR_CODES = {
    "CARD_EXPIRED",
    "ACCOUNT_CLOSED",
    "FRAUD_DETECTED",
    "STOLEN_CARD",
    "INVALID_VPA_PERMANENT",
    "MANDATE_REVOKED_BY_USER",
    "ACCOUNT_FROZEN",
    "DO_NOT_HONOUR_PERMANENT"
}

# Word-boundary regex patterns to avoid false positives:
# plain substring "fir" would wrongly match "confirm"/"first", and
# "hospital" would wrongly match "hospitality".
OPT_OUT_PATTERNS = [
    r"\bstop\b",
    r"\bunsubscrib\w*",
    r"\bopt[\s-]?outs?\b",
    r"mat phone karo",
    r"call mat karo",
    r"don'?t call",
    r"\bharass\w*",
    r"\bpolice\b",
    r"\bfir\b",
    r"\bblock(?:ed|ing|s)?\b",
    r"\bspam(?:s|med)?\b",
    r"\bcomplaints?\b",
]

HARDSHIP_PATTERNS = [
    r"\bjobless\b",
    r"\bno money\b",
    r"\blost\s+(?:my\s+|a\s+)?job\b",
    r"\bhospital(?:ized|ised)?\b",
    r"\bmedical emergency\b",
    r"\bbimar\b",
    r"\bpaise nahi\b",
    r"\bgarib\b",
    r"\bhardship\b",
    r"\bbankrupt(?:cy)?\b",
    r"\bdebt trap\b",
]

def get_current_ist_time() -> datetime:
    """Returns current time in Indian Standard Time (IST)."""
    return datetime.now(timezone.utc).astimezone(IST_OFFSET)

def is_within_rbi_contact_hours(custom_time: Optional[datetime] = None) -> Tuple[bool, Optional[str]]:
    """
    RBI Compliance: Calling & SMS recovery communication must only happen
    between 08:00 AM IST and 07:00 PM IST (19:00).
    """
    ist_time = custom_time if custom_time else get_current_ist_time()
    hour = ist_time.hour
    
    if RBI_START_HOUR_IST <= hour < RBI_END_HOUR_IST:
        return True, None
    else:
        # Calculate next valid morning window (08:30 AM IST next day or today)
        if hour >= RBI_END_HOUR_IST:
            next_morning = (ist_time + timedelta(days=1)).replace(hour=8, minute=30, second=0, microsecond=0)
        else:
            next_morning = ist_time.replace(hour=8, minute=30, second=0, microsecond=0)
        return False, next_morning.strftime("%Y-%m-%d %H:%M:%S IST")

def check_customer_opt_out(text: str) -> bool:
    """Checks if message contains opt-out / DND request."""
    lower = text.lower()
    return any(re.search(p, lower) for p in OPT_OUT_PATTERNS)

def check_customer_hardship(text: str) -> bool:
    """Checks if message indicates financial distress or hardship."""
    lower = text.lower()
    return any(re.search(p, lower) for p in HARDSHIP_PATTERNS)

def evaluate_compliance_and_guardrails(
    txn: AtRiskTransaction,
    category: FailureCategory,
    custom_time: Optional[datetime] = None
) -> ComplianceCheck:
    """
    Evaluates all regulatory, safety, and operational guardrails for a recovery action.
    Returns ComplianceCheck object.
    """
    # 1. Hard Decline Check
    is_hard_stop = (
        category == FailureCategory.HARD_PERMANENT or 
        txn.razorpay_error_code in HARD_STOP_ERROR_CODES
    )
    if is_hard_stop:
        return ComplianceCheck(
            is_compliant=False,
            rbi_hours_ok=True,
            within_touch_limit=True,
            not_hard_declined=False,
            dnd_clear=True,
            dispute_clear=True,
            reason="HARD_STOP_TRIGGERED: Permanent decline (card expired, account closed, or fraud risk). Immediate stop."
        )

    # 2. DND / Opt-Out Check
    if txn.customer.is_dnd:
        return ComplianceCheck(
            is_compliant=False,
            rbi_hours_ok=True,
            within_touch_limit=True,
            not_hard_declined=True,
            dnd_clear=False,
            dispute_clear=True,
            reason="DND_ACTIVE: Customer is registered on National Do Not Call / opt-out registry."
        )

    # 3. Customer Hardship Check
    if txn.customer.is_hardship:
        return ComplianceCheck(
            is_compliant=False,
            rbi_hours_ok=True,
            within_touch_limit=True,
            not_hard_declined=True,
            dnd_clear=True,
            dispute_clear=False,
            reason="HARDSHIP_DETECTED: Customer flagged for financial distress. Dunning paused for compassionate review."
        )

    # 4. Anti-Harassment Touchpoint Ceiling
    if txn.attempts_made >= MAX_TOUCHPOINTS:
        return ComplianceCheck(
            is_compliant=False,
            rbi_hours_ok=True,
            within_touch_limit=False,
            not_hard_declined=True,
            dnd_clear=True,
            dispute_clear=True,
            reason=f"TOUCH_LIMIT_EXCEEDED: Maximum bounded contacts ({MAX_TOUCHPOINTS}) reached. Stopping further outreach."
        )

    # 5. RBI Contact Hours Check
    rbi_ok, defer_time = is_within_rbi_contact_hours(custom_time)
    if not rbi_ok:
        return ComplianceCheck(
            is_compliant=False,
            rbi_hours_ok=False,
            within_touch_limit=True,
            not_hard_declined=True,
            dnd_clear=True,
            dispute_clear=True,
            reason="OUTSIDE_RBI_HOURS: Calling/nudging restricted between 19:00 and 08:00 IST. Workflow deferred.",
            deferred_until_ist=defer_time
        )

    # All compliance tests passed
    return ComplianceCheck(
        is_compliant=True,
        rbi_hours_ok=True,
        within_touch_limit=True,
        not_hard_declined=True,
        dnd_clear=True,
        dispute_clear=True,
        reason="ALL_GUARDRAILS_PASSED: Compliant with RBI contact hours, touch ceilings, and opt-out registries."
    )
