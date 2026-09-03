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
   DIRECTION CONTRACT · canon, played straight (user-pinned)
   THESIS: A recovery-risk console a first-time judge reads
   without a decoder ring — what failed, what the AI did,
   what it recovered, what it safely refused to touch.
   Refuses the incumbent: launch-range jargon on every panel.
   OWN-WORLD: white cards on a #F7F8FA ground, 8px base radius
   stepped for cards (12px) and chat bubbles (16px), IBM Plex
   Sans voice, one blue accent (#0B72E9) for action, semantic
   tints only for status. Data stays IBM Plex Mono.
   STORY: A judge lands, understands in one viewport that
   this is an AI auto-responder for failed payments with
   safety rules, reads honest metrics, and trusts the ledger.
   FIRST VIEWPORT: compact header (product name, tagline,
   tab nav) over four key numbers, then the simulator with
   a single primary "Run simulation" button.
   FORM: minimal operations dashboard, user-pinned in plain
   words; the standing exit taken, canon at full fidelity.
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
    <div className="min-h-screen bg-page text-ink flex flex-col selection:bg-accent selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <MetricsOverview summary={summary} loading={loading} />

        {activeTab === 'batch' && (
          <BatchSimulator summary={summary} onSimulationComplete={handleSimulationComplete} />
        )}
        {activeTab === 'hinglish' && <HinglishVoiceAgent />}
        {activeTab === 'mandate' && <MandateSequencerView />}
        {activeTab === 'audit' && <AuditTrailTable />}
        {activeTab === 'webhook' && <WebhookTester />}
      </main>

      <footer className="border-t border-line bg-white mt-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-ink-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink-2">RazorRevive</span>
            <span>·</span>
            <span>Razorpay Buildathon 2026 submission</span>
          </div>
          <div className="text-center sm:text-right">
            AI Risk Manager · failed-payment recovery · RBI-compliant by design · demo data
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
