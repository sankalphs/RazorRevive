import re
import random
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
from ..config import GMI_BASE_URL, GMI_API_KEY, GMI_MODEL
from ..models.schemas import (
    AtRiskTransaction,
    RecoveryStatus,
    InterventionType,
    ChatMessage,
    ChatInteractionResponse,
    PromiseToPayRecord
)
from ..core.policy_guardrails import check_customer_opt_out, check_customer_hardship

# In-memory registry for tracked Promise-to-Pay commitments
p2p_registry: Dict[str, PromiseToPayRecord] = {}

class HinglishRecoveryAgent:
    """
    Empathetic, culturally resonant bilingual (Hinglish/English) conversational agent.
    Conducts interactive Voice and WhatsApp win-back dialogues, detects Promise-to-Pay
    intents, and schedules non-intrusive payment follow-ups.
    """

    @staticmethod
    def parse_promise_to_pay_date(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Extracts promised date and time from natural Hinglish text.
        e.g. 'kal shaam ko 5 baje', 'tomorrow morning', 'salary aane par 2 din baad'
        """
        lower = text.lower()
        now = datetime.now()
        promised_date = None
        promised_time = "10:00 AM IST"

        # Check relative days
        if "aaj" in lower or "today" in lower:
            promised_date = now.strftime("%Y-%m-%d")
        elif "kal" in lower or "tomorrow" in lower:
            promised_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        elif "parson" in lower or "day after" in lower:
            promised_date = (now + timedelta(days=2)).strftime("%Y-%m-%d")
        elif any(k in lower for k in ["weekend", "shanivar", "ravivar", "sunday", "saturday"]):
            days_ahead = (5 - now.weekday()) % 7 or 2
            promised_date = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        elif "salary" in lower or "mahine" in lower:
            # Typical salary date: 1st or next 3 days
            promised_date = (now + timedelta(days=3)).strftime("%Y-%m-%d")

        # Check time cues
        if "shaam" in lower or "evening" in lower:
            promised_time = "06:00 PM IST"
        elif "subah" in lower or "morning" in lower:
            promised_time = "10:00 AM IST"
        elif "dopahar" in lower or "afternoon" in lower:
            promised_time = "02:30 PM IST"
        
        # Regex for specific hour e.g. "5 baje", "4 pm"
        hour_match = re.search(r"(\d{1,2})\s*(baje|pm|am|hours)", lower)
        if hour_match:
            hr = int(hour_match.group(1))
            period = "PM" if "pm" in lower or ("baje" in lower and hr in [4,5,6,7,8]) else "AM"
            promised_time = f"{hr:02d}:00 {period} IST"

        if promised_date:
            return promised_date, promised_time
        return None, None

    @staticmethod
    def detect_intent(text: str) -> str:
        """Categorizes customer intent from conversational response."""
        lower = text.lower()
        if check_customer_opt_out(lower):
            return "DND_OPTOUT"
        if check_customer_hardship(lower):
            return "HARDSHIP_PAUSE"
        if any(k in lower for k in ["already paid", "ho gaya", "kat gaya", "cut gaye", "dispute", "fraud"]):
            return "DISPUTE_CLAIMED"
        if any(k in lower for k in ["kal", "parson", "shaam", "tomorrow", "later", "salary", "baad me", "after"]):
            return "PROMISE_TO_PAY"
        if any(k in lower for k in ["link", "send", "bhej", "whatsapp", "upi", "qr", "pay now"]):
            return "REQUEST_LINK"
        return "GENERAL_INQUIRY"

    @staticmethod
    async def chat_turn(
        messages: List[ChatMessage],
        customer_name: str,
        merchant_name: str,
        amount: float,
        failure_reason: str
    ) -> ChatInteractionResponse:
        """
        Executes a live conversational turn with the Hinglish recovery agent.
        """
        user_message = messages[-1].content if messages else "Hello"
        intent = HinglishRecoveryAgent.detect_intent(user_message)
        p2p_data = None
        next_action = InterventionType.WHATSAPP_MAGIC_LINK

        # 1. Guardrail / Opt-out check
        if intent == "DND_OPTOUT":
            reply = f"Bilkul {customer_name} ji, humne aapka request note kar liya hai aur future alerts ko band kar diya hai. Asuvidha ke liye maafi chahte hain."
            return ChatInteractionResponse(
                reply=reply,
                audio_text_hinglish=reply,
                detected_intent="DND_OPTOUT",
                next_action=InterventionType.HARD_STOP_NO_ACTION
            )

        # 2. Hardship check
        if intent == "HARDSHIP_PAUSE":
            reply = f"Hum samajhte hain {customer_name} ji. Humne aapke account par payment dunning ko temporarily pause kar diya hai. Koi jaldi nahi hai, apna dhyaan rakhein."
            return ChatInteractionResponse(
                reply=reply,
                audio_text_hinglish=reply,
                detected_intent="HARDSHIP_PAUSE",
                next_action=InterventionType.HARD_STOP_NO_ACTION
            )

        # 3. Dispute check
        if intent == "DISPUTE_CLAIMED":
            reply = f"Thank you batane ke liye {customer_name} ji. Humne aapka dispute Razorpay support team ko forward kar diya hai. Hum bank se verify karke 24 hours me update karenge."
            return ChatInteractionResponse(
                reply=reply,
                audio_text_hinglish=reply,
                detected_intent="DISPUTE_CLAIMED",
                next_action=InterventionType.HARD_STOP_NO_ACTION
            )

        # 4. Promise-to-Pay check
        if intent == "PROMISE_TO_PAY":
            date_str, time_str = HinglishRecoveryAgent.parse_promise_to_pay_date(user_message)
            if not date_str:
                date_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                time_str = "11:00 AM IST"
            
            p2p_id = f"p2p_{uuid.uuid4().hex[:8]}"
            record = PromiseToPayRecord(
                id=p2p_id,
                transaction_id=f"txn_{uuid.uuid4().hex[:8]}",
                customer_name=customer_name,
                customer_phone="+91-9876543210",
                amount=amount,
                promised_date=date_str,
                promised_time=time_str,
                intent_confidence=0.94,
                raw_transcript=user_message,
                status="ACTIVE_PLEDGE",
                followup_due=f"{date_str} {time_str}"
            )
            p2p_registry[p2p_id] = record
            p2p_data = record.model_dump()
            
            reply = f"Dhanyawad {customer_name} ji! Humne note kar liya hai ki aap {date_str} ko lagbhag {time_str} pay karenge. Tab tak ke liye humne sabhi reminders pause kar diye hain. Hum aapko WhatsApp pe ek gentle reminder link bhejenge."
            return ChatInteractionResponse(
                reply=reply,
                audio_text_hinglish=reply,
                detected_intent="PROMISE_TO_PAY",
                p2p_details=p2p_data,
                next_action=InterventionType.HINGLISH_VOICE_P2P
            )

        # 5. Immediate Link Request
        if intent == "REQUEST_LINK":
            payment_url = f"https://rzp.io/i/magic_{random.randint(10000, 99999)}"
            reply = f"Yeh lijiye {customer_name} ji, aapke {merchant_name} payment ke liye direct Razorpay secure link: {payment_url} . Isme Google Pay, PhonePe aur Paytm sabhi UPI options enabled hain."
            return ChatInteractionResponse(
                reply=reply,
                audio_text_hinglish=reply,
                detected_intent="REQUEST_LINK",
                next_action=InterventionType.WHATSAPP_MAGIC_LINK
            )

        # 6. Default conversational flow: try LLM or high-craft template
        if GMI_API_KEY:
            try:
                system_prompt = f"""You are 'Priya', a friendly and professional customer success agent calling on behalf of {merchant_name}.
Context:
- Customer: {customer_name}
- Pending Amount: INR {amount}
- Failure Cause: {failure_reason}
Tone: Polite, respectful Indian conversational Hinglish. Empathize with technical bank issues. Offer a 1-click WhatsApp payment link or ask when it is convenient to retry. Keep replies under 3 sentences."""

                llm_messages = [{"role": "system", "content": system_prompt}]
                for m in messages[-4:]:
                    llm_messages.append({"role": m.role, "content": m.content})

                async with httpx.AsyncClient(timeout=3.5) as client:
                    r = await client.post(
                        f"{GMI_BASE_URL}/chat/completions",
                        headers={"Authorization": f"Bearer {GMI_API_KEY}"},
                        json={"model": GMI_MODEL, "messages": llm_messages, "temperature": 0.4}
                    )
                    if r.status_code == 200:
                        content = r.json()["choices"][0]["message"]["content"].strip()
                        return ChatInteractionResponse(
                            reply=content,
                            audio_text_hinglish=content,
                            detected_intent="GENERAL_INQUIRY",
                            next_action=InterventionType.WHATSAPP_MAGIC_LINK
                        )
            except Exception:
                pass

        # Fallback greeting / response
        reply = f"Namaste {customer_name} ji! Main {merchant_name} se call kar rahi hoon. Aapka payment ₹{amount:.0f} bank server downtime ki wajah se atak gaya tha. Kya main aapko WhatsApp pe ek instant UPI link share kar doon?"
        return ChatInteractionResponse(
            reply=reply,
            audio_text_hinglish=reply,
            detected_intent="GENERAL_INQUIRY",
            next_action=InterventionType.WHATSAPP_MAGIC_LINK
        )

    @staticmethod
    def simulate_recovery(txn: AtRiskTransaction) -> Tuple[RecoveryStatus, Dict[str, Any], float]:
        """
        Simulates the end-to-end outcome of a Hinglish voice or WhatsApp outreach.
        """
        # Hinglish personalized recovery achieves ~72% win-back rate for soft financial/declined payments
        success_prob = 0.74
        is_recovered = (random.random() < success_prob)
        cost_incurred = 1.80  # WhatsApp template message + conversational AI cost in INR

        if is_recovered:
            settlement_ref = f"pay_hinglish_{random.randint(1000000, 9999999)}"
            return (
                RecoveryStatus.RECOVERED,
                {
                    "action": "HINGLISH_OUTREACH_SUCCESS",
                    "channel": "WhatsApp + Interactive Voice",
                    "settlement_ref": settlement_ref,
                    "customer_name": txn.customer.name,
                    "phone": txn.customer.phone,
                    "transcript_summary": f"Customer acknowledged via Hinglish audio nudge and settled ₹{txn.amount:.2f} via 1-click UPI intent link."
                },
                txn.amount
            )
        else:
            return (
                RecoveryStatus.P2P_SCHEDULED,
                {
                    "action": "PROMISE_TO_PAY_LOGGED",
                    "channel": "Hinglish Conversational Agent",
                    "customer_name": txn.customer.name,
                    "promised_followup": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d 11:00 AM IST"),
                    "note": "Customer promised to pay on upcoming salary date. Aggressive dunning paused; reminder scheduled."
                },
                0.0
            )
