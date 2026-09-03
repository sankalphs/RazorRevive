import React, { useEffect, useState } from 'react';
import { Zap, Ban, CheckCircle2 } from 'lucide-react';
import { fetchBankHealth, type BankHealthInfo } from '../services/api';
import { PanelHeader } from './telemetry';

/* ============================================================
   BANK HEALTH — which issuer gateways are up, which are
   struggling, and why smart timing beats fixed-clock retries.
   ============================================================ */

export const MandateSequencerView: React.FC = () => {
  const [banks, setBanks] = useState<Record<string, BankHealthInfo> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchBankHealth()
      .then((data) => setBanks(data))
      .catch((err) => {
        console.error('Bank health error:', err);
        setFailed(true);
      });
  }, []);

  const bankList = banks ? Object.entries(banks) : [];

  return (
    <div className="space-y-6">
      {/* Bank cards */}
      <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Bank gateway health">
        <PanelHeader
          title="Bank gateway health"
          subtitle="Live uptime for UPI Autopay and eNACH issuer banks. The engine waits out a struggling bank instead of burning retry attempts against it."
        />
        {failed ? (
          <div className="px-5 pb-5">
            <div className="border border-bad-line bg-bad-soft rounded-lg px-4 py-6 text-center">
              <div className="text-[13.5px] font-semibold text-bad">Bank health data unavailable</div>
              <p className="text-[13px] text-ink-3 mt-1.5">
                The bank-health service isn't responding. Start the backend on port 8000 and reload.
              </p>
            </div>
          </div>
        ) : bankList.length === 0 ? (
          <div className="px-5 pb-5">
            <div className="border border-dashed border-line-strong rounded-lg px-4 py-6 text-center text-[13px] text-ink-3">
              Loading bank health…
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-5 pb-5">
          {bankList.map(([code, info]) => {
            const degraded = info.status === 'DEGRADED';
            const uptime = Number(info.uptime_pct) || 0;
            return (
              <div
                key={code}
                className={`border rounded-xl px-4 py-4 ${
                  degraded ? 'border-bad-line bg-bad-soft' : 'border-line bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-ink">{info.name}</span>
                  <span
                    className={`text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${
                      degraded
                        ? 'border-bad-line bg-white text-bad'
                        : 'border-ok-line bg-ok-soft text-ok'
                    }`}
                  >
                    {degraded ? 'Struggling' : 'Healthy'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className={`text-[26px] font-semibold tracking-tight leading-none numeric ${
                      degraded ? 'text-bad' : 'text-ok'
                    }`}
                  >
                    {info.uptime_pct}%
                  </span>
                  <span className="text-[12px] text-ink-3">uptime</span>
                </div>

                <div className="mt-3 h-2 bg-wash rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${degraded ? 'bg-bad' : 'bg-ok'}`}
                    style={{ width: `${uptime}%` }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[12px] text-ink-3">
                  <span>Peak congestion</span>
                  <span className="text-ink-2 numeric">{info.peak_hours}</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Two timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Naive */}
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Fixed-schedule retry example">
          <PanelHeader
            title="Fixed-schedule retries"
            subtitle="The usual approach: retry on a fixed clock, blind to bank health. This is what it costs."
          />
          <div className="px-5 pb-5 space-y-3">
            {[
              {
                stamp: '08:00',
                title: 'Mandate debit fails',
                body: 'The debit hits SBI while its gateway is struggling (78.2% uptime). Failure logged.',
              },
              {
                stamp: '09:30',
                title: 'Retry #2 times out',
                body: 'The fixed-clock script retries straight into peak degradation. Attempt two of three used up.',
              },
              {
                stamp: '11:00',
                title: 'Retries exhausted · mandate cancelled',
                body: 'Three attempts spent against a struggling bank. The customer eats bounce fees; the subscription is lost.',
              },
            ].map((step) => (
              <div key={step.stamp} className="flex gap-3.5 border border-bad-line bg-bad-soft/60 rounded-lg px-3.5 py-3">
                <span className="shrink-0 text-[12px] font-medium px-2 py-1 rounded-md bg-white border border-bad-line text-bad numeric">
                  {step.stamp}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">{step.title}</div>
                  <p className="text-[12.5px] text-ink-3 leading-relaxed mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="text-[12.5px] font-medium text-bad border border-bad-line bg-bad-soft rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0" />
              Result: mandate lost, bounce fees charged
            </div>
          </div>
        </section>

        {/* Smart */}
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Health-aware retry example">
          <PanelHeader
            title="Health-aware retries"
            subtitle="Diagnose, wait out the degradation, retry when the bank recovers. Same mandate, opposite outcome."
            right={
              <span className="text-[11.5px] font-medium text-accent-strong border border-accent/30 bg-accent-soft px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Example scenario
              </span>
            }
          />
          <div className="px-5 pb-5 space-y-3">
            {[
              {
                stamp: '08:00',
                title: 'Detects · temporary bank failure',
                body: 'SBI gateway is struggling — the engine holds the retry to protect the attempt quota and avoid a bounce charge.',
              },
              {
                stamp: '13:30',
                title: 'Bank recovers',
                body: 'Gateway uptime is back to 98.4%. The retry is cleared to run immediately.',
              },
              {
                stamp: '13:31',
                title: 'Debit succeeds · ₹0 bounce fees',
                body: 'The payment lands on the first attempt after recovery, fully logged with a settlement reference.',
              },
            ].map((step) => (
              <div key={step.stamp} className="flex gap-3.5 border border-ok-line bg-ok-soft/50 rounded-lg px-3.5 py-3">
                <span className="shrink-0 text-[12px] font-medium px-2 py-1 rounded-md bg-white border border-ok-line text-ok numeric">
                  {step.stamp}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">{step.title}</div>
                  <p className="text-[12.5px] text-ink-3 leading-relaxed mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="text-[12.5px] font-medium text-ok border border-ok-line bg-ok-soft rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Result: mandate recovered, zero penalties, fully audited
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
