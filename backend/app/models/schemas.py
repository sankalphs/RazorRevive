from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class FailureCategory(str, Enum):
    TRANSIENT_TECHNICAL = "TRANSIENT_TECHNICAL"
    SOFT_FINANCIAL = "SOFT_FINANCIAL"
    HARD_PERMANENT = "HARD_PERMANENT"
    BEHAVIORAL_DROPOFF = "BEHAVIORAL_DROPOFF"
    COMMERCIAL_DISPUTE = "COMMERCIAL_DISPUTE"

class InterventionType(str, Enum):
    SMART_MANDATE_RETRY = "SMART_MANDATE_RETRY"
    HINGLISH_VOICE_P2P = "HINGLISH_VOICE_P2P"
    WHATSAPP_MAGIC_LINK = "WHATSAPP_MAGIC_LINK"
    CHECKOUT_DYNAMIC_OFFER = "CHECKOUT_DYNAMIC_OFFER"
    B2B_COMPLIANT_DUNNING = "B2B_COMPLIANT_DUNNING"
    HARD_STOP_NO_ACTION = "HARD_STOP_NO_ACTION"

class RecoveryStatus(str, Enum):
    AT_RISK = "AT_RISK"
    IN_PROGRESS = "IN_PROGRESS"
    RECOVERED = "RECOVERED"
    FAILED = "FAILED"
    STOPPED_GUARDRAIL = "STOPPED_GUARDRAIL"
    P2P_SCHEDULED = "P2P_SCHEDULED"

class CustomerInfo(BaseModel):
    name: str
    phone: str
    email: str
    vpa: Optional[str] = None
    city: str = "Bengaluru"
    preferred_language: str = "Hinglish"
    is_dnd: bool = False
    is_hardship: bool = False
    customer_segment: str = "Standard"  # High LTV, Standard, Enterprise

class AtRiskTransaction(BaseModel):
    id: str
    merchant_id: str
    merchant_name: str
    merchant_category: str  # SaaS, D2C, OTT, B2B, EdTech
    amount: float
    currency: str = "INR"
    channel: str  # UPI_AUTOPAY, ENACH, CARD_MANDATE, MAGIC_CHECKOUT, B2B_INVOICE, GATEWAY_CHECKOUT
    razorpay_error_code: str
    razorpay_error_desc: str
    issuer_bank: str  # HDFC, SBIN, ICIC, UTIB, KKBK
    bank_uptime_pct: float = 95.0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    customer: CustomerInfo
    attempts_made: int = 0
    status: RecoveryStatus = RecoveryStatus.AT_RISK

class DiagnosisResult(BaseModel):
    category: FailureCategory
    root_cause: str
    confidence: float
    recommended_action: InterventionType
    ai_reasoning: str
    recommended_retry_delay_hours: int = 0

class ComplianceCheck(BaseModel):
    is_compliant: bool
    rbi_hours_ok: bool
    within_touch_limit: bool
    not_hard_declined: bool
    dnd_clear: bool
    dispute_clear: bool
    reason: str
    deferred_until_ist: Optional[str] = None

class PromiseToPayRecord(BaseModel):
    id: str
    transaction_id: str
    customer_name: str
    customer_phone: str
    amount: float
    promised_date: str
    promised_time: str
    intent_confidence: float
    raw_transcript: str
    status: str = "ACTIVE_PLEDGE"  # ACTIVE_PLEDGE, SETTLED, EXPIRED
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    followup_due: str

class AuditLogEntry(BaseModel):
    id: str
    transaction_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    event: str
    merchant_name: str
    amount_at_risk: float
    amount_recovered: float = 0.0
    cost_incurred: float = 0.0
    diagnosis: DiagnosisResult
    compliance: ComplianceCheck
    intervention: InterventionType
    action_details: Dict[str, Any] = Field(default_factory=dict)
    final_status: RecoveryStatus
    settlement_ref: Optional[str] = None

class BatchSimulationRequest(BaseModel):
    batch_size: int = 100
    vertical_mix: List[str] = ["SaaS", "D2C", "B2B", "OTT"]
    enable_llm: bool = True

class BatchSummary(BaseModel):
    batch_id: str
    timestamp: str
    total_transactions: int
    total_revenue_at_risk: float
    # AI Recovery Results
    total_recovered_ai: float
    recovery_rate_ai: float
    # Baseline Results
    total_recovered_baseline: float
    recovery_rate_baseline: float
    # Incremental impact
    incremental_lift_rupees: float
    lift_percentage: float
    total_operational_cost: float
    net_economic_value: float
    roi_multiplier: float
    # Guardrail and operational metrics
    guardrail_stops_count: int
    interventions_breakdown: Dict[str, int]
    categories_breakdown: Dict[str, int]
    audit_log_count: int
    sample_audit_entries: List[AuditLogEntry] = Field(default_factory=list)

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[str] = None

class ChatInteractionRequest(BaseModel):
    transaction_id: Optional[str] = None
    customer_name: str = "Rahul Sharma"
    merchant_name: str = "cult.fit"
    amount: float = 1499.0
    failure_reason: str = "SBI UPI server temporary downtime"
    messages: List[ChatMessage]

class ChatInteractionResponse(BaseModel):
    reply: str
    audio_text_hinglish: str
    detected_intent: Optional[str] = None  # PROMISE_TO_PAY, REQUEST_LINK, DISPUTE_CLAIMED, HARDSHIP_PAUSE, DND_OPTOUT, GENERAL_INQUIRY
    p2p_details: Optional[Dict[str, Any]] = None
    next_action: InterventionType
