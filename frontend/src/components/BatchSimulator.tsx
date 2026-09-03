import { useState } from 'react';
import { Play, RotateCcw, Zap, Sparkles, CheckCircle2, AlertOctagon, TrendingUp, ShieldCheck } from 'lucide-react';
import { type BatchSummary, runBatchSimulation } from '../services/api';

interface BatchSimulatorProps {
  summary: BatchSummary | null;
  onSimulationComplete: (newSummary: BatchSummary) => void;
}

export const BatchSimulator: React.FC<BatchSimulatorProps> = ({ summary, onSimulationComplete }) => {
  const [batchSize, setBatchSize] = useState<number>(100);
  const [verticals, setVerticals] = useState<string[]>(['SaaS', 'D2C', 'B2B', 'OTT']);
  const [useLLM, setUseLLM] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const toggleVertical = (v: string) => {
    if (verticals.includes(v)) {
      if (verticals.length > 1) setVerticals(verticals.filter((item) => item !== v));
    } else {
      setVerticals([...verticals, v]);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setProgress(15);
    try {
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 250);

      const result = await runBatchSimulation(batchSize, verticals, useLLM);
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        onSimulationComplete(result);
        setIsRunning(false);
        setProgress(0);
      }, 400);
    } catch (err) {
      console.error('Batch simulation error:', err);
      setIsRunning(false);
      setProgress(0);
    }
  };

  const formatINR = (val?: number) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const baselinePct = summary?.recovery_rate_baseline || 19.5;
  const aiPct = summary?.recovery_rate_ai || 74.2;

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Settings Left */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#3395FF]" />
                <span>Batch Recovery Simulation Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Measure rupees recovered across failed transactions, recurring mandate debits, and checkout drop-offs.
              </p>
            </div>

            {/* Batch Size Selection */}
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-300">Batch Size:</span>
              {[50, 100, 250, 500].map((size) => (
                <button
                  key={size}
                  onClick={() => setBatchSize(size)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    batchSize === size
                      ? 'bg-[#3395FF] text-white shadow-md shadow-blue-500/20'
                      : 'bg-[#162238] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size} Txns
                </button>
              ))}
            </div>

            {/* Verticals Multi-Select */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Merchant Verticals:</span>
              {['SaaS', 'D2C', 'B2B', 'OTT'].map((v) => {
                const isSelected = verticals.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggleVertical(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                        : 'bg-transparent border-[#1E2E52] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Right */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer bg-[#162238] px-3 py-2 rounded-xl border border-[#1E2E52]">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                className="rounded border-[#1E2E52] text-[#3395FF] focus:ring-0"
              />
              <span className="text-xs text-slate-300 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>MiniMax AI Diagnostics</span>
              </span>
            </label>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all ${
                isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#3395FF] to-[#10B981] text-white hover:opacity-95 shadow-blue-500/25 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Batch Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar during run */}
        {isRunning && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Evaluating root causes &amp; enforcing RBI compliance...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[#162238] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#3395FF] to-[#10B981] h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison: Baseline vs RazorRevive AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Visualizer */}
        <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#3395FF]" />
              <span>Recovery Performance: Baseline vs. RazorRevive AI</span>
            </h3>
            <span className="text-xs text-slate-400">Batch of {summary?.total_transactions || 100}</span>
          </div>

          {/* AI Win Bar */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RazorRevive AI (Downtime Sequencer + Hinglish P2P + Magic Links)</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {aiPct.toFixed(1)}% ({formatINR(summary?.total_recovered_ai)})
                </span>
              </div>
              <div className="w-full bg-[#162238] rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-3 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(5, aiPct))}%` }}
                />
              </div>
            </div>

            {/* Baseline Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-400 flex items-center space-x-1">
                  <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Industry Baseline (Blind 3 Retries + Generic Email)</span>
                </span>
                <span className="font-bold text-slate-400">
                  {baselinePct.toFixed(1)}% ({formatINR(summary?.total_recovered_baseline)})
                </span>
              </div>
              <div className="w-full bg-[#162238] rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-slate-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(5, baselinePct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Financial Value Box */}
          <div className="mt-6 p-4 rounded-xl bg-[#0D1527] border border-[#1E2E52]/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Net Additional Revenue Won Back</div>
              <div className="text-xl font-bold text-emerald-400">
                +{formatINR(summary?.incremental_lift_rupees)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Agent Operating Cost</div>
              <div className="text-sm font-semibold text-slate-300">
                {formatINR(summary?.total_operational_cost)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Net ROI Multiplier</div>
              <div className="text-xl font-bold text-blue-400">
                {summary?.roi_multiplier.toFixed(0) || '0'}x
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Failure Mode & Guardrails */}
        <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Interventions &amp; Guardrails Enforced</span>
            </h3>
            <span className="text-xs text-slate-400">Safe &amp; Bounded</span>
          </div>

          <div className="space-y-3">
            {summary?.interventions_breakdown &&
              Object.entries(summary.interventions_breakdown).map(([type, count]) => {
                const isHardStop = type === 'HARD_STOP_NO_ACTION';
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#162238]/60 border border-[#1E2E52]/50"
                  >
                    <span className="font-medium text-slate-300 flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHardStop ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{type.replace(/_/g, ' ')}</span>
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        isHardStop
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {count} txns
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 bg-blue-500/5 border border-blue-500/20 p-2.5 rounded-lg">
            <strong>Compliance Guarantee:</strong> All permanent declines (expired cards, fraud tags) are halted instantly with 0 retry attempts, preserving merchant trust and eliminating bounce penalty fees.
          </div>
        </div>
      </div>
    </div>
  );
};
