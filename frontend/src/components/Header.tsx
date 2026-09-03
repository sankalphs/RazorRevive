import { Play, MessageCircle, Wifi, Table2, Webhook } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/* ============================================================
   APP HEADER — product name, one-line purpose, tab nav.
   A first-time visitor should know what this is in 5 seconds.
   ============================================================ */

export const LogoMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#0B72E9" />
    <path
      d="M17.5 7 10.5 17h4.4l-1.6 8 7.2-10h-4.6L17.5 7Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const tabs = [
    { id: 'batch', label: 'Simulation', icon: Play },
    { id: 'hinglish', label: 'AI Agent', icon: MessageCircle },
    { id: 'mandate', label: 'Bank Health', icon: Wifi },
    { id: 'audit', label: 'Audit Ledger', icon: Table2 },
    { id: 'webhook', label: 'Webhooks', icon: Webhook },
  ];

  return (
    <header className="bg-white border-b border-line sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Identity */}
        <div className="flex items-center justify-between gap-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark size={28} />
            <div className="min-w-0">
              <h1 className="text-[17px] font-bold tracking-tight text-ink leading-none">
                Razor<span className="text-accent">Revive</span>
              </h1>
            </div>
          </div>
          <p className="text-[12px] sm:text-[13px] text-ink-3 text-right leading-tight max-w-[46%] sm:max-w-none">
            AI auto-responder that recovers failed payments — safely, within RBI rules
          </p>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px" aria-label="Sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-accent text-accent-strong bg-accent-soft/60'
                    : 'border-transparent text-ink-3 hover:text-ink hover:bg-wash'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
