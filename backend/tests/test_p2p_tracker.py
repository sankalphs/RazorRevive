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

def test_promise_time_extraction_accuracy():
    # Explicit part-of-day word must win over the numeric 'baje' heuristic
    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal subah 7 baje")
    assert t == "07:00 AM IST"

    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal shaam 11 baje")
    assert t == "11:00 PM IST"

    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal shaam 12 baje")
    assert t == "12:00 PM IST"

    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal dopahar 2 baje")
    assert t == "02:00 PM IST"

    # No part-of-day cue: 9-12 baje defaults to daytime AM per Indian convention
    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal 9 baje")
    assert t == "09:00 AM IST"

    # Explicit meridiem marker respected
    _, t = HinglishRecoveryAgent.parse_promise_to_pay_date("Kal 5 pm")
    assert t == "05:00 PM IST"

def test_promise_deferred_date_extraction():
    # "X din baad" relative days
    from datetime import datetime, timedelta
    d, _ = HinglishRecoveryAgent.parse_promise_to_pay_date("Salary aane par 2 din baad bhej dena")
    assert d == (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

    # Weekday promise
    d, _ = HinglishRecoveryAgent.parse_promise_to_pay_date("Monday ko shaam")
    assert d is not None

    # Salary fallback still works
    d, _ = HinglishRecoveryAgent.parse_promise_to_pay_date("Salary aayegi tab bhej dena")
    assert d is not None

def test_intent_no_false_positive_optout():
    # Regression: 'confirm'/'first' must never trigger the DND hard stop
    assert HinglishRecoveryAgent.detect_intent("Yes I confirm, please send the payment link") != "DND_OPTOUT"
    assert HinglishRecoveryAgent.detect_intent("I will pay first thing tomorrow") != "DND_OPTOUT"
