import { CheckCircle2, MinusCircle, Clock3, Loader, ShieldAlert } from 'lucide-react';

/* ============================================================
   TELEMETRY PRIMITIVES — one authority for the whole station.
   Every console reads its inks, formatters, and station chrome
   from here. The mission-control world is decided; these are
   its units.
   ============================================================ */

export const INK = {
  signal: '#2EFF7B',
  amber: '#FFB300',
  abort: '#FF4D4D',
  dim: '#7C93A6',
} as const;

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

export function istClock(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const MISSION_EPOCH_KEY = 'rrv-mission-epoch';

/** True mission-elapsed T+HH:MM:SS from the first station visit this browser. */
export function missionElapsed(date: Date): string {
  let epoch: number;
  try {
    const stored = window.localStorage.getItem(MISSION_EPOCH_KEY);
    epoch = stored ? Number(stored) : NaN;
    if (!Number.isFinite(epoch)) {
      epoch = date.getTime();
      window.localStorage.setItem(MISSION_EPOCH_KEY, String(epoch));
    }
  } catch {
    epoch = date.getTime();
  }
  let diff = Math.max(0, Math.floor((date.getTime() - epoch) / 1000));
  const h = Math.floor(diff / 3600);
  diff %= 3600;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `T+${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function rbiWindowLabel(date: Date): string {
  const hourIST = Number(
    date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' })
  );
  const inWindow = hourIST >= 8 && hourIST < 19;
  return inWindow ? 'RBI WINDOW OPEN' : 'RBI WINDOW CLOSED · QUEUED';
}

/* ---------- Recovery-state inks: one state, one ink ---------- */

export interface StateInk {
  key: string;
  label: string;
  ink: string;
  phosphor: string;
  border: string;
  bg: string;
}

export const STATE_INKS: Record<string, StateInk> = {
  RECOVERED: {
    key: 'RECOVERED',
    label: 'RECOVERED',
    ink: INK.signal,
    phosphor: 'text-phosphor',
    border: 'border-[#2EFF7B]/50',
    bg: 'bg-[#2EFF7B]/[0.06]',
  },
  P2P_SCHEDULED: {
    key: 'P2P_SCHEDULED',
    label: 'P2P LOCKED',
    ink: INK.amber,
    phosphor: 'text-phosphor-amber',
    border: 'border-[#FFB300]/50',
    bg: 'bg-[#FFB300]/[0.06]',
  },
  STOPPED_GUARDRAIL: {
    key: 'STOPPED_GUARDRAIL',
    label: 'RANGE STOP',
    ink: INK.abort,
    phosphor: 'text-phosphor-abort',
    border: 'border-[#FF4D4D]/50',
    bg: 'bg-[#FF4D4D]/[0.06]',
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    label: 'IN PROGRESS',
    ink: '#CFE4F2',
    phosphor: '',
    border: 'border-[#6A8296]/60',
    bg: 'bg-[#6A8296]/[0.08]',
  },
  AT_RISK: {
    key: 'AT_RISK',
    label: 'AT RISK',
    ink: '#CFE4F2',
    phosphor: '',
    border: 'border-[#6A8296]/60',
    bg: 'bg-[#6A8296]/[0.08]',
  },
  FAILED: {
    key: 'FAILED',
    label: 'FAILED',
    ink: INK.abort,
    phosphor: 'text-phosphor-abort',
    border: 'border-[#FF4D4D]/50',
    bg: 'bg-[#FF4D4D]/[0.06]',
  },
};

export function stateInk(status: string): StateInk {
  return STATE_INKS[status] ?? STATE_INKS.IN_PROGRESS;
}

/* ---------- Console chrome: station header ---------- */

interface StationHeaderProps {
  code: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}

export function StationHeader({ code, title, subtitle, right }: StationHeaderProps) {
  return (
    <div className="border-b border-[#1C3245] px-4 sm:px-5 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="numeric text-[10px] tracking-[0.25em] text-[#2EFF7B] uppercase">{code}</div>
          <h2 className="text-[15px] font-semibold text-[#CFE4F2] leading-snug mt-1">{title}</h2>
          <p className="text-xs text-[#7C93A6] leading-relaxed mt-1 max-w-[72ch]">{subtitle}</p>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

/* ---------- Live readouts: component status lamps ---------- */

export function StatusLamp({ on, ink }: { on: boolean; ink: string }) {
  return (
    <span
      className="inline-block w-[7px] h-[7px] rounded-full shrink-0"
      style={{
        backgroundColor: on ? ink : '#6A8296',
        boxShadow: on ? `0 0 8px ${ink}66` : 'none',
      }}
    />
  );
}

/* ---------- Compliance readout for one audit row ---------- */

export function ComplianceReadout({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] numeric ${ok ? 'text-[#2EFF7B]' : 'text-[#FF4D4D]'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      <span>{ok ? 'PASS' : 'HOLD'}</span>
    </span>
  );
}

/* ---------- Status readout for one audit row ---------- */

export function StatusReadout({ status }: { status: string }) {
  const ink = stateInk(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] border text-[10px] numeric tracking-wider ${ink.border} ${ink.bg}`}
      style={{ color: ink.ink }}
    >
      {status === 'RECOVERED' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'P2P_SCHEDULED' && <Clock3 className="w-3 h-3" />}
      {status === 'STOPPED_GUARDRAIL' && <MinusCircle className="w-3 h-3" />}
      {(status === 'IN_PROGRESS' || status === 'AT_RISK') && <Loader className="w-3 h-3" />}
      <span>{ink.label}</span>
    </span>
  );
}
