from fastapi import APIRouter
from typing import List, Dict, Any
from ..models.schemas import (
    ChatInteractionRequest,
    ChatInteractionResponse,
    PromiseToPayRecord
)
from ..interventions.hinglish_agent import HinglishRecoveryAgent, p2p_registry
from ..interventions.mandate_sequencer import BANK_HEALTH_REGISTRY

router = APIRouter(prefix="/api/agent", tags=["Agent & Hinglish P2P"])

PRESET_SCENARIOS = [
    {
        "id": "cultfit_upi",
        "title": "cult.fit Annual Membership (UPI Autopay Timeout)",
        "customer_name": "Rahul Sharma",
        "merchant_name": "cult.fit",
        "amount": 1499.0,
        "failure_reason": "SBI UPI Gateway timeout during auto-debit",
        "initial_message": "Namaste Rahul ji! Main cult.fit se call kar rahi hoon. Aapka membership renew karte waqt bank server issue ki wajah se payment pause ho gaya tha. Kya main aapko ek instant 1-click UPI link WhatsApp pe share kar doon?"
    },
    {
        "id": "boat_checkout",
        "title": "boAt Nirvana Airdopes (Magic Checkout Drop-Off)",
        "customer_name": "Priya Nair",
        "merchant_name": "boAt Lifestyle",
        "amount": 2499.0,
        "failure_reason": "Customer abandoned checkout after shipping review",
        "initial_message": "Hi Priya! We noticed you left the boAt Nirvana Airdopes in your bag. As a special perk, we have unlocked ₹150 instant discount + Free Express Delivery for the next 2 hours. Would you like the secure Razorpay checkout link?"
    },
    {
        "id": "notion_b2b",
        "title": "Notion India Team Workspace (Invoice Overdue)",
        "customer_name": "Aditya Verma",
        "merchant_name": "Notion India",
        "amount": 9600.0,
        "failure_reason": "Card mandate daily transaction limit exceeded",
        "initial_message": "Hello Aditya! Your Notion Team workspace renewal for ₹9,600 was declined due to your bank's daily online card limit. Would you prefer paying via corporate NetBanking or should we send an instant UPI link to your finance desk?"
    },
    {
        "id": "tataplay_soft_decline",
        "title": "Tata Play Binge+ (Insufficient Funds / Salary Day)",
        "customer_name": "Sneha Patel",
        "merchant_name": "Tata Play",
        "amount": 499.0,
        "failure_reason": "Soft decline: Low bank account balance",
        "initial_message": "Namaste Sneha ji! Tata Play se reminder hai ki aapka entertainment pass expire ho raha hai. Agar aap chahein toh hum agle salary day par auto-debit schedule kar sakte hain ya abhi pay karne ke liye UPI link bhej sakte hain."
    }
]

@router.post("/chat", response_model=ChatInteractionResponse)
async def chat_interaction(req: ChatInteractionRequest):
    return await HinglishRecoveryAgent.chat_turn(
        messages=req.messages,
        customer_name=req.customer_name,
        merchant_name=req.merchant_name,
        amount=req.amount,
        failure_reason=req.failure_reason
    )

@router.get("/p2p", response_model=List[PromiseToPayRecord])
async def list_p2p_records():
    return list(p2p_registry.values())

@router.get("/bank-health")
async def get_bank_health():
    return BANK_HEALTH_REGISTRY

@router.get("/scenarios")
async def get_preset_scenarios():
    return PRESET_SCENARIOS
