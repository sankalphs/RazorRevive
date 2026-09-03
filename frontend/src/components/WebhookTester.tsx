import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Radio } from 'lucide-react';
import { fetchSampleWebhooks, sendWebhookEvent } from '../services/api';
import { StationHeader, formatINR, ComplianceReadout, stateInk, StatusLamp, INK } from './telemetry';

/* ============================================================
   STA-05 · SIGNAL INGEST
   Fire a raw Razorpay webhook at the range and watch the
   full pipeline answer in one pass: diagnosis, guardrail
   certification, intervention, settlement.
   ============================================================ */

export const WebhookTester: React.FC = () => {
  const [samples, setSamples] = useState<Record<string, any>>({});
  const [selectedSampleKey, setSelectedSampleKey] = useState('payment_failed_gateway');
  const [jsonPayload, setJsonPayload] = useState('{\n  "event": "payment.failed"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSampleWebhooks()
      .then((data) => {
        setSamples(data);
        if (data['payment_failed_gateway']) {
          setJsonPayload(JSON.stringify(data['payment_failed_gateway'], null, 2));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectSample = (key: string) => {
    setSelectedSampleKey(key);
    if (samples[key]) {
      setJsonPayload(JSON.stringify(samples[key], null, 2));
      setResult(null);
      setError(null);
    }
  };

  const handleDispatch = async () => {
    try {
      setError(null);
      setLoading(true);
      const parsed = JSON.parse(jsonPayload);
      const res = await sendWebhookEvent(parsed);
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown dispatch error');
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(jsonPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Inbound signal */}
      <section className="panel-graticule flex flex-col" aria-label="Webhook dispatcher">
        <StationHeader
          code="STA-05 · INBOUND SIGNAL"
          title="Razorpay Webhook Dispatcher"
          subtitle="Fire a raw payment.failed or subscription.halted event at the range. The full pipeline — parse, diagnose, guardrail, intervene, audit — runs on dispatch."
          right={
            <button
              onClick={copyPayload}
              className="numeric text-[10px] tracking-wider text-[#7C93A6] hover:text-[#2EFF7B] transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2EFF7B]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          }
        />

        <div className="px-4 sm:px-5 py-4 space-y-4 flex-1 flex flex-col">
          {/* Preset signals */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(samples).map((key) => {
              const on = selectedSampleKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSample(key)}
                  aria-pressed={on}
                  className={`numeric px-3 py-1.5 text-[10px] tracking-wider border transition-colors ${
                    on
                      ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.07]'
                      : 'border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2] hover:border-[#6A8296]'
                  }`}
                >
                  {key.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* Raw signal editor */}
          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            spellCheck={false}
            aria-label="Webhook JSON payload"
            className="station-input flex-1 min-h-[300px] p-4 text-xs leading-relaxed caret-signal resize-none"
          />

          <button
            onClick={handleDispatch}
            disabled={loading}
            className={`w-full py-3.5 numeric text-sm font-semibold tracking-[0.12em] border transition-colors flex items-center justify-center gap-2.5 ${
              loading
                ? 'border-[#FFB300]/60 text-[#FFB300] bg-[#FFB300]/[0.06] cursor-wait'
                : 'border-[#2EFF7B] text-[#05080F] bg-[#2EFF7B] hover:shadow-[0_0_30px_-8px_rgba(46,255,123,0.6)] active:translate-y-px'
            }`}
          >
            {loading ? (
              <>
                <StatusLamp on ink={INK.amber} />
                ACQUIRING SIGNAL…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                DISPATCH WEBHOOK
              </>
            )}
          </button>
        </div>
      </section>

      {/* Decision record */}
      <section className="panel-graticule flex flex-col" aria-label="Autonomous agent decision">
        <StationHeader
          code="DECISION RECORD"
          title="Autonomous Agent Decision"
          subtitle="Immediate classification, guardrail certification, and intervention dispatched on receipt."
        />
        <div className="px-4 sm:px-5 py-4 flex-1">
          {error ? (
            <div className="h-full border border-[#FF4D4D]/50 bg-[#FF4D4D]/[0.05] px-4 py-6 text-center">
              <div className="numeric text-[11px] text-[#FF4D4D] tracking-wider">DISPATCH REJECTED · SIGNAL MALFORMED</div>
              <p className="text-[11px] text-[#7C93A6] mt-2">{error}</p>
              <p className="text-[10px] text-[#6A8296] mt-1">Fix the JSON on the left and re-dispatch.</p>
            </div>
          ) : loading ? (
            <div className="h-full min-h-[300px] border border-[#FFB300]/40 bg-[#FFB300]/[0.04] flex flex-col items-center justify-center text-center px-6">
              <StatusLamp on ink={INK.amber} />
              <div className="numeric text-[11px] text-[#FFB300] mt-3 tracking-wider flex items-center gap-2">
                ACQUIRING SIGNAL
                <span className="station-cursor">_</span>
              </div>
              <p className="text-[11px] text-[#7C93A6] mt-1.5 leading-relaxed">
                Diagnosing, certifying guardrails, dispatching intervention — first response can take several
                seconds while the LLM diagnostician reasons.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4 readout-arrival">
              {/* Final state */}
              <div className="grid grid-cols-2 divide-x divide-[#1C3245] border border-[#1C3245] bg-[#05080F]/50">
                <div className="px-4 py-3.5">
                  <div className="numeric text-[9px] tracking-[0.18em] text-[#6A8296]">FINAL STATE</div>
                  <div className={`numeric text-lg mt-2 tracking-tight ${stateInk(result.final_status).phosphor || 'text-[#CFE4F2]'}`}>
                    {stateInk(result.final_status).label}
                  </div>
                </div>
                <div className="px-4 py-3.5 text-right">
                  <div className="numeric text-[9px] tracking-[0.18em] text-[#6A8296]">RECOVERED</div>
                  <div className="numeric text-lg mt-2 tracking-tight text-phosphor">
                    {formatINR(result.amount_recovered)}
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="border border-[#1C3245] bg-[#0D1524]/60 px-4 py-3.5">
                <div className="numeric text-[9px] tracking-[0.2em] text-[#7C93A6] mb-2">
                  ROOT-CAUSE DIAGNOSTIC · {result.diagnosis.category}
                </div>
                <div className="text-[11px] text-[#CFE4F2]">{result.diagnosis.root_cause}</div>
                <p className="numeric text-[10px] text-[#6A8296] leading-relaxed mt-2.5 border-t border-[#1C3245] pt-2.5">
                  {result.diagnosis.ai_reasoning}
                </p>
              </div>

              {/* Guardrail certification */}
              <div className="border border-[#1C3245] bg-[#0D1524]/60 px-4 py-3.5">
                <div className="numeric text-[9px] tracking-[0.2em] text-[#7C93A6] mb-2">GUARDRAIL CERTIFICATION</div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <ComplianceReadout ok={result.compliance.is_compliant} />
                  <span className="text-[#7C93A6]">{result.compliance.reason}</span>
                </div>
              </div>

              {/* Raw references */}
              <div className="border border-[#1C3245] bg-[#05080F]/60 px-4 py-3 numeric text-[10px] space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-[#6A8296] tracking-wider">TXN</span>
                  <span className="text-[#2EFF7B]">{result.transaction_id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6A8296] tracking-wider">INTERVENTION</span>
                  <span className="text-[#CFE4F2]">{result.intervention.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6A8296] tracking-wider">SETTLEMENT REF</span>
                  <span className="text-[#CFE4F2]">{result.settlement_ref || 'NONE · DEFERRED OR HARD STOP'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border border-dashed border-[#1C3245] flex flex-col items-center justify-center text-center px-6">
              <Radio className="w-7 h-7 text-[#6A8296]" />
              <div className="numeric text-[11px] text-[#7C93A6] mt-3 tracking-wider">CHANNEL QUIET</div>
              <p className="text-[11px] text-[#6A8296] mt-1.5 leading-relaxed">
                Select a preset signal on the left and dispatch it to watch the pipeline answer.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
