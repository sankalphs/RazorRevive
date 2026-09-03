"""Shared contract for every Intervention module.

Each ``execute_*`` returns ``(status, details, recovered)`` where
``details`` always carries ``cost_incurred``. The Recovery module reads
the cost from there instead of re-pricing each intervention locally,
so there is exactly one owner of settlement math per intervention.
"""
from typing import Dict, Any, NamedTuple

from ..models.schemas import RecoveryStatus


class InterventionOutcome(NamedTuple):
    status: RecoveryStatus
    details: Dict[str, Any]
    recovered: float


# Base dispatch fees (INR) before intervention-specific margin (discounts).
INTERVENTION_BASE_COSTS: Dict[str, float] = {
    "SMART_MANDATE_RETRY": 1.25,
    "HINGLISH_VOICE_P2P": 1.80,
    "WHATSAPP_MAGIC_LINK": 1.80,
    "CHECKOUT_DYNAMIC_OFFER": 1.50,
    "B2B_COMPLIANT_DUNNING": 2.50,
}
