"""Dataset builder for the local failure-classifier.

Generates a channel-coherent synthetic corpus from the same canonical
source as the backend: DETERMINISTIC_RULES + CHANNEL_FAILURE_PRESETS.
Each row carries paraphrased gateway text (incl. Hinglish variants) so the
trained model must generalise beyond exact error-code memorisation.

Usage:
    python backend/ml/make_dataset.py --n 5000 --seed 42
Output:
    backend/ml/data/upi_failures.csv
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import pandas as pd

# Allow `python backend/ml/make_dataset.py` from repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.diagnostics import DETERMINISTIC_RULES  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Human-like gateway paraphrases per error code. Deliberately varied:
# formal NPCI prose, short bank codes, and Hinglish customer-facing text.
PARAPHRASES: dict[str, list[str]] = {
    "GATEWAY_ERROR": [
        "504 Gateway Timeout from NPCI switch",
        "issuer node degraded during mandate authorization",
        "downstream gateway error, retry after clearing window",
        "payment gateway ne response nahi diya, timeout ho gaya",
    ],
    "BANK_DEBIT_FAILED_TECHNICAL": [
        "Downstream bank gateway timeout during debit attempt",
        "Issuer node degradation during 02:00 AM auto-debit window",
        "bank server busy, auto-debit fail ho gaya technical issue se",
        "debit attempt failed due to issuer switch congestion",
    ],
    "NPCI_TIMEOUT": [
        "UPI switch response timed out after 30 seconds",
        "Card network switch response timed out",
        "NPCI timeout, bank se confirmation nahi aaya",
    ],
    "TOKENIZATION_TIMEOUT": [
        "card token vault timeout during authorization",
        "tokenization service slow, mandate auth timed out",
    ],
    "OTP_TIMEOUT": [
        "OTP verification timed out during checkout",
        "customer ne OTP time par enter nahi kiya, session expire",
    ],
    "INSUFFICIENT_FUNDS": [
        "Declined by customer bank due to low balance",
        "Salary credit not yet posted; balance too low for auto-debit",
        "account me paise nahi hai, balance insufficient",
        "Mandate debit declined due to low card account balance",
    ],
    "UPI_DAILY_LIMIT_EXCEEDED": [
        "Customer reached daily UPI transaction limit of Rs.1,00,000",
        "UPI daily cap khatam, kal retry karo",
        "limit exceed, transaction declined by bank",
    ],
    "MANDATE_AMOUNT_EXCEEDS_CAP": [
        "mandate amount exceeds NPCI cap of Rs.1,00,000",
        "autopay cap se zyada amount, bank ne decline kiya",
    ],
    "CARD_EXPIRED": [
        "Mandate card token expired; bank declined authorization",
        "card expiry ho gayi, naya card link karo",
    ],
    "ACCOUNT_CLOSED": [
        "customer account closed, debit returned",
        "account band ho gaya hai, retry bekar hai",
    ],
    "FRAUD_DETECTED": [
        "High-risk score flagged by issuer fraud detection switch",
        "suspicious activity, fraud check fail",
    ],
    "STOLEN_CARD": [
        "stolen card hotlisted by issuer",
        "chori ka card report hua, block hai",
    ],
    "INVALID_VPA_PERMANENT": [
        "VPA does not exist, invalid payee address",
        "galat UPI ID, ye VPA exist nahi karti",
    ],
    "CHECKOUT_DROPPED_OFF": [
        "Customer abandoned session at shipping/payment step",
        "user ne checkout beech me chhod diya",
        "OTP verification timed out during checkout",
    ],
    "CART_ABANDONED_SHIPPING_FRICTION": [
        "User exited after shipping charge calculated",
        "shipping fee dekh kar customer ne cart chhod diya",
    ],
    "PAYMENT_METHOD_UNAVAILABLE": [
        "selected UPI method unavailable at checkout",
        "payment option show nahi ho raha tha",
    ],
    "INVOICE_OVERDUE_30_DAYS": [
        "Net-30 invoice crossed due date without payment reconciliation",
        "30 din se payment pending, accounts se approval nahi aaya",
    ],
    "INVOICE_APPROVAL_PENDING": [
        "Invoice stuck in enterprise procurement approval workflow",
        "procurement team se approval pending hai",
    ],
    "PURCHASE_ORDER_MISMATCH": [
        "PO amount mismatch, reconciliation on hold",
        "purchase order aur invoice me antar hai",
    ],
}

CHANNEL_BY_CODE: dict[str, str] = {
    "GATEWAY_ERROR": "UPI_AUTOPAY",
    "BANK_DEBIT_FAILED_TECHNICAL": "UPI_AUTOPAY",
    "NPCI_TIMEOUT": "UPI_AUTOPAY",
    "TOKENIZATION_TIMEOUT": "CARD_MANDATE",
    "OTP_TIMEOUT": "MAGIC_CHECKOUT",
    "INSUFFICIENT_FUNDS": "UPI_AUTOPAY",
    "UPI_DAILY_LIMIT_EXCEEDED": "UPI_AUTOPAY",
    "MANDATE_AMOUNT_EXCEEDS_CAP": "UPI_AUTOPAY",
    "CARD_EXPIRED": "CARD_MANDATE",
    "ACCOUNT_CLOSED": "UPI_AUTOPAY",
    "FRAUD_DETECTED": "CARD_MANDATE",
    "STOLEN_CARD": "CARD_MANDATE",
    "INVALID_VPA_PERMANENT": "UPI_AUTOPAY",
    "CHECKOUT_DROPPED_OFF": "MAGIC_CHECKOUT",
    "CART_ABANDONED_SHIPPING_FRICTION": "MAGIC_CHECKOUT",
    "PAYMENT_METHOD_UNAVAILABLE": "MAGIC_CHECKOUT",
    "INVOICE_OVERDUE_30_DAYS": "B2B_INVOICE",
    "INVOICE_APPROVAL_PENDING": "B2B_INVOICE",
    "PURCHASE_ORDER_MISMATCH": "B2B_INVOICE",
}

BANKS = ["HDFC", "SBIN", "ICIC", "UTIB", "KKBK"]
UPTIME = {"HDFC": 99.4, "SBIN": 78.2, "ICIC": 98.9, "UTIB": 96.5, "KKBK": 97.8}


def build_rows(n: int, seed: int) -> pd.DataFrame:
    rng = random.Random(seed)
    codes = sorted(DETERMINISTIC_RULES.keys())
    rows = []
    for i in range(n):
        code = rng.choice(codes)
        cat, _, _ = DETERMINISTIC_RULES[code]
        desc = rng.choice(PARAPHRASES.get(code, [code]))
        channel = CHANNEL_BY_CODE.get(code, "UPI_AUTOPAY")
        bank = rng.choice(BANKS)
        rows.append(
            {
                "error_code": code,
                "error_desc": desc,
                "channel": channel,
                "issuer_bank": bank,
                "amount": round(rng.uniform(199, 45000), 2),
                "bank_uptime_pct": UPTIME[bank],
                "attempts_made": rng.choice([0, 0, 0, 1, 1, 2, 3]),
                "label": cat.value,
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=5000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", type=str, default=str(DATA_DIR / "upi_failures.csv"))
    args = ap.parse_args()

    df = build_rows(args.n, args.seed)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"wrote {len(df)} rows -> {out}")
    print(df["label"].value_counts().to_string())


if __name__ == "__main__":
    main()
