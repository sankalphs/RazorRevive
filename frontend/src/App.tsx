import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { BatchSimulator } from './components/BatchSimulator';
import { HinglishVoiceAgent } from './components/HinglishVoiceAgent';
import { MandateSequencerView } from './components/MandateSequencerView';
import { AuditTrailTable } from './components/AuditTrailTable';
import { WebhookTester } from './components/WebhookTester';
import { type BatchSummary, fetchLatestBatch } from './services/api';

/* ============================================================
   DIRECTION CONTRACT · seed c062e598 (code-led)
   THESIS: The autonomous recovery engine as launch
   operations at Sriharikota — every failed payment a
   countdown the range safely flies, not a red error badge.
   Refuses the category default: navy card-grid dashboard.
   OWN-WORLD: near-black void #05080F, etched green
   graticule panels, IBM Plex Mono telemetry readouts in
   three phosphor inks — signal green GO, amber P2P/hold,
   abort red range-stop. Panels are square-edged instrument
   plates with stamped station codes (STA-01…05).
   STORY: A judge lands on a live range — IST clock
   ticking, guardrails armed, bank radar sweeping — grasps
   the mechanism in one viewport, and trusts the compliance
   story because every decision is logged, inked, and
   exportable.
   FIRST VIEWPORT: command bar (TCO orbiter mark, RAZOR-
   REVIVE callsign, T+ mission clock, RBI window state)
   over a five-station tab rail; below, the Vehicle Status
   Board — four phosphor readouts on one graticule wall —
   then STA-01's launch sequencer with the GO button as
   primary action.
   FORM: Mission Control, Sriharikota — position 1 of 7
   grounded candidates, model pick, seed c062e598.
   FINISH: unreviewed and undocumented is unfinished; this
   build ends with the finish review, the verdict, DESIGN.md,
   and every shipping raster carrying its provenance.
   ============================================================ */

export function App() {
  const [activeTab, setActiveTab] = useState<string>('batch');
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLatestBatch()
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load initial batch summary:', err);
        setLoading(false);
      });
  }, []);

  const handleSimulationComplete = (newSummary: BatchSummary) => {
    setSummary(newSummary);
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-[#CFE4F2] flex flex-col selection:bg-[#2EFF7B] selection:text-[#05080F]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <MetricsOverview summary={summary} loading={loading} />

        {activeTab === 'batch' && (
          <BatchSimulator summary={summary} onSimulationComplete={handleSimulationComplete} />
        )}
        {activeTab === 'hinglish' && <HinglishVoiceAgent />}
        {activeTab === 'mandate' && <MandateSequencerView />}
        {activeTab === 'audit' && <AuditTrailTable />}
        {activeTab === 'webhook' && <WebhookTester />}
      </main>

      {/* Range sign-off */}
      <footer className="border-t border-[#1C3245] bg-[#0A101C] mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 numeric text-[10px] tracking-wider text-[#6A8296]">
          <div className="flex items-center gap-2.5">
            <span className="text-[#7C93A6]">RAZORREVIVE</span>
            <span>·</span>
            <span>RAZORPAY BUILDATHON 2026 SUBMISSION</span>
          </div>
          <div className="text-center sm:text-right">
            AUTONOMOUS AI REVENUE RECOVERY · BOUNDED INTERVENTIONS · RBI COMPLIANT · DEMO DATA
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
