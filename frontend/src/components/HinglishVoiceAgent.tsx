import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Radio, Lock, Clock3 } from 'lucide-react';
import { type ChatMessage, type ChatInteractionResponse, sendChatMessage, fetchPresetScenarios } from '../services/api';
import { StationHeader, formatINR, StatusLamp, INK } from './telemetry';

/* ============================================================
   STA-02 · COMMS CONSOLE
   Priya's Hinglish loop as a ground-control exchange: every
   message a squared transmission block, downlink green,
   uplink amber. P2P extraction locks a commitment readout.
   ============================================================ */

export const HinglishVoiceAgent: React.FC = () => {
  const missionStamp = () =>
    new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenariosFailed, setScenariosFailed] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lossOfSignal, setLossOfSignal] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [p2pCommitment, setP2pCommitment] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPresetScenarios()
      .then((data) => {
        setScenarios(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedScenario(first);
          setP2pCommitment(null);
          setMessages([
            { role: 'assistant', content: first.initial_message, timestamp: missionStamp() },
          ]);
        }
      })
      .catch((err) => {
        console.error(err);
        setScenariosFailed(true);
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectScenario = (sc: any) => {
    setSelectedScenario(sc);
    setP2pCommitment(null);
    setMessages([{ role: 'assistant', content: sc.initial_message, timestamp: missionStamp() }]);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceUnsupported(true);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang.includes('hi') || v.lang.includes('en-IN') || v.name.includes('India')
    );
    if (indianVoice) utterance.voice = indianVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedScenario || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: missionStamp() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);
    setLossOfSignal(false);

    try {
      const response: ChatInteractionResponse = await sendChatMessage({
        customer_name: selectedScenario.customer_name,
        merchant_name: selectedScenario.merchant_name,
        amount: selectedScenario.amount,
        failure_reason: selectedScenario.failure_reason,
        messages: newMessages,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply, timestamp: missionStamp() },
      ]);
      if (response.p2p_details) setP2pCommitment(response.p2p_details);
      speakText(response.audio_text_hinglish);
    } catch (err) {
      console.error('Comms error:', err);
      setLossOfSignal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Uplink targets + commitment */}
      <div className="space-y-5">
        <section className="panel-graticule" aria-label="Recovery scenario selector">
          <StationHeader
            code="UPLINK TARGETS"
            title="Recovery Scenarios"
            subtitle="Select a customer contact to open the comms loop. Each scenario is a seeded demo case with a real failure reason."
          />
          <div className="px-4 py-4 space-y-2">
            {scenariosFailed ? (
              <div className="border border-dashed border-[#1C3245] px-4 py-8 text-center">
                <Radio className="w-6 h-6 mx-auto text-[#6A8296]" />
                <div className="numeric text-[11px] text-[#FF4D4D] mt-3 tracking-wider">UPLINK TARGETS UNAVAILABLE</div>
                <p className="text-[11px] text-[#7C93A6] mt-2 leading-relaxed">
                  The scenario service is not answering. Verify the backend and reload the station.
                </p>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="border border-dashed border-[#1C3245] px-4 py-8 text-center">
                <Radio className="w-6 h-6 mx-auto text-[#6A8296]" />
                <div className="numeric text-[11px] text-[#7C93A6] mt-3 tracking-wider">ACQUIRING TARGETS…</div>
              </div>
            ) : (
            scenarios.map((sc) => {
              const on = selectedScenario?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => selectScenario(sc)}
                  aria-pressed={on}
                  className={`w-full text-left px-3.5 py-3 border transition-colors ${
                    on
                      ? 'border-[#2EFF7B] bg-[#2EFF7B]/[0.06]'
                      : 'border-[#1C3245] bg-[#0D1524]/60 hover:border-[#6A8296]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`numeric text-[11px] tracking-wider ${on ? 'text-[#2EFF7B]' : 'text-[#CFE4F2]'}`}>
                      {sc.merchant_name}
                    </span>
                    <StatusLamp on={on} ink={INK.signal} />
                  </div>
                  <div className="text-[11px] text-[#7C93A6] mt-1">{sc.title}</div>
                  <div className="flex items-center justify-between mt-2 numeric text-[10px]">
                    <span className="text-[#2EFF7B]">{formatINR(sc.amount)}</span>
                    <span className="text-[#6A8296]">{sc.customer_name}</span>
                  </div>
                </button>
              );
            })
            )}
          </div>
        </section>

        {/* P2P commitment lock */}
        <section className="panel-graticule" aria-label="Promise to pay tracker">
          <StationHeader code="COMMITMENT LOCK" title="Promise-to-Pay Tracker" subtitle="A detected promise freezes dunning and schedules one non-intrusive reminder." />
          <div className="px-4 py-4">
            {p2pCommitment ? (
              <div className="border border-[#FFB300]/50 bg-[#FFB300]/[0.05] px-4 py-4 readout-arrival">
                <div className="flex items-center justify-between">
                  <span className="numeric text-[11px] text-[#CFE4F2] tracking-wider">
                    <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-[#FFB300]" />
                    {p2pCommitment.customer_name}
                  </span>
                  <span className="numeric text-sm text-phosphor-amber">{formatINR(p2pCommitment.amount)}</span>
                </div>
                <div className="mt-3 space-y-1.5 numeric text-[11px] text-[#7C93A6]">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-3.5 h-3.5 text-[#6A8296]" />
                    PROMISED · {p2pCommitment.promised_date} · {p2pCommitment.promised_time} IST
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#FFB300]/25 numeric text-[10px] text-[#FFB300] tracking-wider">
                  DUNNING PAUSED · REMINDER SCHEDULED
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#1C3245] px-4 py-8 text-center">
                <Radio className="w-6 h-6 mx-auto text-[#6A8296]" />
                <div className="numeric text-[11px] text-[#7C93A6] mt-3 tracking-wider">NO COMMITMENT LOCKED</div>
                <p className="text-[11px] text-[#6A8296] mt-2 leading-relaxed">
                  Send <span className="text-[#CFE4F2]">"Kal shaam 6 baje payment karunga"</span> in the loop to
                  watch intent extraction lock a promise.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Comms loop */}
      <section className="lg:col-span-2 panel-graticule flex flex-col h-[640px]" aria-label="Hinglish communications loop">
        <StationHeader
          code="COMMS LOOP · CH-02"
          title={`Priya · ${selectedScenario?.merchant_name ?? 'RazorRevive'}`}
          subtitle={`Hinglish voice + WhatsApp downlink to ${selectedScenario?.customer_name ?? 'customer'} · ${formatINR(selectedScenario?.amount)} pending · DND and hardship keywords monitored`}
          right={
            <button
              onClick={() => {
                const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
                if (lastAssistant) speakText(lastAssistant.content);
              }}
              className={`flex items-center gap-2 numeric px-3 py-2 text-[10px] tracking-wider border transition-colors ${
                isSpeaking
                  ? 'border-[#2EFF7B] text-[#2EFF7B] bg-[#2EFF7B]/[0.07] station-cursor'
                  : 'border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2] hover:border-[#6A8296]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {isSpeaking ? 'TRANSMITTING' : 'PLAY VOICE'}
            </button>
          }
        />

        {/* Transmissions */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#05080F]/40">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 border ${
                    isUser
                      ? 'border-[#FFB300]/40 bg-[#FFB300]/[0.06] text-[#F5E9C8]'
                      : 'border-[#2EFF7B]/35 bg-[#2EFF7B]/[0.04] text-[#CFE4F2]'
                  }`}
                >
                  <div className="numeric text-[9px] tracking-[0.18em] mb-1.5 flex items-center gap-1.5">
                    <StatusLamp on ink={isUser ? INK.amber : INK.signal} />
                    <span className={isUser ? 'text-[#FFB300]' : 'text-[#2EFF7B]'}>
                      {isUser ? 'UPLINK · CUSTOMER' : 'DOWNLINK · PRIYA'}
                    </span>
                    <span className="text-[#6A8296]">{msg.timestamp} IST</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            );
          })}
          {lossOfSignal && (
            <div className="flex justify-start">
              <div className="readout-arrival max-w-[82%] px-3.5 py-2.5 border border-[#FF4D4D]/50 bg-[#FF4D4D]/[0.05]">
                <div className="numeric text-[9px] tracking-[0.18em] mb-1.5 flex items-center gap-1.5 text-[#FF4D4D]">
                  <StatusLamp on ink={INK.abort} />
                  LOSS OF SIGNAL · COMMS LOOP
                </div>
                <p className="text-xs text-[#CFE4F2] leading-relaxed">
                  The agent downlink failed mid-transmission. Your uplink was received; the turn was not answered.
                </p>
                <p className="numeric text-[10px] text-[#7C93A6] mt-1.5">RETRY THE TRANSMISSION · CHECK BACKEND ON :8000</p>
              </div>
            </div>
          )}
          {voiceUnsupported && (
            <div className="flex justify-start">
              <div className="readout-arrival max-w-[82%] px-3.5 py-2.5 border border-[#FFB300]/40 bg-[#FFB300]/[0.05]">
                <div className="numeric text-[9px] tracking-[0.18em] mb-1.5 flex items-center gap-1.5 text-[#FFB300]">
                  <StatusLamp on ink={INK.amber} />
                  VOICE CHANNEL UNAVAILABLE
                </div>
                <p className="text-xs text-[#CFE4F2] leading-relaxed">
                  This browser has no speech synthesis. The text loop continues; only the Hinglish voice playback is offline.
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 border border-[#2EFF7B]/35 bg-[#2EFF7B]/[0.04] numeric text-[11px] text-[#7C93A6] tracking-wider flex items-center gap-2">
                <StatusLamp on ink={INK.signal} />
                PRIYA IS COMPOSING ·
                <span className="station-cursor text-[#2EFF7B]">_</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick transmissions */}
        <div className="border-t border-[#1C3245] px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#0A101C]">
          <span className="numeric text-[9px] tracking-[0.18em] text-[#6A8296] shrink-0">TEST VECTOR</span>
          {[
            'Kal shaam 6 baje payment karunga',
            'Direct UPI link WhatsApp pe bhej do',
            'Maine already pay kar diya hai',
            'Stop calling me, unsubscribe',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-[11px] px-3 py-1 border border-[#1C3245] text-[#7C93A6] hover:text-[#CFE4F2] hover:border-[#6A8296] transition-colors numeric"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Uplink input */}
        <div className="border-t border-[#1C3245] p-3 flex items-center gap-2 bg-[#0A101C]">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Uplink a reply — Hinglish or English…"
            className="station-input flex-1 px-3.5 py-2.5 text-xs caret-signal"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="numeric px-4 py-2.5 text-[11px] tracking-[0.14em] border border-[#2EFF7B] text-[#05080F] bg-[#2EFF7B] disabled:border-[#1C3245] disabled:text-[#6A8296] disabled:bg-transparent transition-colors flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            TRANSMIT
          </button>
        </div>
      </section>
    </div>
  );
};
