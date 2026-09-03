import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Inbox } from 'lucide-react';
import { fetchSampleWebhooks, sendWebhookEvent, type AuditLogEntry, type WebhookPayload } from '../services/api';
import { PanelHeader, formatINR, statusTone, DecisionRecord, humanizeIntervention, sampleLabel } from './telemetry';

/* ============================================================
   WEBHOOK TESTER — paste a Razorpay event, watch the engine
   classify it, check it against safety rules, and act.
   ============================================================ */

export const WebhookTester: React.FC = () => {
  const [samples, setSamples] = useState<Record<string, WebhookPayload>>({});
  const [selectedSampleKey, setSelectedSampleKey] = useState('payment_failed_gateway');
  const [jsonPayload, setJsonPayload] = useState('{\n  "event": "payment.failed"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditLogEntry | null>(null);
  const [error, setError] = useState<{ kind: 'json' | 'network'; message: string } | null>(null);
  const [samplesFailed, setSamplesFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSampleWebhooks()
      .then((data) => {
        setSamples(data);
        if (data['payment_failed_gateway']) {
          setJsonPayload(JSON.stringify(data['payment_failed_gateway'], null, 2));
        }
      })
      .catch((err) => {
        console.error(err);
        setSamplesFailed(true);
      });
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
    let parsed: WebhookPayload;
    try {
      parsed = JSON.parse(jsonPayload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'The JSON is not valid';
      setError({ kind: 'json', message });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendWebhookEvent(parsed);
      setResult(res);
    } catch {
      setError({
        kind: 'network',
        message: 'The webhook service did not respond. Check that the backend is running on port 8000, then send again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = () => {
    if (!navigator.clipboard) {
      setError({ kind: 'network', message: 'Copy is not available in this browser — select the text manually.' });
      return;
    }
    navigator.clipboard.writeText(jsonPayload).catch(() => {
      setError({ kind: 'network', message: 'Copy failed — select the text manually.' });
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input */}
      <section className="bg-white border border-line rounded-xl shadow-card flex flex-col" aria-label="Send a webhook">
        <PanelHeader
          title="Send a webhook"
          subtitle="Pick a sample Razorpay event — or paste your own — and send it through the full pipeline: diagnosis, safety checks, action."
          right={
            <button
              onClick={copyPayload}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2 hover:text-accent transition-colors px-2 py-1 rounded-md"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          }
        />

        <div className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
          {samplesFailed ? (
            <div className="border border-bad-line bg-bad-soft rounded-lg px-4 py-3 text-[13px] text-bad">
              Sample events couldn't load. Start the backend on port 8000 and reload.
            </div>
          ) : (
          <div className="flex flex-wrap gap-2">
            {Object.keys(samples).map((key) => {
              const on = selectedSampleKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSample(key)}
                  aria-pressed={on}
                  className={`px-3 py-1.5 text-[12.5px] rounded-full border transition-colors ${
                    on
                      ? 'border-accent text-accent-strong bg-accent-soft'
                      : 'border-line-strong text-ink-2 bg-white hover:bg-wash'
                  }`}
                >
                  {sampleLabel(key)}
                </button>
              );
            })}
          </div>
          )}

          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            spellCheck={false}
            aria-label="Webhook JSON payload"
            className="field flex-1 min-h-[300px] p-4 caret-accent resize-none rounded-lg"
          />

          <button
            onClick={handleDispatch}
            disabled={loading}
            className={`w-full py-3 text-[14px] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-wash text-ink-3 cursor-wait'
                : 'bg-accent text-white hover:bg-accent-strong active:translate-y-px'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-ink-4 border-t-transparent animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send webhook
              </>
            )}
          </button>
          <p className="text-[12px] text-ink-3 text-center">
            The first response can take a few seconds while the AI diagnostician reasons.
          </p>
        </div>
      </section>

      {/* Result */}
      <section className="bg-white border border-line rounded-xl shadow-card flex flex-col" aria-label="Engine decision">
        <PanelHeader
          title="What the engine decided"
          subtitle="The classification, safety verdict, and action taken on receipt."
        />
        <div className="px-5 pb-5 flex-1">
          {error ? (
            <div className="h-full border border-bad-line bg-bad-soft rounded-lg px-4 py-6 text-center">
              <div className="text-[13.5px] font-semibold text-bad">
                {error.kind === 'json' ? 'The JSON is not valid' : "Couldn't process that event"}
              </div>
              <p className="text-[13px] text-ink-3 mt-2">{error.message}</p>
              {error.kind === 'json' && (
                <p className="text-[12.5px] text-ink-3 mt-1">Fix the JSON on the left and send again.</p>
              )}
            </div>
          ) : loading ? (
            <div className="h-full min-h-[300px] border border-line bg-page rounded-lg flex flex-col items-center justify-center text-center px-6">
              <span className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <div className="text-[13.5px] font-medium text-ink mt-3">Processing the event…</div>
              <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">
                Diagnosing the failure, checking safety rules, choosing an action.
              </p>
            </div>
          ) : result ? (
            <div className="arrive space-y-4">
              <div className="grid grid-cols-2 gap-px bg-line rounded-lg overflow-hidden border border-line">
                <div className="px-4 py-3.5 bg-white">
                  <div className="text-[12px] text-ink-3">Outcome</div>
                  <div className={`text-[16px] font-semibold mt-1 ${statusTone(result.final_status).text}`}>
                    {statusTone(result.final_status).label}
                  </div>
                </div>
                <div className="px-4 py-3.5 bg-white text-right">
                  <div className="text-[12px] text-ink-3">Recovered</div>
                  <div className="text-[16px] font-semibold mt-1 text-ok numeric">
                    {formatINR(result.amount_recovered)}
                  </div>
                </div>
              </div>

              <DecisionRecord record={result} />

              <div className="border border-line rounded-lg px-4 py-3 bg-page text-[12.5px] space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-ink-3">Transaction</span>
                  <span className="text-ink font-medium numeric">{result.transaction_id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-3">Action taken</span>
                  <span className="text-ink">{humanizeIntervention(result.intervention)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-ink-3">Settlement ref</span>
                  <span className="text-ink numeric">{result.settlement_ref || 'None — deferred or stopped'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border border-dashed border-line-strong rounded-lg flex flex-col items-center justify-center text-center px-6">
              <Inbox className="w-7 h-7 text-ink-4" />
              <div className="text-[13.5px] font-medium text-ink-3 mt-3">Nothing processed yet</div>
              <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">
                Pick a sample event on the left and send it to see the engine's decision.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
