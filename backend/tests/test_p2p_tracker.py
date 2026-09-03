import pytest
from backend.app.interventions.hinglish_agent import HinglishRecoveryAgent

def test_intent_detection():
    # Promise to Pay
    assert HinglishRecoveryAgent.detect_intent("Kal shaam ko 6 baje payment kar dunga") == "PROMISE_TO_PAY"
    assert HinglishRecoveryAgent.detect_intent("Salary aane do 2 din baad") == "PROMISE_TO_PAY"
    assert HinglishRecoveryAgent.detect_intent("I will pay tomorrow morning") == "PROMISE_TO_PAY"
    
    # Request Link
    assert HinglishRecoveryAgent.detect_intent("Mujhe direct WhatsApp pe UPI link bhej do") == "REQUEST_LINK"
    assert HinglishRecoveryAgent.detect_intent("Please send the payment link") == "REQUEST_LINK"

    # Dispute
    assert HinglishRecoveryAgent.detect_intent("Maine already pay kar diya hai, account se cut gaye") == "DISPUTE_CLAIMED"
    
    # Opt out
    assert HinglishRecoveryAgent.detect_intent("Stop calling me! Unsubscribe") == "DND_OPTOUT"
    
    # Hardship
    assert HinglishRecoveryAgent.detect_intent("Main jobless hoon, paise bilkul nahi hai") == "HARDSHIP_PAUSE"

def test_promise_to_pay_date_extraction():
    d1, t1 = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal shaam ko 5 baje")
    assert d1 is not None
    assert "05:00 PM IST" in t1

    d2, t2 = HinglishRecoveryAgent.parse_promise_to_pay_date("Tomorrow morning subah 10 baje")
    assert d2 is not None
    assert "10:00 AM IST" in t2
