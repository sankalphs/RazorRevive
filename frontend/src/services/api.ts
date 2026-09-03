// API Client for RazorRevive Backend

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  vpa?: string;
  city: string;
  preferred_language: string;
  is_dnd: boolean;
  is_hardship: boolean;
  customer_segment: string;
}

export interface DiagnosisResult {
  category: string;
  root_cause: string;
  confidence: number;
  recommended_action: string;
  ai_reasoning: string;
  recommended_retry_delay_hours: number;
}

export interface ComplianceCheck {
  is_compliant: boolean;
  rbi_hours_ok: boolean;
  within_touch_limit: boolean;
  not_hard_declined: boolean;
  dnd_clear: boolean;
  dispute_clear: boolean;
  reason: string;
  deferred_until_ist?: string;
}

export interface AuditLogEntry {
  id: string;
  transaction_id: string;
  timestamp: string;
  event: string;
  merchant_name: string;
  amount_at_risk: number;
  amount_recovered: number;
  cost_incurred: number;
  diagnosis: DiagnosisResult;
  compliance: ComplianceCheck;
  intervention: string;
  action_details: Record<string, any>;
  final_status: string;
  settlement_ref?: string;
}

export interface BatchSummary {
  batch_id: string;
  timestamp: string;
  total_transactions: number;
  total_revenue_at_risk: number;
  total_recovered_ai: number;
  recovery_rate_ai: number;
  total_recovered_baseline: number;
  recovery_rate_baseline: number;
  incremental_lift_rupees: number;
  lift_percentage: number;
  total_operational_cost: number;
  net_economic_value: number;
  roi_multiplier: number;
  guardrail_stops_count: number;
  interventions_breakdown: Record<string, number>;
  categories_breakdown: Record<string, number>;
  audit_log_count: number;
  sample_audit_entries: AuditLogEntry[];
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export interface ChatInteractionRequest {
  transaction_id?: string;
  customer_name: string;
  merchant_name: string;
  amount: number;
  failure_reason: string;
  messages: ChatMessage[];
}

export interface ChatInteractionResponse {
  reply: string;
  audio_text_hinglish: string;
  detected_intent?: string;
  p2p_details?: any;
  next_action: string;
}

export interface PromiseToPayRecord {
  id: string;
  transaction_id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  promised_date: string;
  promised_time: string;
  intent_confidence: number;
  raw_transcript: string;
  status: string;
  followup_due: string;
}

const API_BASE = "/api";

export async function fetchLatestBatch(): Promise<BatchSummary> {
  const res = await fetch(`${API_BASE}/batch/latest`);
  if (!res.ok) throw new Error("Failed to fetch latest batch");
  return res.json();
}

export async function runBatchSimulation(
  batchSize: number = 100,
  verticalMix: string[] = ["SaaS", "D2C", "B2B", "OTT"],
  enableLLM: boolean = false
): Promise<BatchSummary> {
  const res = await fetch(`${API_BASE}/batch/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      batch_size: batchSize,
      vertical_mix: verticalMix,
      enable_llm: enableLLM,
    }),
  });
  if (!res.ok) throw new Error("Batch simulation failed");
  return res.json();
}

export async function sendChatMessage(req: ChatInteractionRequest): Promise<ChatInteractionResponse> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Agent chat turn failed");
  return res.json();
}

export async function fetchP2PRecords(): Promise<PromiseToPayRecord[]> {
  const res = await fetch(`${API_BASE}/agent/p2p`);
  if (!res.ok) throw new Error("Failed to fetch P2P records");
  return res.json();
}

export async function fetchBankHealth(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/agent/bank-health`);
  if (!res.ok) throw new Error("Failed to fetch bank health");
  return res.json();
}

export async function fetchPresetScenarios(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/agent/scenarios`);
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return res.json();
}

export async function fetchAuditTrail(
  status?: string,
  intervention?: string,
  search?: string
): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (intervention && intervention !== "ALL") params.append("intervention", intervention);
  if (search) params.append("search", search);
  params.append("limit", "100");

  const res = await fetch(`${API_BASE}/audit?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json();
}

export async function sendWebhookEvent(payload: any): Promise<AuditLogEntry> {
  const res = await fetch(`${API_BASE}/webhook/razorpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Webhook processing failed");
  return res.json();
}

export async function fetchSampleWebhooks(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/webhook/samples`);
  if (!res.ok) throw new Error("Failed to fetch sample webhooks");
  return res.json();
}
