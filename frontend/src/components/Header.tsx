import { useEffect, useState } from 'react';
import { Layers, PhoneCall, Activity, Shield, Terminal } from 'lucide-react';
import { istClock, missionElapsed, rbiWindowLabel } from './telemetry';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/* ============================================================
   LAUNCH-CONTROL COMMAND BAR
   Brand: TCO orbiter mark + callsign. Telemetry: IST mission
   clock, live event counter, pipeline stage lamps, RBI window
   state. Navigation: station tabs, one per console.
   ============================================================ */

export const TcoMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <ellipse
      cx="32"
      cy="34"
      rx="24"
      ry="15"
      fill="none"
      stroke="#2EFF7B"
      strokeWidth="3"
      strokeDasharray="151 70"
      strokeLinecap="round"
      style={{
        animation: 'tco-orbit 6s linear infinite',
        transformOrigin: '32px 34px',
      }}
    />
    <line x1="8" y1="48" x2="50" y2="14" stroke="#2EFF7B" strokeWidth="4" strokeLinecap="round" />
    <circle cx="46" cy="17" r="4" fill="#FFB300" />
    <circle cx="50" cy="14" r="2" fill="#05080F" />
  </svg>
);

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const stations = [
    { id: 'batch', code: 'STA-01', label: 'Launch Countdown', short: 'Launch', icon: Layers },
    { id: 'hinglish', code: 'STA-02', label: 'Comms · Hinglish P2P', short: 'Comms', icon: PhoneCall },
    { id: 'mandate', code: 'STA-03', label: 'Bank Health Radar', short: 'Radar', icon: Activity },
    { id: 'audit', code: 'STA-04', label: 'Mission Log', short: 'Log', icon: Shield },
    { id: 'webhook', code: 'STA-05', label: 'Signal Ingest', short: 'Ingest', icon: Terminal },
  ];

  return (
    <header className="border-b border-[#1C3245] bg-[#0A101C]/95 backdrop-blur sticky top-0 z-50">
      {/* Command bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-[58px]">
          {/* Callsign */}
          <div className="flex items-center gap-3 min-w-0">
            <TcoMark size={34} />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[17px] font-bold tracking-tight text-[#CFE4F2] leading-none">
                  RAZOR<span className="text-[#2EFF7B]">REVIVE</span>
                </span>
                <span className="hidden sm:inline-block numeric text-[9px] tracking-[0.2em] text-[#7C93A6] border border-[#1C3245] px-1.5 py-0.5">
                  AI REVENUE RECOVERY
                </span>
              </div>
              <div className="numeric text-[10px] text-[#6A8296] tracking-wider mt-1">
                SRIHARIKOTA RANGE · RAZORPAY BUILDATHON 2026
              </div>
            </div>
          </div>

          {/* Flight telemetry */}
          <div className="hidden lg:flex items-center divide-x divide-[#1C3245] text-[11px] numeric">
            <div className="px-4">
              <div className="text-[9px] tracking-[0.2em] text-[#6A8296]">IST</div>
              <div className="text-[#CFE4F2] mt-0.5">
                {istClock(now)}
              </div>
            </div>
            <div className="px-4">
              <div className="text-[9px] tracking-[0.2em] text-[#6A8296]">MISSION ELAPSED</div>
              <div className="text-[#2EFF7B] mt-0.5 text-phosphor">
                {missionElapsed(now)}
              </div>
            </div>
            <div className="px-4">
              <div className="text-[9px] tracking-[0.2em] text-[#6A8296]">CONTACT POLICY</div>
              <div className="mt-0.5" style={{ color: rbiWindowLabel(now).startsWith('RBI WINDOW OPEN') ? '#2EFF7B' : '#FFB300' }}>
                {rbiWindowLabel(now)}
              </div>
            </div>
            <div className="px-4">
              <div className="text-[9px] tracking-[0.2em] text-[#6A8296]">DIAGNOSTICIAN</div>
              <div className="mt-0.5 text-[#CFE4F2]">
                MINIMAX-M3 <span className="text-[#2EFF7B]">NOMINAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station tabs */}
      <div className="border-t border-[#1C3245] sweep-bar bg-[#0A101C]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {stations.map((station) => {
              const Icon = station.icon;
              const isActive = activeTab === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => setActiveTab(station.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.04]'
                      : 'border-transparent text-[#7C93A6] hover:text-[#CFE4F2]'
                  }`}
                >
                  <span className={`numeric text-[9px] tracking-[0.15em] ${isActive ? 'text-[#2EFF7B]' : 'text-[#6A8296] group-hover:text-[#7C93A6]'}`}>
                    {station.code}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-medium hidden sm:inline">{station.label}</span>
                  <span className="font-medium sm:hidden">{station.short}</span>
                  {isActive && <span className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rotate-45 bg-[#2EFF7B]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
