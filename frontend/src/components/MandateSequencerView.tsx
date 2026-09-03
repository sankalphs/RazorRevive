import React, { useEffect, useState } from 'react';
import { Zap, Ban, CheckCircle2 } from 'lucide-react';
import { fetchBankHealth } from '../services/api';
import { StationHeader, StatusLamp, INK } from './telemetry';

/* ============================================================
   STA-03 · BANK HEALTH RADAR
   The blind-vs-smart sequencing story told on instrument
   cards: issuer telemetry wall on top, two flight profiles
   below — one aborting, one clearing.
   ============================================================ */

export const MandateSequencerView: React.FC = () => {
  const [banks, setBanks] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchBankHealth()
      .then((data) => setBanks(data))
      .catch((err) => console.error('Radar error:', err));
  }, []);

  return (
    <div className="space-y-5">
      {/* Issuer telemetry wall */}
      <section className="panel-graticule" aria-label="Issuer bank health radar">
        <StationHeader
          code="STA-03 · ISSUER GATEWAY TELEMETRY"
          title="Bank Health Radar"
          subtitle="Live gateway uptime for UPI Autopay and eNACH issuer banks. The smart sequencer holds retries while a degraded issuer recovers instead of burning mandate attempts."
          right={
            <div className="numeric text-[10px] tracking-wider text-right">
              <div className="text-[#6A8296]">RADAR</div>
              <div className="text-[#2EFF7B] mt-1 flex items-center justify-end gap-2">
                <StatusLamp on ink={INK.signal} />
                SWEEPING
              </div>
            </div>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-4 sm:px-5 py-5">
          {Object.entries(banks).map(([code, info]) => {
            const degraded = info.status === 'DEGRADED';
            const uptime = Number(info.uptime_pct) || 0;
            return (
              <div
                key={code}
                className={`border px-4 py-4 ${
                  degraded
                    ? 'border-[#FF4D4D]/50 bg-[#FF4D4D]/[0.05] glow-abort'
                    : 'border-[#1C3245] bg-[#0D1524]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="numeric text-xs tracking-wider text-[#CFE4F2]">{info.name}</span>
                  <span
                    className={`numeric text-[10px] px-2 py-0.5 border tracking-wider ${
                      degraded
                        ? 'border-[#FF4D4D]/50 text-[#FF4D4D]'
                        : 'border-[#2EFF7B]/50 text-[#2EFF7B]'
                    }`}
                  >
                    {degraded ? 'DEGRADED' : 'NOMINAL'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className={`numeric text-[28px] leading-none tracking-tight ${degraded ? 'text-phosphor-abort' : 'text-phosphor'}`}>
                    {info.uptime_pct}%
                  </span>
                  <span className="numeric text-[10px] text-[#6A8296] tracking-wider">GATEWAY UPTIME</span>
                </div>

                {/* Uptime trace */}
                <div className="mt-3 h-2 bg-[#05080F] border border-[#1C3245] relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${degraded ? 'bg-[#FF4D4D]' : 'bg-[#2EFF7B]'}`}
                    style={{ width: `${uptime}%`, boxShadow: degraded ? '0 0 10px rgba(255,77,77,0.5)' : '0 0 10px rgba(46,255,123,0.5)' }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1C3245] flex items-center justify-between numeric text-[10px] text-[#6A8296]">
                  <span className="tracking-wider">PEAK CONGESTION</span>
                  <span className="text-[#7C93A6]">{info.peak_hours}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Flight profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Naive profile — aborts */}
        <section className="panel-graticule" aria-label="Blind naive retry profile">
          <StationHeader
            code="PROFILE A · BASELINE"
            title="Blind Naive Retry"
            subtitle="The industry loop: retries on a fixed clock, blind to issuer health. High churn, penalty fees, mandates cancelled."
          />
          <div className="px-4 sm:px-5 py-5 space-y-3">
            {[
              {
                stamp: '08:00 IST',
                title: 'MANDATE DEBIT FAILS',
                body: 'Debit hits the SBI gateway while the issuer node is degraded (78.2% uptime). Failure logged.',
                last: false,
              },
              {
                stamp: '09:30 IST',
                title: 'BLIND RETRY #2 TIMES OUT',
                body: 'Fixed-clock script retries straight into peak degradation. Attempt two of three burned.',
                last: false,
              },
              {
                stamp: '11:00 IST',
                title: 'QUOTA EXHAUSTED · MANDATE CANCELLED',
                body: 'Three attempts spent against a degraded node. Customer eats bounce fees; subscription churns forever.',
                last: true,
              },
            ].map((step) => (
              <div key={step.stamp} className="flex gap-3.5 border border-[#FF4D4D]/30 bg-[#FF4D4D]/[0.04] px-3.5 py-3">
                <div className="shrink-0 flex flex-col items-center">
                  <span className={`numeric text-[10px] tracking-wider px-1.5 py-0.5 border ${step.last ? 'border-[#FF4D4D] text-[#FF4D4D]' : 'border-[#FF4D4D]/50 text-[#FF4D4D]'}`}>
                    {step.stamp}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className={`numeric text-[11px] tracking-wider ${step.last ? 'text-[#FF4D4D]' : 'text-[#CFE4F2]'}`}>
                    {step.title}
                  </div>
                  <p className="text-[11px] text-[#7C93A6] leading-relaxed mt-1">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="numeric text-[10px] tracking-wider text-[#FF4D4D] border border-[#FF4D4D]/50 bg-[#FF4D4D]/[0.06] px-3.5 py-2.5 flex items-center gap-2">
              <Ban className="w-3.5 h-3.5" />
              OUTCOME · MANDATE LOST · BOUNCE FEES INCURRED
            </div>
          </div>
        </section>

        {/* Smart profile — clears */}
        <section className="panel-graticule glow-signal" aria-label="Downtime-aware smart sequencer profile">
          <StationHeader
            code="PROFILE B · RRV STACK"
            title="Downtime-Aware Smart Sequencer"
            subtitle="Diagnose, hold through degradation, fire on recovery. Same mandate, opposite outcome."
            right={
              <span className="numeric text-[10px] tracking-wider text-[#2EFF7B] border border-[#2EFF7B]/50 px-2 py-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                ILLUSTRATIVE PROFILE
              </span>
            }
          />
          <div className="px-4 sm:px-5 py-5 space-y-3">
            {[
              {
                stamp: '08:00 IST',
                title: 'DETECT · DIAGNOSE TRANSIENT FAILURE',
                body: 'SBI gateway degraded — holding retry to protect the mandate attempt quota and prevent a bounce charge.',
                last: false,
              },
              {
                stamp: '13:30 IST',
                title: 'RADAR CONFIRMS RECOVERY',
                body: 'Gateway uptime restored to 98.4%. Sequencer clears the attempt for immediate execution.',
                last: false,
              },
              {
                stamp: '13:31 IST',
                title: 'MANDATE AUTO-CLEARED · ₹0 BOUNCE FEES',
                body: 'Debit lands on the first attempt post-recovery. Full audit trail logged with settlement ID.',
                last: true,
              },
            ].map((step) => (
              <div key={step.stamp} className="flex gap-3.5 border border-[#2EFF7B]/30 bg-[#2EFF7B]/[0.04] px-3.5 py-3">
                <div className="shrink-0">
                  <span className="numeric text-[10px] tracking-wider px-1.5 py-0.5 border border-[#2EFF7B]/60 text-[#2EFF7B]">
                    {step.stamp}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className={`numeric text-[11px] tracking-wider ${step.last ? 'text-[#2EFF7B]' : 'text-[#CFE4F2]'}`}>
                    {step.title}
                  </div>
                  <p className="text-[11px] text-[#7C93A6] leading-relaxed mt-1">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="numeric text-[10px] tracking-wider text-[#2EFF7B] border border-[#2EFF7B]/50 bg-[#2EFF7B]/[0.06] px-3.5 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              OUTCOME · MANDATE RECOVERED · ZERO PENALTY · AUDITED
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
