import random
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
from ..models.schemas import AtRiskTransaction, RecoveryStatus
from .base import INTERVENTION_BASE_COSTS

# Real-time simulated uptime status for major Indian banks
BANK_HEALTH_REGISTRY = {
    "HDFC": {"name": "HDFC Bank", "uptime_pct": 99.4, "status": "OPTIMAL", "peak_hours": "10:00-16:00"},
    "SBIN": {"name": "State Bank of India", "uptime_pct": 78.2, "status": "DEGRADED", "peak_hours": "11:00-14:00"},
    "ICIC": {"name": "ICICI Bank", "uptime_pct": 98.9, "status": "OPTIMAL", "peak_hours": "09:00-17:00"},
    "UTIB": {"name": "Axis Bank", "uptime_pct": 96.5, "status": "STABLE", "peak_hours": "10:00-15:00"},
    "KKBK": {"name": "Kotak Mahindra Bank", "uptime_pct": 97.8, "status": "STABLE", "peak_hours": "09:30-16:30"},
    "PYTM": {"name": "Paytm Payments Bank", "uptime_pct": 82.1, "status": "DEGRADED", "peak_hours": "12:00-18:00"},
}

class MandateRetrySequencer:
    """
    Intelligent sequencer for UPI Autopay, eNACH, and Recurring Card mandates.
    Instead of naive fixed-interval retries, it sequences based on:
    1. Issuer bank health / gateway downtime status
    2. Indian salary credit cycles (28th - 5th of month)
    3. Low-traffic morning clearing windows (09:00 - 10:30 AM IST)
    """

    @staticmethod
    def get_registry_snapshot() -> Dict[str, Any]:
        """Read-only snapshot of bank health behind the module seam."""
        return {code: dict(info) for code, info in BANK_HEALTH_REGISTRY.items()}

    @staticmethod
    def get_bank_health(bank_code: str) -> Dict[str, Any]:
        return BANK_HEALTH_REGISTRY.get(bank_code, {
            "name": f"{bank_code} Bank",
            "uptime_pct": 94.0,
            "status": "STABLE",
            "peak_hours": "10:00-16:00"
        })

    @staticmethod
    def calculate_optimal_retry_window(txn: AtRiskTransaction) -> Dict[str, Any]:
        bank = MandateRetrySequencer.get_bank_health(txn.issuer_bank)
        uptime = bank["uptime_pct"]
        
        now = datetime.now()
        day_of_month = now.day
        is_salary_window = (day_of_month >= 28 or day_of_month <= 5)

        # Base delay depending on bank condition
        if uptime < 85.0:
            # Bank is degraded; defer retry to avoid customer bounce penalty
            delay_hours = random.choice([4, 6, 8])
            strategy = f"Bank {txn.issuer_bank} is degraded ({uptime}%). Holding retry for gateway stabilization."
        elif is_salary_window:
            delay_hours = random.choice([2, 4])
            strategy = "Salary cycle window active (high liquidity window). Scheduled for morning clearance."
        else:
            delay_hours = random.choice([2, 3])
            strategy = "Standard optimal clearing window schedule."

        scheduled_time = now + timedelta(hours=delay_hours)
        return {
            "strategy": strategy,
            "bank_uptime": uptime,
            "bank_status": bank["status"],
            "delay_hours": delay_hours,
            "scheduled_time_ist": scheduled_time.strftime("%Y-%m-%d %H:%M:%S IST"),
            "salary_window_boost": is_salary_window
        }

    @staticmethod
    def execute_mandate_retry(txn: AtRiskTransaction) -> Tuple[RecoveryStatus, Dict[str, Any], float]:
        """
        Simulates the execution of the smart mandate retry.
        Returns: (RecoveryStatus, details_dict, recovered_amount)
        """
        bank = MandateRetrySequencer.get_bank_health(txn.issuer_bank)
        window = MandateRetrySequencer.calculate_optimal_retry_window(txn)
        
        # Smart sequencing achieves significantly higher success probability:
        # Base bank uptime + 5% salary cycle boost - 3% if already attempted once
        success_prob = (bank["uptime_pct"] / 100.0) * 0.85
        if window["salary_window_boost"]:
            success_prob += 0.08
        if txn.attempts_made > 0:
            success_prob -= 0.05
        success_prob = max(0.40, min(0.92, success_prob))

        is_recovered = (random.random() < success_prob)
        cost_incurred = INTERVENTION_BASE_COSTS["SMART_MANDATE_RETRY"]

        if is_recovered:
            settlement_ref = f"pay_mandate_{random.randint(1000000, 9999999)}"
            return (
                RecoveryStatus.RECOVERED,
                {
                    "action": "SMART_MANDATE_RETRY_SUCCESS",
                    "settlement_ref": settlement_ref,
                    "bank": txn.issuer_bank,
                    "strategy": window["strategy"],
                    "retry_attempt": txn.attempts_made + 1,
                    "cost_incurred": cost_incurred,
                    "note": f"Mandate auto-cleared after smart delay ({window['delay_hours']}h) upon bank recovery."
                },
                txn.amount
            )
        else:
            return (
                RecoveryStatus.FAILED,
                {
                    "action": "SMART_MANDATE_RETRY_FAILED",
                    "bank": txn.issuer_bank,
                    "strategy": window["strategy"],
                    "retry_attempt": txn.attempts_made + 1,
                    "cost_incurred": cost_incurred,
                    "note": "Smart retry exhausted for this cycle. Fallback to WhatsApp Magic Payment Link."
                },
                0.0
            )
