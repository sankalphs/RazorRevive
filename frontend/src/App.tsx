import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { BatchSimulator } from './components/BatchSimulator';
import { HinglishVoiceAgent } from './components/HinglishVoiceAgent';
import { MandateSequencerView } from './components/MandateSequencerView';
import { AuditTrailTable } from './components/AuditTrailTable';
import { WebhookTester } from './components/WebhookTester';
import { type BatchSummary, fetchLatestBatch } from './services/api';

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
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex flex-col selection:bg-[#3395FF] selection:text-white">
      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Universal Top KPIs */}
        <MetricsOverview summary={summary} loading={loading} />

        {/* Tab Views */}
        <div className="mt-2">
          {activeTab === 'batch' && (
            <BatchSimulator summary={summary} onSimulationComplete={handleSimulationComplete} />
          )}

          {activeTab === 'hinglish' && <HinglishVoiceAgent />}

          {activeTab === 'mandate' && <MandateSequencerView />}

          {activeTab === 'audit' && <AuditTrailTable />}

          {activeTab === 'webhook' && <WebhookTester />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E2E52] bg-[#0A1020] py-4 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">RazorRevive</span>
            <span>•</span>
            <span>Razorpay Buildathon 2026 Submission</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            Autonomous AI Revenue Recovery Engine with Bounded Interventions &amp; RBI Compliance
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
