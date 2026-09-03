import React, { useState, useEffect } from 'react';
import { Terminal, Send, CheckCircle2, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import { fetchSampleWebhooks, sendWebhookEvent } from '../services/api';

export const WebhookTester: React.FC = () => {
  const [samples, setSamples] = useState<Record<string, any>>({});
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('payment_failed_gateway');
  const [jsonPayload, setJsonPayload] = useState<string>('{\n  "event": "payment.failed"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
    }
  };

  const handleDispatch = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(jsonPayload);
      const res = await sendWebhookEvent(parsed);
      setResult(res);
    } catch (err: any) {
      alert(`Invalid JSON or dispatch error: ${err.message}`);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payload Editor Left */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-[#3395FF]" />
            <h3 className="text-sm font-bold text-white">Razorpay Webhook Dispatcher</h3>
          </div>
          <button
            onClick={copyPayload}
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Simulate incoming Razorpay webhook events to test real-time AI root-cause classification and guardrail interventions.
        </p>

        {/* Preset Sample Buttons */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(samples).map((key) => {
            const isSelected = selectedSampleKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectSample(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                    : 'bg-[#162238] border-[#1E2E52] text-slate-400 hover:text-slate-200'
                }`}
              >
                {key.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>

        {/* JSON Code Area */}
        <div className="flex-1 min-h-[320px]">
          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            className="w-full h-full font-mono text-xs bg-[#080D1A] border border-[#1E2E52] rounded-xl p-4 text-emerald-400 focus:outline-none focus:border-[#3395FF] resize-none"
            spellCheck={false}
          />
        </div>

        <button
          onClick={handleDispatch}
          disabled={loading}
          className="w-full py-3 bg-[#3395FF] hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <span>Processing Webhook...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Simulate Inbound Webhook</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Response Right */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Autonomous Agent Decision</h3>
        </div>
        <p className="text-xs text-slate-400">
          Immediate diagnosis, policy compliance verification, and execution output dispatched by RazorRevive.
        </p>

        {result ? (
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Status Card */}
            <div className="p-4 rounded-xl bg-[#162238] border border-[#1E2E52] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Final State</span>
                <div className="text-base font-bold text-white flex items-center space-x-1.5 mt-0.5">
                  <span>{result.final_status}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Amount Recovered</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{result.amount_recovered.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* AI Diagnosis Details */}
            <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1E2E52] space-y-2 text-xs">
              <div className="font-bold text-purple-300 text-xs uppercase tracking-wider">
                Root-Cause Diagnostic Analysis
              </div>
              <div className="text-slate-300">
                <strong>Failure Category:</strong> {result.diagnosis.category}
              </div>
              <div className="text-slate-300">
                <strong>Detected Cause:</strong> {result.diagnosis.root_cause}
              </div>
              <div className="text-slate-400 italic bg-[#162238]/60 p-2.5 rounded-lg border border-[#1E2E52]/40">
                "{result.diagnosis.ai_reasoning}"
              </div>
            </div>

            {/* Compliance Certification */}
            <div className="p-4 rounded-xl bg-[#080D1A] border border-[#1E2E52] space-y-2 text-xs">
              <div className="font-bold text-blue-300 text-xs uppercase tracking-wider">
                Guardrail &amp; Compliance Validation
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                {result.compliance.is_compliant ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                )}
                <span>{result.compliance.reason}</span>
              </div>
            </div>

            {/* Raw Audit Log */}
            <div className="p-3 rounded-xl bg-[#080D1A] border border-[#1E2E52] font-mono text-[11px] text-slate-400 space-y-1">
              <div>Transaction ID: {result.transaction_id}</div>
              <div>Intervention: {result.intervention}</div>
              <div>Settlement Ref: {result.settlement_ref || 'None (Deferred / Hard Stop)'}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-[#1E2E52] rounded-xl p-8">
            <Terminal className="w-8 h-8 mb-2 text-slate-600" />
            <span className="text-xs font-medium">No webhook dispatched yet.</span>
            <span className="text-[11px] text-slate-500 mt-1">
              Select a sample payload on the left and click "Simulate Inbound Webhook".
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
