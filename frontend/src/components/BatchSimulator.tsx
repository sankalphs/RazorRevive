import { useState } from 'react';
import { Play, Loader2, CheckCircle2, MinusCircle } from 'lucide-react';
import { type BatchSummary, runBatchSimulation } from '../services/api';
import { PanelHeader, formatINR, humanizeIntervention } from './telemetry';

/* ============================================================
   SIMULATION — configure a batch, run it, read the honest
   comparison against naive retries. One primary button.
   ============================================================ */

interface BatchSimulatorProps {
  summary: BatchSummary | null;
  onSimulationComplete: (newSummary: BatchSummary) => void;
}

export const BatchSimulator = ({ summary, onSimulationComplete }: BatchSimulatorProps) => {
  const [batchSize, setBatchSize] = useState(100);
  const [verticals, setVerticals] = useState<string[]>(['SaaS', 'D2C', 'B2B', 'OTT']);
  const [useLLM, setUseLLM] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleVertical = (v: string) => {
    if (verticals.includes(v)) {
      if (verticals.length > 1) setVerticals(verticals.filter((item) => item !== v));
    } else {
      setVerticals([...verticals, v]);
    }
  };

  const handleRun = async () => {
    if (isRunning) return;
    setError(null);
    setIsRunning(true);
    try {
      const result = await runBatchSimulation(batchSize, verticals, useLLM);
      onSimulationComplete(result);
    } catch (err) {
      console.error('Batch simulation error:', err);
      setError('The simulation could not run. Check that the backend is running on port 8000, then try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const aiPct = summary?.recovery_rate_ai ?? 0;
  const basePct = summary?.recovery_rate_baseline ?? 0;

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Run a simulation">
        <PanelHeader
          title="Run a recovery simulation"
          subtitle="Process a batch of failed payments through the AI engine — diagnosis, safety checks, then the right recovery action for each one."
        />

        <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
          {/* Settings */}
          <div className="space-y-5">
            <div>
              <span className="block text-[13px] font-medium text-ink-2 mb-2">Batch size</span>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 250, 500].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBatchSize(size)}
                    aria-pressed={batchSize === size}
                    className={`numeric px-3.5 py-1.5 text-[13px] rounded-lg border transition-colors ${
                      batchSize === size
                        ? 'border-accent text-accent-strong bg-accent-soft'
                        : 'border-line-strong text-ink-2 bg-white hover:bg-wash'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-medium text-ink-2 mb-2">Business types</span>
              <div className="flex flex-wrap gap-2">
                {['SaaS', 'D2C', 'B2B', 'OTT'].map((v) => {
                  const on = verticals.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVertical(v)}
                      aria-pressed={on}
                      className={`px-3.5 py-1.5 text-[13px] rounded-lg border transition-colors ${
                        on
                          ? 'border-accent text-accent-strong bg-accent-soft'
                          : 'border-line-strong text-ink-2 bg-white hover:bg-wash'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-medium text-ink-2 mb-2">AI diagnosis</span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setUseLLM(!useLLM)}
                  aria-pressed={useLLM}
                  className={`px-3.5 py-1.5 text-[13px] rounded-lg border transition-colors ${
                    useLLM
                      ? 'border-accent text-accent-strong bg-accent-soft'
                      : 'border-line-strong text-ink-2 bg-white hover:bg-wash'
                  }`}
                >
                  {useLLM ? 'MiniMax-M3 LLM: on' : 'LLM off — using rule-based fallback'}
                </button>
                <span className="text-[12.5px] text-ink-3">
                  Recovery never blocks — if the LLM is off, a rule map diagnoses instead.
                </span>
              </div>
            </div>
          </div>

          {/* Run */}
          <div className="lg:w-64">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`w-full py-3 text-[14px] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-wash text-ink-3 cursor-wait'
                  : 'bg-accent text-white hover:bg-accent-strong active:translate-y-px'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run simulation
                </>
              )}
            </button>
            <div className="mt-2 text-[12px] text-ink-3 text-center numeric">
              {batchSize} failed payments · {verticals.length} business types
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-5 arrive px-4 py-3 rounded-lg bg-bad-soft border border-bad-line text-[13px] text-bad">
            {error}
          </div>
        )}
      </section>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison */}
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="AI vs baseline comparison">
          <PanelHeader
            title="AI vs basic retries"
            subtitle={
              summary
                ? `Same ${summary.total_transactions} failed payments, two strategies.`
                : 'Results appear here after the first run.'
            }
          />
          {summary ? (
          <div className="px-5 pb-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-medium text-ink">RazorRevive AI</span>
                <span className="text-[13px] font-medium text-ok numeric">
                  {aiPct.toFixed(1)}% · {formatINR(summary?.total_recovered_ai)}
                </span>
              </div>
              <div className="h-2.5 bg-wash rounded-full overflow-hidden">
                <div
                  className="h-full bg-ok rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, aiPct))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-medium text-ink-3">Basic retries + generic email</span>
                <span className="text-[13px] font-medium text-ink-3 numeric">
                  {basePct.toFixed(1)}% · {formatINR(summary?.total_recovered_baseline)}
                </span>
              </div>
              <div className="h-2.5 bg-wash rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink-4 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, basePct))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-line rounded-lg overflow-hidden border border-line">
              {[
                { label: 'Extra recovered', value: `+${formatINR(summary?.incremental_lift_rupees)}`, cls: 'text-ok' },
                { label: 'Running cost', value: formatINR(summary?.total_operational_cost), cls: 'text-ink' },
                { label: 'Return on cost', value: `${summary?.roi_multiplier?.toFixed(0) ?? 0}×`, cls: 'text-ok' },
              ].map((cell) => (
                <div key={cell.label} className="px-4 py-3 bg-white">
                  <div className="text-[12px] text-ink-3">{cell.label}</div>
                  <div className={`text-[17px] font-semibold mt-1 tracking-tight numeric ${cell.cls}`}>{cell.value}</div>
                </div>
              ))}
            </div>
          </div>
          ) : (
            <div className="px-5 pb-8 pt-2">
              <div className="border border-dashed border-line-strong rounded-lg px-4 py-8 text-center text-[13px] text-ink-3">
                Run the simulation to compare the two strategies.
              </div>
            </div>
          )}
        </section>

        {/* Actions taken */}
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Actions taken">
          <PanelHeader
            title="Actions the engine took"
            subtitle="Every payment gets exactly one action. Stopped items are the safety rules working — they prevent spam, penalties and customer churn."
          />
          {summary?.interventions_breakdown && Object.keys(summary.interventions_breakdown).length > 0 ? (
          <div className="px-5 pb-5">
            <div className="space-y-2">
              {summary &&
                Object.entries(summary.interventions_breakdown).map(([type, count]) => {
                  const hard = type === 'HARD_STOP_NO_ACTION';
                  return (
                    <div
                      key={type}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-[13px] ${
                        hard ? 'border-bad-line bg-bad-soft' : 'border-line bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {hard ? (
                          <MinusCircle className="w-4 h-4 text-bad" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-ok" />
                        )}
                        <span className={hard ? 'text-bad font-medium' : 'text-ink'}>
                          {humanizeIntervention(type)}
                        </span>
                      </span>
                      <span className={`numeric text-[13px] ${hard ? 'text-bad' : 'text-ink-3'}`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>

            <p className="mt-4 text-[12.5px] text-ink-3 leading-relaxed">
              Permanent failures — expired cards, fraud flags, closed accounts — are left alone
              entirely: no retries, no contact, inside RBI's allowed contact hours.
            </p>
          </div>
          ) : (
            <div className="px-5 pb-8 pt-2">
              <div className="border border-dashed border-line-strong rounded-lg px-4 py-8 text-center text-[13px] text-ink-3">
                The engine's action breakdown appears here after the first run.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
