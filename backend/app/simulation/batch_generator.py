import random
import uuid
from typing import List
from ..models.schemas import AtRiskTransaction, CustomerInfo, RecoveryStatus

MERCHANTS = [
    {"id": "merch_cultfit", "name": "cult.fit", "category": "SaaS", "channel": "UPI_AUTOPAY", "avg_amt": 1499.0},
    {"id": "merch_boat", "name": "boAt Lifestyle", "category": "D2C", "channel": "MAGIC_CHECKOUT", "avg_amt": 2299.0},
    {"id": "merch_tataplay", "name": "Tata Play Binge", "category": "OTT", "channel": "CARD_MANDATE", "avg_amt": 399.0},
    {"id": "merch_urban", "name": "Urban Company", "category": "Services", "channel": "UPI_AUTOPAY", "avg_amt": 899.0},
    {"id": "merch_notion", "name": "Notion India", "category": "SaaS", "channel": "CARD_MANDATE", "avg_amt": 4800.0},
    {"id": "merch_zetwerk", "name": "Zetwerk B2B", "category": "B2B", "channel": "B2B_INVOICE", "avg_amt": 45000.0},
    {"id": "merch_sugar", "name": "SUGAR Cosmetics", "category": "D2C", "channel": "MAGIC_CHECKOUT", "avg_amt": 1250.0},
    {"id": "merch_lenskart", "name": "Lenskart Gold", "category": "D2C", "channel": "MAGIC_CHECKOUT", "avg_amt": 1800.0},
]

INDIAN_NAMES = [
    "Rahul Sharma", "Priya Nair", "Aditya Verma", "Sneha Patel", "Vikram Singh",
    "Ananya Rao", "Rohan Gupta", "Deepika Iyer", "Amitabh Sen", "Kavita Reddy",
    "Siddharth Joshi", "Pooja Mehta", "Karthik Swaminathan", "Neha Deshmukh",
    "Manish Agarwal", "Divya Pillai", "Gaurav Malhotra", "Ritu Bansal"
]

CITIES = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"]

FAILURE_PRESETS = [
    # Transient technical
    ("BANK_DEBIT_FAILED_TECHNICAL", "Downstream bank gateway timeout during debit attempt", "SBIN", 78.2),
    ("GATEWAY_ERROR", "504 Gateway Timeout from NPCI switch", "HDFC", 99.4),
    ("NPCI_TIMEOUT", "UPI switch response timed out after 30 seconds", "ICIC", 98.9),
    
    # Soft financial
    ("INSUFFICIENT_FUNDS", "Declined by customer bank due to low balance", "SBIN", 78.2),
    ("UPI_DAILY_LIMIT_EXCEEDED", "Customer reached daily UPI transaction limit of ₹1,00,000", "HDFC", 99.4),
    
    # Hard permanent (Guardrails should stop these)
    ("CARD_EXPIRED", "Mandate card token expired; bank declined authorization", "ICIC", 98.9),
    ("FRAUD_DETECTED", "High-risk score flagged by issuer fraud detection switch", "UTIB", 96.5),
    ("ACCOUNT_CLOSED", "Customer savings account closed or non-operational", "KKBK", 97.8),
    
    # Behavioral checkout drop-off
    ("CHECKOUT_DROPPED_OFF", "Customer abandoned session at shipping/payment step", "HDFC", 99.4),
    ("CART_ABANDONED_SHIPPING_FRICTION", "User exited after shipping charge calculated", "SBIN", 78.2),
    
    # B2B Invoice overdue
    ("INVOICE_OVERDUE_30_DAYS", "Net-30 invoice crossed due date without payment reconciliation", "HDFC", 99.4),
]

def generate_synthetic_batch(size: int = 100, vertical_mix: List[str] = None) -> List[AtRiskTransaction]:
    """Generates a realistic batch of Indian at-risk payment transactions."""
    batch: List[AtRiskTransaction] = []
    
    for i in range(size):
        merch = random.choice(MERCHANTS)
        if vertical_mix and merch["category"] not in vertical_mix:
            # pick a matching one if available
            filtered = [m for m in MERCHANTS if m["category"] in vertical_mix]
            if filtered:
                merch = random.choice(filtered)

        code, desc, bank, uptime = random.choice(FAILURE_PRESETS)
        
        # Adjust amounts with natural variation
        variance = random.uniform(0.7, 1.4)
        amount = round(merch["avg_amt"] * variance, 2)
        if merch["category"] == "B2B":
            amount = round(amount / 500) * 500  # round B2B amounts

        name = random.choice(INDIAN_NAMES)
        first_name = name.split()[0].lower()
        phone = f"+91-{random.randint(90000, 99999)}{random.randint(10000, 99999)}"
        email = f"{first_name}.{random.randint(10, 99)}@example.in"

        # Occasional guardrail edge cases (e.g. 5% DND, 3% Hardship, 5% already had retries)
        is_dnd = (random.random() < 0.05)
        is_hardship = (random.random() < 0.03)
        attempts = random.choice([0, 0, 0, 1, 1, 2, 3])

        customer = CustomerInfo(
            name=name,
            phone=phone,
            email=email,
            vpa=f"{first_name}@okhdfcbank",
            city=random.choice(CITIES),
            preferred_language=random.choice(["Hinglish", "Hinglish", "English"]),
            is_dnd=is_dnd,
            is_hardship=is_hardship,
            customer_segment=random.choice(["Standard", "Standard", "High LTV", "Enterprise"])
        )

        txn = AtRiskTransaction(
            id=f"txn_{uuid.uuid4().hex[:12]}",
            merchant_id=merch["id"],
            merchant_name=merch["name"],
            merchant_category=merch["category"],
            amount=amount,
            currency="INR",
            channel=merch["channel"],
            razorpay_error_code=code,
            razorpay_error_desc=desc,
            issuer_bank=bank,
            bank_uptime_pct=uptime,
            customer=customer,
            attempts_made=attempts,
            status=RecoveryStatus.AT_RISK
        )
        batch.append(txn)

    return batch
