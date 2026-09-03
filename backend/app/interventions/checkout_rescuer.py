import random
from typing import Dict, Any, Tuple
from ..models.schemas import AtRiskTransaction, RecoveryStatus

class CheckoutDropOffRescuer:
    """
    Recovers abandoned checkouts and drop-offs for Razorpay Magic Checkout.
    Diagnoses friction and generates personalized dynamic recovery links
    with bounded, margin-preserving incentives.
    """

    @staticmethod
    def generate_dynamic_offer(txn: AtRiskTransaction) -> Dict[str, Any]:
        """
        Dynamically bounds incentive based on cart size to maximize merchant margin.
        """
        if txn.amount >= 3000:
            discount_pct = 7
            max_cap = 250.0
            incentive_desc = f"Special 7% recovery incentive (capped at ₹{max_cap:.0f}) + Free Express Shipping"
            discount_val = min(txn.amount * 0.07, max_cap)
        elif txn.amount >= 1000:
            discount_pct = 5
            max_cap = 100.0
            incentive_desc = "Instant 5% discount applied at checkout"
            discount_val = min(txn.amount * 0.05, max_cap)
        else:
            discount_pct = 0
            incentive_desc = "Free Priority Delivery on 1-Click UPI Checkout"
            discount_val = 0.0

        magic_link = f"https://rzp.io/m/magic_{random.randint(100000, 999999)}"
        return {
            "magic_link": magic_link,
            "incentive_description": incentive_desc,
            "discount_amount": discount_val,
            "final_payable_amount": txn.amount - discount_val,
            "expires_in_hours": 3
        }

    @staticmethod
    def execute_recovery(txn: AtRiskTransaction) -> Tuple[RecoveryStatus, Dict[str, Any], float]:
        offer = CheckoutDropOffRescuer.generate_dynamic_offer(txn)
        
        # Win-back probability for dynamic personalized Magic Checkout links is ~68%
        success_prob = 0.68
        is_recovered = (random.random() < success_prob)
        cost_incurred = 0.85 + offer["discount_amount"]  # SMS/WhatsApp dispatch + incentive margin cost

        if is_recovered:
            settlement_ref = f"pay_magic_{random.randint(1000000, 9999999)}"
            recovered_amount = offer["final_payable_amount"]
            return (
                RecoveryStatus.RECOVERED,
                {
                    "action": "CHECKOUT_DROPOFF_RECOVERED",
                    "magic_link": offer["magic_link"],
                    "settlement_ref": settlement_ref,
                    "incentive_applied": offer["incentive_description"],
                    "discount_funded": offer["discount_amount"],
                    "recovered_amount": recovered_amount,
                    "note": f"Customer converted via personalized Magic Checkout link with 1-click UPI intent."
                },
                recovered_amount
            )
        else:
            return (
                RecoveryStatus.FAILED,
                {
                    "action": "CHECKOUT_DROPOFF_EXPIRED",
                    "magic_link": offer["magic_link"],
                    "note": "Customer viewed offer link but did not complete transaction within 3 hours. Cooldown initiated."
                },
                0.0
            )
