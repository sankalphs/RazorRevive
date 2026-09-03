import { IndianRupee, TrendingUp, ShieldAlert, Sparkles, ArrowUpRight } from 'lucide-react';
import type { BatchSummary } from '../services/api';

interface MetricsProps {
  summary: BatchSummary | null;
  loading: boolean;
}

export const MetricsOverview = ({ summary, loading }: MetricsProps) => {
  const formatINR = (val?: number) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Revenue at Risk */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Revenue at Risk</span>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {loading ? '...' : formatINR(summary?.total_revenue_at_risk)}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1.5">
          <span>Across</span>
          <span className="text-white font-medium">{summary?.total_transactions || 0}</span>
          <span>failed transactions / drop-offs</span>
        </div>
      </div>

      {/* Card 2: Revenue Recovered by AI */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-xl p-4 relative overflow-hidden glow-emerald">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Money Recovered (AI)</span>
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400 tracking-tight">
          {loading ? '...' : formatINR(summary?.total_recovered_ai)}
        </div>
        <div className="mt-2 flex items-center text-xs text-emerald-300/80 space-x-2">
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-semibold rounded text-[11px]">
            {summary?.recovery_rate_ai.toFixed(1) || '0.0'}% Win Rate
          </span>
          <span className="text-slate-400">vs {summary?.recovery_rate_baseline.toFixed(1) || '0.0'}% Baseline</span>
        </div>
      </div>

      {/* Card 3: Incremental Lift vs Baseline */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Incremental Win-Back</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-400 tracking-tight">
          {loading ? '...' : `+${formatINR(summary?.incremental_lift_rupees)}`}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1.5">
          <span className="text-emerald-400 font-semibold">+{summary?.lift_percentage.toFixed(0) || '0'}%</span>
          <span>lift over blind naive dunning</span>
        </div>
      </div>

      {/* Card 4: Net ROI & Guardrail Protection */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Economic ROI</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-400 tracking-tight">
          {loading ? '...' : `${summary?.roi_multiplier.toFixed(0) || '0'}x ROI`}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Cost: {formatINR(summary?.total_operational_cost)}</span>
          <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-[10px] font-medium">
            {summary?.guardrail_stops_count || 0} Guardrail Stops
          </span>
        </div>
      </div>
    </div>
  );
};
