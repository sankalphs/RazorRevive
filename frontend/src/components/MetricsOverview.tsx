import type { BatchSummary } from '../services/api';
import { formatINR } from './telemetry';
import { TrendingUp, ShieldCheck } from 'lucide-react';

/* ============================================================
   KEY NUMBERS — four plain metrics on one card row.
   If the backend is down, say so in words — never zeros.
   ============================================================ */

interface MetricsProps {
  summary: BatchSummary | null;
  loading: boolean;
}

const Stat = ({
  value,
  label,
  sub,
  tone,
  loading,
}: {
  value: string;
  label: string;
  sub?: React.ReactNode;
  tone?: 'ok';
  loading: boolean;
}) => (
  <div className="px-5 py-5">
    <div className="text-[28px] font-semibold tracking-tight leading-none numeric">
      {loading ? (
        <span className="text-ink-4">—</span>
      ) : (
        <span className={tone === 'ok' ? 'text-ok' : 'text-ink'}>{value}</span>
      )}
    </div>
    <div className="mt-2 text-[13.5px] font-medium text-ink-2">{label}</div>
    {sub && <div className="mt-1 text-[12.5px] text-ink-3">{sub}</div>}
  </div>
);

const BackendDown = () => (
  <div className="px-5 py-8 text-center">
    <div className="text-[14px] font-semibold text-bad">Can't reach the backend</div>
    <p className="text-[13px] text-ink-3 mt-1.5 leading-relaxed max-w-[52ch] mx-auto">
      The metrics service isn't responding, so no numbers are shown — a dead backend should
      never look like zero recovery.
    </p>
    <p className="text-[12.5px] text-ink-2 mt-2">Start the backend on port 8000 and reload.</p>
  </div>
);

export const MetricsOverview = ({ summary, loading }: MetricsProps) => {
  const guardrailStops = summary?.guardrail_stops_count ?? 0;
  const aiWin = summary?.recovery_rate_ai?.toFixed(1) ?? '—';
  const baseWin = summary?.recovery_rate_baseline?.toFixed(1) ?? '—';
  const lost = !loading && !summary;

  return (
    <section aria-label="Key numbers">
      {lost ? (
        <div className="bg-white border border-line rounded-xl">
          <BackendDown />
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <Stat
              loading={loading}
              value={formatINR(summary?.total_revenue_at_risk)}
              label="Revenue at risk"
              sub={`${summary?.total_transactions ?? 0} failed payments and drop-offs`}
            />
            <Stat
              loading={loading}
              value={formatINR(summary?.total_recovered_ai)}
              label="Recovered by AI"
              tone="ok"
              sub={
                <span>
                  <span className="text-ok font-medium">{aiWin}%</span> recovery rate vs{' '}
                  {baseWin}% for basic retries
                </span>
              }
            />
            <Stat
              loading={loading}
              value={`+${formatINR(summary?.incremental_lift_rupees)}`}
              label="Extra vs basic retries"
              sub={
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-ok" />
                  <span className="text-ok font-medium">
                    +{summary?.lift_percentage?.toFixed(0) ?? 0}% more revenue recovered
                  </span>
                </span>
              }
            />
            <Stat
              loading={loading}
              value={`${summary?.roi_multiplier?.toFixed(0) ?? 0}× return`}
              label="On agent running cost"
              sub={
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-ok" />
                  <span className="text-ok font-medium">
                    {guardrailStops} unsafe actions blocked
                  </span>
                </span>
              }
            />
          </div>
        </div>
      )}
    </section>
  );
};
