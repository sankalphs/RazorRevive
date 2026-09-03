import { Shield, Sparkles, Activity, Layers, PhoneCall, CheckCircle, Database, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const tabs = [
    { id: 'batch', label: 'Batch Simulator & ROI', icon: Layers },
    { id: 'hinglish', label: 'Hinglish Voice & P2P Agent', icon: PhoneCall },
    { id: 'mandate', label: 'Mandate Sequencer & Bank Health', icon: Activity },
    { id: 'audit', label: 'Compliance Audit Ledger', icon: Shield },
    { id: 'webhook', label: 'Razorpay Webhook Sandbox', icon: Terminal },
  ];

  return (
    <header className="border-b border-[#1E2E52] bg-[#0A1020]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3395FF] to-[#10B981] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">RazorRevive</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#3395FF]/10 text-[#3395FF] border border-[#3395FF]/30 rounded-full">
                  AI Revenue Recovery
                </span>
              </div>
              <p className="text-xs text-slate-400">Razorpay Buildathon 2026</p>
            </div>
          </div>

          {/* System Status Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>RBI Hours Compliant (08:00–19:00 IST)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Guardrails: 4 Active</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-md text-purple-300">
              <Database className="w-3.5 h-3.5" />
              <span>LLM: MiniMax-M3</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-[#1E2E52]/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#3395FF] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131E36]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
