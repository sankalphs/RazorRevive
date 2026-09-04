import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Lock, Clock3, Bot, User } from 'lucide-react';
import {
  type ChatMessage,
  type ChatInteractionResponse,
  type PresetScenario,
  type PromiseToPayRecord,
  sendChatMessage,
  fetchPresetScenarios,
  fetchP2PRecords,
} from '../services/api';
import { speakHinglish, stopSpeech } from '../services/voice';
import { PanelHeader, formatINR, istStamp } from './telemetry';

/* ============================================================
   AI AGENT â€” talk to Priya, the Hinglish recovery agent.
   A normal chat UI: bubbles, composer, quick replies. When
   a payment promise is detected, it's tracked on the side.
   ============================================================ */

const QUICK_REPLIES = [
  'Kal shaam 6 baje payment karunga',
  'Direct UPI link WhatsApp pe bhej do',
  'Maine already pay kar diya hai',
  'Stop calling me, unsubscribe',
];

export const HinglishVoiceAgent: React.FC = () => {
  const [scenarios, setScenarios] = useState<PresetScenario[]>([]);
  const [scenariosFailed, setScenariosFailed] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<PresetScenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [p2pCommitment, setP2pCommitment] = useState<PromiseToPayRecord | null>(null);
  const [registry, setRegistry] = useState<PromiseToPayRecord[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const refreshRegistry = () => {
    fetchP2PRecords()
      .then(setRegistry)
      .catch(() => {
        // Registry panel is supplementary; failures stay silent.
      });
  };

  useEffect(() => {
    fetchPresetScenarios()
      .then((data) => {
        setScenarios(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedScenario(first);
          setMessages([{ role: 'assistant', content: first.initial_message, timestamp: istStamp() }]);
        }
      })
      .catch((err) => {
        console.error(err);
        setScenariosFailed(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chatEndRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }, [messages]);

  const selectScenario = (sc: PresetScenario) => {
    setSelectedScenario(sc);
    setP2pCommitment(null);
    setMessages([{ role: 'assistant', content: sc.initial_message, timestamp: istStamp() }]);
  };

  const speakText = (text: string) => {
    const ok = speakHinglish(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
    if (!ok) setVoiceUnsupported(true);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedScenario || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: istStamp() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);
    setSendFailed(false);

    try {
      const response: ChatInteractionResponse = await sendChatMessage({
        // Stable demo correlation id so P2P records tie back to this scenario.
        transaction_id: `demo_${selectedScenario.id}`,
        customer_name: selectedScenario.customer_name,
        merchant_name: selectedScenario.merchant_name,
        amount: selectedScenario.amount,
        failure_reason: selectedScenario.failure_reason,
        messages: newMessages,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply, timestamp: istStamp() }]);
      if (response.p2p_details) setP2pCommitment(response.p2p_details);
      refreshRegistry();
      speakText(response.audio_text_hinglish);
    } catch (err) {
      console.error('Agent chat error:', err);
      setSendFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scenarios + promise tracker */}
      <div className="space-y-6">
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Recovery scenarios">
          <PanelHeader
            title="Try a scenario"
            subtitle="Pick a customer case, then chat with the agent as that customer."
          />
          <div className="px-5 pb-5 space-y-2">
            {scenariosFailed ? (
              <div className="border border-dashed border-line-strong rounded-lg px-4 py-8 text-center">
                <div className="text-[13.5px] font-medium text-bad">Scenarios unavailable</div>
                <p className="text-[12.5px] text-ink-3 mt-1.5">
                  The scenario service isn't responding. Start the backend and reload.
                </p>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="border border-dashed border-line-strong rounded-lg px-4 py-8 text-center text-[13px] text-ink-3">
                Loading scenariosâ€¦
              </div>
            ) : (
              scenarios.map((sc) => {
                const on = selectedScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => selectScenario(sc)}
                    aria-pressed={on}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      on
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-white hover:bg-wash'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[13.5px] font-semibold ${on ? 'text-accent-strong' : 'text-ink'}`}>
                        {sc.merchant_name}
                      </span>
                      <span className="text-[13px] font-medium text-ok numeric">{formatINR(sc.amount)}</span>
                    </div>
                    <div className="text-[12.5px] text-ink-3 mt-0.5">{sc.title}</div>
                    <div className="text-[12px] text-ink-3 mt-1">Customer: {sc.customer_name}</div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Promise tracker */}
        <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Promise to pay">
          <PanelHeader
            title="Promise to pay"
            subtitle="When the agent detects a payment promise, follow-ups stop and one reminder is scheduled."
          />
          <div className="px-5 pb-5">
            {p2pCommitment ? (
              <div className="arrive border border-warn-line bg-warn-soft rounded-lg px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                    <Lock className="w-3.5 h-3.5 text-warn" />
                    {p2pCommitment.customer_name}
                  </span>
                  <span className="text-[14px] font-semibold text-warn numeric">{formatINR(p2pCommitment.amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3 numeric">
                  <Clock3 className="w-3.5 h-3.5 text-warn" />
                  Promised for {p2pCommitment.promised_date} at {p2pCommitment.promised_time} IST
                </div>
                <div className="mt-3 pt-3 border-t border-warn-line text-[12.5px] font-medium text-warn">
                  Follow-up paused Â· reminder scheduled
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-line-strong rounded-lg px-4 py-6 text-center">
                <div className="text-[13px] text-ink-3">No promise detected yet</div>
                <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">
                  Send <span className="text-ink font-medium">"Kal shaam 6 baje payment karunga"</span> in the
                  chat and watch the agent capture it.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Promise registry â€” every tracked promise, server-side */}
        {registry.length > 0 && (
          <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Promise registry">
            <PanelHeader
              title="Promise registry"
              subtitle={`All ${registry.length} tracked promise${registry.length === 1 ? '' : 's'} across sessions. Dunning stays paused on each until its due time.`}
            />
            <div className="px-5 pb-5 space-y-2">
              {registry.slice().reverse().map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-lg border px-3.5 py-2.5 text-[12.5px] transition-colors ${
                    rec.id === p2pCommitment?.id
                      ? 'border-warn-line bg-warn-soft'
                      : 'border-line bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">{rec.customer_name}</span>
                    <span className="text-ink-3 numeric">{formatINR(rec.amount)}</span>
                  </div>
                  <div className="text-ink-3 numeric mt-0.5">
                    {rec.promised_date} Â· {rec.promised_time}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Chat */}
      <section
        className="lg:col-span-2 bg-white border border-line rounded-xl shadow-card flex flex-col h-[640px]"
        aria-label="Agent chat"
      >
        <PanelHeader
          title={`Priya Â· ${selectedScenario?.merchant_name ?? 'recovery agent'}`}
          subtitle={
            selectedScenario
              ? `Chatting with ${selectedScenario.customer_name} about ${formatINR(selectedScenario.amount)} Â· speaks Hinglish, respects DND and hardship signals`
              : 'Pick a scenario to start'
          }
          right={
            <>
              <button
                onClick={() => {
                  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
                  if (lastAssistant) speakText(lastAssistant.content);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-medium rounded-lg border transition-colors ${
                  isSpeaking
                    ? 'border-accent text-accent-strong bg-accent-soft'
                    : 'border-line-strong text-ink-2 hover:bg-wash'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                {isSpeaking ? 'Speakingâ€¦' : 'Play voice'}
              </button>
              {isSpeaking && (
                <button
                  onClick={() => {
                    stopSpeech();
                    setIsSpeaking(false);
                  }}
                  className="px-3 py-1.5 text-[12.5px] font-medium rounded-lg border border-line-strong text-ink-2 hover:bg-wash transition-colors"
                >
                  Stop
                </button>
              )}
            </>
          }
        />

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-page mx-0.5"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isUser ? 'bg-line text-ink-2' : 'bg-accent text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-accent text-white rounded-tr-sm'
                        : 'bg-white border border-line text-ink rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                    <div className={`mt-1 text-[10.5px] numeric ${isUser ? 'text-white' : 'text-ink-3'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {sendFailed && (
            <div className="flex justify-start">
              <div className="arrive max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-bad-soft border border-bad-line">
                <div className="text-[13px] font-medium text-bad">Message failed to send</div>
                <p className="text-[12.5px] text-ink-3 mt-1">
                  The agent service didn't respond. Check the backend (`python run.py`) and send again.
                </p>
              </div>
            </div>
          )}
          {voiceUnsupported && (
            <div className="flex justify-start">
              <div className="arrive max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-warn-soft border border-warn-line">
                <p className="text-[12.5px] text-ink-3">
                  This browser can't play the Hinglish voice â€” the text chat still works normally.
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3.5 py-2.5 bg-white border border-line text-[13px] text-ink-3 rounded-2xl rounded-tl-sm">
                  Priya is typing<span className="animate-pulse">â€¦</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick replies */}
        <div className="border-t border-line px-5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white rounded-b-xl">
          {QUICK_REPLIES.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-[12.5px] px-3 py-1.5 rounded-full border border-line-strong text-ink-2 hover:bg-wash hover:border-ink-4 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-line p-4 bg-white rounded-b-xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Reply as the customer â€” Hinglish or Englishâ€¦"
              aria-label="Message Priya"
              className="field flex-1 px-3.5 py-2.5 text-[13.5px] caret-accent"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 text-[13.5px] font-semibold rounded-lg bg-accent text-white hover:bg-accent-strong disabled:bg-wash disabled:text-ink-2 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
