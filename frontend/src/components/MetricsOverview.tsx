import type { BatchSummary } from '../services/api';
import { StationHeader, formatINR, StatusLamp, INK } from './telemetry';
import { TrendingUp, ShieldAlert } from 'lucide-react';

/* ============================================================
   VEHICLE STATUS BOARD
   Four phosphor readouts on one graticule wall — not icon
   cards. Awaiting data shows dim dashes; arrival animates in.
   A dead uplink never reads as zero recovery: it reads as
   SIGNAL LOST.
   ============================================================ */

interface MetricsProps {
  summary: BatchSummary | null;
  loading: boolean;
}

type ReadoutField = 'risk' | 'recovered' | 'lift' | 'roi';

const Readout = ({
  code,
  label,
  value,
  sub,
  lamp,
  accent,
  loading,
  field,
}: {
  code: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
  lamp?: boolean;
  accent?: 'signal' | 'amber';
  loading: boolean;
  field: ReadoutField;
}) => (
  <div className="relative px-5 py-5">
    <div className="flex items-center justify-between">
      <span className="numeric text-[9px] tracking-[0.22em] text-[#6A8296]">{code}</span>
      {lamp && (
        <span className="flex items-center gap-1.5">
          <StatusLamp on={!loading} ink={accent === 'amber' ? INK.amber : INK.signal} />
          <span className="numeric text-[9px] tracking-widest text-[#6A8296]">{loading ? 'ACQ' : 'LOCK'}</span>
        </span>
      )}
    </div>

    <div
      className={`mt-3 text-[26px] sm:text-[30px] numeric leading-none tracking-tight ${
        accent === 'amber'
          ? 'text-phosphor-amber'
          : accent === 'signal'
            ? 'text-phosphor'
            : 'text-[#CFE4F2]'
      }`}
      title={label}
    >
      {loading ? (
        <span className="text-[#6A8296]">-- --- ---</span>
      ) : (
        <span key={field} className="readout-arrival inline-block">
          {value}
        </span>
      )}
    </div>

    <div className="mt-2.5 text-xs text-[#7C93A6] leading-relaxed">{label}</div>
    {sub && <div className="mt-2 text-[11px] numeric text-[#7C93A6]">{sub}</div>}
  </div>
);

const SignalLost = () => (
  <div className="px-5 py-10 text-center">
    <div className="numeric text-[11px] tracking-[0.2em] text-[#FF4D4D]">SIGNAL LOST · TELEMETRY DOWNLINK OFFLINE</div>
    <p className="text-xs text-[#7C93A6] mt-2 leading-relaxed">
      The audit ledger is not answering. No readouts are shown so that a dead backend never reads as zero recovery.
    </p>
    <p className="numeric text-[10px] text-[#6A8296] mt-2 tracking-wider">VERIFY BACKEND ON :8000 AND RELOAD</p>
  </div>
);

export const MetricsOverview = ({ summary, loading }: MetricsProps) => {
  const guardrailStops = summary?.guardrail_stops_count ?? 0;
  const aiWin = summary?.recovery_rate_ai?.toFixed(1) ?? '—';
  const baseWin = summary?.recovery_rate_baseline?.toFixed(1) ?? '—';
  const lost = !loading && !summary;

  return (
    <section aria-label="Mission readouts" className="panel-graticule">
      <StationHeader
        code="VEHICLE STATUS · RRV-01"
        title="Recovery Vehicle Telemetry"
        subtitle="Live totals from the in-memory audit ledger. Every rupee traces to a logged decision with diagnosis, compliance certification, and settlement reference."
        right={
          <div className="numeric text-[10px] text-[#6A8296] tracking-wider text-right">
            <div>BATCH {summary?.batch_id?.slice(0, 8) ?? '—'}</div>
            <div className="mt-1">{summary?.total_transactions ?? 0} EVENTS</div>
          </div>
        }
      />
      {lost ? (
        <SignalLost />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1C3245]">
        <Readout
          field="risk"
          code="READOUT 01 · AT RISK"
          label={`Revenue at risk across ${summary?.total_transactions ?? 0} failed payments, mandate debits and drop-offs`}
          value={formatINR(summary?.total_revenue_at_risk)}
          loading={loading}
        />
        <Readout
          field="recovered"
          code="READOUT 02 · RECOVERED"
          label="Won back by the AI stack — sequencer, Hinglish agent, magic links"
          value={formatINR(summary?.total_recovered_ai)}
          sub={
            <span>
              <span className="text-[#2EFF7B]">{aiWin}%</span> win rate vs{' '}
              <span className="text-[#CFE4F2]">{baseWin}%</span> naive dunning
            </span>
          }
          accent="signal"
          lamp
          loading={loading}
        />
        <Readout
          field="lift"
          code="READOUT 03 · INCREMENTAL"
          label="Additional revenue beyond what blind 3-retry dunning would have recovered"
          value={`+${formatINR(summary?.incremental_lift_rupees)}`}
          sub={
            <span className="flex items-center gap-1.5 text-[#2EFF7B]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{summary?.lift_percentage?.toFixed(0) ?? 0}% lift over baseline</span>
            </span>
          }
          loading={loading}
        />
        <Readout
          field="roi"
          code="READOUT 04 · ROI"
          label={`Economic return on agent operating cost of ${formatINR(summary?.total_operational_cost)}`}
          value={`${summary?.roi_multiplier?.toFixed(0) ?? 0}— ROI`}
          sub={
            <span className="flex items-center gap-1.5 text-[#FF4D4D]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{guardrailStops} range-safety stops correctly fired</span>
            </span>
          }
          accent="amber"
          lamp
          loading={loading}
        />
        </div>
      )}
    </section>
  );
};
