import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Zap } from 'lucide-react';
import { fetchBankHealth } from '../services/api';

export const MandateSequencerView: React.FC = () => {
  const [banks, setBanks] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchBankHealth()
      .then((data) => {
        setBanks(data);
      })
      .catch((err) => {
        console.error('Error fetching bank health:', err);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-[#3395FF]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Smart Mandate Retry Sequencer</h2>
            <p className="text-xs text-slate-400">
              UPI Autopay, eNACH, and Recurring Card dunning with real-time issuer bank health awareness and salary cycle heuristics.
            </p>
          </div>
        </div>

        {/* Bank Health Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Object.entries(banks).map(([code, info]) => {
            const isDegraded = info.status === 'DEGRADED';
            return (
              <div
                key={code}
                className={`p-4 rounded-xl border text-xs transition-all ${
                  isDegraded
                    ? 'bg-rose-500/5 border-rose-500/30 shadow-md shadow-rose-500/5'
                    : 'bg-[#162238]/60 border-[#1E2E52]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white text-sm">{info.name}</div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isDegraded
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {info.status}
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span
                    className={`text-2xl font-black ${
                      isDegraded ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {info.uptime_pct}%
                  </span>
                  <span className="text-[11px] text-slate-400">Gateway Uptime</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1E2E52] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Peak Congestion:</span>
                  <span className="text-slate-300 font-medium">{info.peak_hours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Naive vs Intelligent Sequencing Workflow Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* The Problem: Naive Retry Loop */}
        <div className="bg-[#101828] border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Industry Standard: Blind Naive Retry (High Failure)</span>
            </h3>
            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
              High Churn &amp; Penalty
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#162238] rounded-xl border border-rose-500/20 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-semibold text-white">08:00 AM — Initial Debit Fails</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Mandate debit hits SBI gateway while bank node is degraded (78.2% uptime).
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#162238] rounded-xl border border-rose-500/20 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-semibold text-white">09:30 AM — Blind Retry Attempt #2</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Blind script retries during peak bank degradation. Transaction times out again.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#162238] rounded-xl border border-rose-500/20 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-semibold text-rose-400">11:00 AM — Retries Exhausted &amp; Mandate Cancelled</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Merchant exhausts 3 quota retries, customer incurs bank bounce fees, subscription churns forever.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Solution: RazorRevive Smart Sequencer */}
        <div className="bg-[#101828] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden glow-emerald">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>RazorRevive: Downtime-Aware Smart Sequencer</span>
            </h3>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
              84.2% Success Rate
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#162238] rounded-xl border border-emerald-500/30 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-semibold text-white">08:00 AM — Detection &amp; Diagnostics</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  AI diagnoses transient failure: SBI gateway is degraded. Holding retry to prevent bounce charge.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#162238] rounded-xl border border-emerald-500/30 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-semibold text-white">01:30 PM — Health Check Passes</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Gateway radar confirms SBI uptime has restored to 98.4%. Scheduled clearance triggered.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#162238] rounded-xl border border-emerald-500/30 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-semibold text-emerald-400">01:31 PM — Mandate Auto-Cleared (₹0 Bounce Fees)</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Subscription debited successfully on first retry. Full audit trail logged with settlement ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
