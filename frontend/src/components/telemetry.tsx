import { CheckCircle2, MinusCircle, Clock3, Loader, ShieldAlert } from 'lucide-react';

/* ============================================================
   SHARED PRIMITIVES — the one authority for status labels,
   tones, and panel headers across the whole app.
   ============================================================ */

export function formatINR(val?: number): string {
  if (val === undefined || isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function formatINRShort(val?: number): string {
  if (val === undefined || isNaN(val)) return '₹0';
  const abs = Math.abs(val);
  if (abs >= 10000000) return '₹' + (val / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return '₹' + (val / 100000).toFixed(2) + ' L';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

/* ---------- One status, one tone ---------- */

export interface StatusTone {
  label: string;
  text: string;
  bg: string;
  border: string;
}

export const STATUS_TONES: Record<string, StatusTone> = {
  RECOVERED: {
    label: 'Recovered',
    text: 'text-ok',
    bg: 'bg-ok-soft',
    border: 'border-ok-line',
  },
  P2P_SCHEDULED: {
    label: 'Promise to pay',
    text: 'text-warn',
    bg: 'bg-warn-soft',
    border: 'border-warn-line',
  },
  STOPPED_GUARDRAIL: {
    label: 'Stopped by safety rule',
    text: 'text-bad',
    bg: 'bg-bad-soft',
    border: 'border-bad-line',
  },
  IN_PROGRESS: {
    label: 'In progress',
    text: 'text-ink-2',
    bg: 'bg-wash',
    border: 'border-line',
  },
  AT_RISK: {
    label: 'At risk',
    text: 'text-warn',
    bg: 'bg-warn-soft',
    border: 'border-warn-line',
  },
  FAILED: {
    label: 'Not recovered',
    text: 'text-bad',
    bg: 'bg-bad-soft',
    border: 'border-bad-line',
  },
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONES[status] ?? STATUS_TONES.IN_PROGRESS;
}

/* ---------- One reader, one humanizer ---------- */

export function humanizeIntervention(intervention: string): string {
  if (intervention === 'HARD_STOP_NO_ACTION') return 'Stopped — unsafe to act';
  return intervention.replace(/_/g, ' ').toLowerCase();
}

export function humanizeCategory(category: string): string {
  return category.replace(/_/g, ' ').toLowerCase();
}

export function sampleLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function istStamp(): string {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AUDIT_CSV_URL = '/api/audit/csv';

/* ---------- Panel header ---------- */

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, right }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink leading-snug">{title}</h2>
        {subtitle && <p className="text-[13px] text-ink-3 leading-relaxed mt-1 max-w-[72ch]">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ---------- Compliance badge ---------- */

export function ComplianceBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
        ok ? 'text-ok' : 'text-bad'
      }`}
    >
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      <span>{ok ? 'Passed' : 'Blocked'}</span>
    </span>
  );
}

/* ---------- Status badge ---------- */

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  const Icon =
    status === 'RECOVERED' ? CheckCircle2
    : status === 'P2P_SCHEDULED' ? Clock3
    : status === 'STOPPED_GUARDRAIL' || status === 'FAILED' ? MinusCircle
    : Loader;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[12px] font-medium ${tone.border} ${tone.bg} ${tone.text}`}
    >
      <Icon className="w-3 h-3" />
      {tone.label}
    </span>
  );
}

/* ---------- Decision record: one shape, every reader ---------- */

export interface DecisionRecordData {
  diagnosis: { category: string; root_cause: string; ai_reasoning: string };
  compliance: {
    is_compliant: boolean;
    rbi_hours_ok: boolean;
    within_touch_limit: boolean;
    not_hard_declined: boolean;
    dnd_clear: boolean;
    dispute_clear: boolean;
    reason: string;
  };
  settlement_ref?: string | null;
  cost_incurred: number;
  timestamp: string;
  final_status: string;
}

export function DecisionRecord({ record }: { record: DecisionRecordData }) {
  const checks = [
    { label: 'Within RBI contact hours', ok: record.compliance.rbi_hours_ok },
    { label: 'Under 3 touches / 7 days', ok: record.compliance.within_touch_limit },
    { label: 'Not a hard decline', ok: record.compliance.not_hard_declined },
    { label: 'DND / hardship clear', ok: record.compliance.dnd_clear },
    { label: 'No open dispute', ok: record.compliance.dispute_clear },
  ];
  return (
    <div className="arrive grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="border border-line bg-white rounded-lg px-4 py-3.5">
        <div className="text-[12px] font-medium text-ink-3 mb-2">
          AI diagnosis · {humanizeCategory(record.diagnosis.category)}
        </div>
        <div className="text-[13px] text-ink leading-relaxed">{record.diagnosis.root_cause}</div>
        <p className="text-[12px] text-ink-3 leading-relaxed mt-2.5 border-t border-line pt-2.5">
          {record.diagnosis.ai_reasoning}
        </p>
      </div>
      <div className="border border-line bg-white rounded-lg px-4 py-3.5">
        <div className="text-[12px] font-medium text-ink-3 mb-2.5">Safety checks</div>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-ink-2">{check.label}</span>
              <ComplianceBadge ok={Boolean(check.ok)} />
            </div>
          ))}
        </div>
        <p className="text-[12px] text-ink-3 leading-relaxed mt-2.5 border-t border-line pt-2.5">
          {record.compliance.reason}
        </p>
      </div>
      <div className="border border-line bg-white rounded-lg px-4 py-3.5">
        <div className="text-[12px] font-medium text-ink-3 mb-2">Settlement</div>
        <div className={`text-[13px] font-medium numeric ${statusTone(record.final_status).text}`}>
          {record.settlement_ref ?? 'None — stopped or pending'}
        </div>
        <div className="space-y-1.5 mt-3 border-t border-line pt-2.5 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <span className="text-ink-3">Running cost</span>
            <span className="text-ink numeric">₹{record.cost_incurred.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-3">Logged at</span>
            <span className="text-ink numeric">{record.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
