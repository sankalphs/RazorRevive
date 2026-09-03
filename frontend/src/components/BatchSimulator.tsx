import { useEffect, useRef, useState } from 'react';
import { Play, RotateCw, Cpu, CheckCircle2, MinusCircle } from 'lucide-react';
import { type BatchSummary, runBatchSimulation } from '../services/api';
import { StationHeader, formatINR, INK, StatusLamp } from './telemetry';

/* ============================================================
   STA-01 · LAUNCH COUNTDOWN
   The batch run as a terminal count. Switches are hardware
   guards: batch size, verticals, LLM diagnostician. GO/NO-GO
   is decided by the range, not the visitor.
   ============================================================ */

interface BatchSimulatorProps {
  summary: BatchSummary | null;
  onSimulationComplete: (newSummary: BatchSummary) => void;
}

const COUNTDOWN_PHASES: { t: string; call: string }[] = [
  { t: 'T-10s', call: 'SWITCH TO INTERNAL POWER' },
  { t: 'T-08s', call: 'DIAGNOSTICIAN SPOOLING · MINIMAX-M3' },
  { t: 'T-06s', call: 'GUARDRAIL ARMING · RBI CONTACT HOURS' },
  { t: 'T-04s', call: 'BANK HEALTH RADAR · SAMPLING ISSUERS' },
  { t: 'T-02s', call: 'SEQUENCER LOCKED · PAYLOAD ARMED' },
  { t: 'T-00s', call: 'IGNITION · BATCH DISPATCHED' },
];

export const BatchSimulator = ({ summary, onSimulationComplete }: BatchSimulatorProps) => {
  const [batchSize, setBatchSize] = useState(100);
  const [verticals, setVerticals] = useState<string[]>(['SaaS', 'D2C', 'B2B', 'OTT']);
  const [useLLM, setUseLLM] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState<{ t: string; call: string } | null>(null);
  const runRef = useRef(0);

  const toggleVertical = (v: string) => {
    if (verticals.includes(v)) {
      if (verticals.length > 1) setVerticals(verticals.filter((item) => item !== v));
    } else {
      setVerticals([...verticals, v]);
    }
  };

  useEffect(() => {
    if (!isRunning || !countdown) return;
    const id = setTimeout(() => {
      setCountdown((current) => {
        const idx = current ? COUNTDOWN_PHASES.findIndex((p) => p.t === current.t) : -1;
        return idx >= 0 && idx < COUNTDOWN_PHASES.length - 1 ? COUNTDOWN_PHASES[idx + 1] : null;
      });
    }, 420);
    return () => clearTimeout(id);
  }, [countdown, isRunning]);

  const handleLaunch = async () => {
    if (isRunning) return;
    const thisRun = ++runRef.current;
    setIsRunning(true);
    setCountdown(COUNTDOWN_PHASES[0]);

    try {
      const result = await runBatchSimulation(batchSize, verticals, useLLM);
      if (runRef.current !== thisRun) return;
      let elapsedPhases = 1;
      const phase = COUNTDOWN_PHASES[0];
      setCountdown(phase);
      // hold T-00s long enough to read ignition, then hand over
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 420 * (COUNTDOWN_PHASES.length - 1) - 420 * elapsedPhases) + 300));
      if (runRef.current !== thisRun) return;
      onSimulationComplete(result);
      setCountdown(null);
      setIsRunning(false);
    } catch (err) {
      console.error('Batch simulation error:', err);
      setCountdown(null);
      setIsRunning(false);
    }
  };

  const aiPct = summary?.recovery_rate_ai ?? 0;
  const basePct = summary?.recovery_rate_baseline ?? 0;
  const isHardStop = (type: string) => type === 'HARD_STOP_NO_ACTION';

  return (
    <div className="space-y-5">
      {/* Sequencer panel */}
      <section className="panel-graticule" aria-label="Batch recovery sequencer">
        <StationHeader
          code="STA-01 · BATCH RECOVERY SIMULATION"
          title="Launch Countdown — Batch Sequencer"
          subtitle="Arm the batch, hold for the range, and measure rupees recovered across failed transactions, recurring mandate debits and checkout drop-offs against a blind naive-dunning baseline."
          right={
            <div className="numeric text-[10px] tracking-wider text-right">
              <div className="text-[#6A8296]">RANGE STATUS</div>
              <div className={`mt-1 flex items-center justify-end gap-2 ${isRunning ? 'text-[#FFB300]' : 'text-[#2EFF7B]'}`}>
                <StatusLamp on ink={isRunning ? INK.amber : INK.signal} />
                {isRunning ? 'COUNT IN PROGRESS' : 'GO FOR LAUNCH'}
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 px-4 sm:px-5 py-5">
          {/* Hardware guards */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="numeric text-[10px] tracking-[0.18em] text-[#7C93A6]">BATCH SIZE</span>
              <div className="flex gap-2">
                {[50, 100, 250, 500].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBatchSize(size)}
                    aria-pressed={batchSize === size}
                    className={`numeric px-3 py-1.5 text-xs border transition-colors ${
                      batchSize === size
                        ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.07]'
                        : 'border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2] hover:border-[#6A8296]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="numeric text-[10px] tracking-[0.18em] text-[#7C93A6]">VERTICALS</span>
              <div className="flex gap-2">
                {['SaaS', 'D2C', 'B2B', 'OTT'].map((v) => {
                  const on = verticals.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVertical(v)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 numeric px-3 py-1.5 text-xs border transition-colors ${
                        on
                          ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.07]'
                          : 'border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2] hover:border-[#6A8296]'
                      }`}
                    >
                      <StatusLamp on={on} ink={INK.signal} />
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="numeric text-[10px] tracking-[0.18em] text-[#7C93A6]">DIAGNOSTICIAN</span>
              <button
                onClick={() => setUseLLM(!useLLM)}
                aria-pressed={useLLM}
                className={`flex items-center gap-2.5 numeric px-3 py-1.5 text-xs border transition-colors ${
                  useLLM
                    ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.07]'
                    : 'border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                MINIMAX-M3 LLM {useLLM ? 'ENGAGED' : 'BYPASSED'}
              </button>
              <span className="text-[11px] text-[#6A8296]">
                Bypass falls back to the deterministic error-code rule map — recovery never blocks.
              </span>
            </div>
          </div>

          {/* Launch control */}
          <div className="lg:w-64 flex flex-col justify-center">
            <button
              onClick={handleLaunch}
              disabled={isRunning}
              className={`w-full py-4 numeric text-sm font-semibold tracking-[0.12em] border transition-all flex items-center justify-center gap-2.5 ${
                isRunning
                  ? 'border-[#FFB300]/60 text-[#FFB300] bg-[#FFB300]/[0.06] cursor-wait'
                  : 'border-[#2EFF7B] text-[#05080F] bg-[#2EFF7B] hover:shadow-[0_0_30px_-8px_rgba(46,255,123,0.6)] active:translate-y-px'
              }`}
            >
              {isRunning ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'HOLD · COUNT RUNNING' : 'EXECUTE BATCH LAUNCH'}
            </button>
            <div className="mt-2 numeric text-[10px] text-[#6A8296] text-center tracking-wider">
              {isRunning ? 'DO NOT CLOSE THE RANGE' : `PAYLOAD · ${batchSize} EVENTS · ${verticals.length} VERTICALS`}
            </div>
          </div>
        </div>

        {/* Countdown strip */}
        {countdown && (
          <div className="border-t border-[#1C3245] px-4 sm:px-5 py-3.5 bg-[#05080F]/60" role="status">
            <div className="flex items-center gap-4">
              <span className="numeric text-xl text-phosphor-amber tracking-tight">{countdown.t}</span>
              <div className="h-px flex-1 bg-[#1C3245] relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#FFB300] transition-all duration-300" style={{ width: `${((COUNTDOWN_PHASES.findIndex((p) => p.t === countdown.t) + 1) / COUNTDOWN_PHASES.length) * 100}%` }} />
              </div>
              <span className="numeric text-xs text-[#FFB300] tracking-[0.14em]">{countdown.call}</span>
            </div>
          </div>
        )}
      </section>

      {/* Post-flight readouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trajectory comparison */}
        <section className="panel-graticule" aria-label="Recovery performance comparison">
          <StationHeader
            code="TRAJECTORY COMPARISON"
            title="AI Stack vs Blind Dunning"
            subtitle={`Batch of ${summary?.total_transactions ?? 0} at-risk events, identical inputs, two strategies.`}
          />
          <div className="px-4 sm:px-5 py-5 space-y-5">
            {/* AI trace */}
            <div>
              <div className="flex items-baseline justify-between text-[11px] numeric mb-1.5">
                <span className="text-[#2EFF7B]">RRV STACK · SEQUENCER + P2P AGENT + MAGIC LINKS</span>
                <span className="text-[#2EFF7B] text-sm text-phosphor">
                  {aiPct.toFixed(1)}% · {formatINR(summary?.total_recovered_ai)}
                </span>
              </div>
              <div className="h-3 bg-[#0D1524] border border-[#1C3245] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#2EFF7B] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, aiPct))}%`, boxShadow: '0 0 12px rgba(46,255,123,0.5)' }}
                />
              </div>
            </div>

            {/* Baseline trace */}
            <div>
              <div className="flex items-baseline justify-between text-[11px] numeric mb-1.5">
                <span className="text-[#7C93A6]">BASELINE · BLIND 3 RETRIES + GENERIC EMAIL</span>
                <span className="text-[#7C93A6] text-sm">
                  {basePct.toFixed(1)}% · {formatINR(summary?.total_recovered_baseline)}
                </span>
              </div>
              <div className="h-3 bg-[#0D1524] border border-[#1C3245] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#6A8296] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, basePct))}%` }}
                />
              </div>
            </div>

            {/* Flight economics */}
            <div className="grid grid-cols-3 divide-x divide-[#1C3245] border border-[#1C3245] bg-[#05080F]/50">
              {[
                { label: 'INCREMENTAL WON BACK', value: `+${formatINR(summary?.incremental_lift_rupees)}`, cls: 'text-[#2EFF7B]' },
                { label: 'AGENT OPERATING COST', value: formatINR(summary?.total_operational_cost), cls: 'text-[#CFE4F2]' },
                { label: 'NET ROI MULTIPLIER', value: `${summary?.roi_multiplier?.toFixed(0) ?? 0}—`, cls: 'text-phosphor-amber' },
              ].map((cell) => (
                <div key={cell.label} className="px-4 py-3.5">
                  <div className="numeric text-[9px] tracking-[0.18em] text-[#6A8296]">{cell.label}</div>
                  <div className={`numeric text-lg mt-2 tracking-tight ${cell.cls}`}>{cell.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interventions manifest */}
        <section className="panel-graticule" aria-label="Interventions and guardrails manifest">
          <StationHeader
            code="PAYLOAD MANIFEST"
            title="Interventions & Range-Safety Stops"
            subtitle="Every event routed to exactly one bounded intervention. Hard stops are the system working, not failing — they protect merchant trust and kill bounce penalty fees."
          />
          <div className="px-4 sm:px-5 py-5">
            <div className="space-y-2.5">
              {summary?.interventions_breakdown &&
                Object.entries(summary.interventions_breakdown).map(([type, count]) => {
                  const hard = isHardStop(type);
                  return (
                    <div
                      key={type}
                      className={`flex items-center justify-between px-3.5 py-2.5 border text-xs numeric ${
                        hard ? 'border-[#FF4D4D]/40 bg-[#FF4D4D]/[0.05]' : 'border-[#1C3245] bg-[#0D1524]/70'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {hard ? (
                          <MinusCircle className="w-3.5 h-3.5 text-[#FF4D4D]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2EFF7B]" />
                        )}
                        <span className={hard ? 'text-[#FF4D4D]' : 'text-[#CFE4F2]'}>
                          {type.replace(/_/g, ' ')}
                        </span>
                      </span>
                      <span className={hard ? 'text-[#FF4D4D]' : 'text-[#7C93A6]'}>{count} EVENTS</span>
                    </div>
                  );
                })}
            </div>

            <p className="mt-4 text-[11px] text-[#7C93A6] leading-relaxed border-l-2 border-[#2EFF7B] pl-3">
              Permanent declines — expired cards, fraud tags, closed accounts — are halted with zero retry
              attempts, inside RBI contact hours, inside the 3-touchpoint / 7-day ceiling.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
