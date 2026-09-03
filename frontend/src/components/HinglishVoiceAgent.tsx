import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, Send, Volume2, Calendar, Check, Clock } from 'lucide-react';
import {
  type ChatMessage,
  type ChatInteractionResponse,
  sendChatMessage,
  fetchPresetScenarios
} from '../services/api';

export const HinglishVoiceAgent: React.FC = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
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
            {
              role: 'assistant',
              content: first.initial_message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectScenario = (sc: any) => {
    setSelectedScenario(sc);
    setP2pCommitment(null);
    setMessages([
      {
        role: 'assistant',
        content: sc.initial_message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    
    // Find Hindi or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang.includes('hi') || v.lang.includes('en-IN') || v.name.includes('India')
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedScenario || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const response: ChatInteractionResponse = await sendChatMessage({
        customer_name: selectedScenario.customer_name,
        merchant_name: selectedScenario.merchant_name,
        amount: selectedScenario.amount,
        failure_reason: selectedScenario.failure_reason,
        messages: newMessages,
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.p2p_details) {
        setP2pCommitment(response.p2p_details);
      }

      // Automatically speak the response if enabled
      speakText(response.audio_text_hinglish);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Scenario Selector & Promise-to-Pay Widget */}
      <div className="space-y-6">
        {/* Scenarios */}
        <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <PhoneCall className="w-4 h-4 text-[#3395FF]" />
            <h3 className="text-sm font-bold text-white">Select Recovery Scenario</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Test how the conversational agent engages customers in natural Hinglish, overcomes objections, and tracks promises.
          </p>

          <div className="space-y-2">
            {scenarios.map((sc) => {
              const isSelected = selectedScenario?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => selectScenario(sc)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-[#1E2E52]/80 border-[#3395FF] text-white shadow-md'
                      : 'bg-[#162238]/40 border-[#1E2E52]/60 text-slate-300 hover:bg-[#162238]'
                  }`}
                >
                  <div className="font-semibold">{sc.merchant_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{sc.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-medium">₹{sc.amount}</span>
                    <span className="text-slate-400">{sc.customer_name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Promise to Pay (P2P) Status Widget */}
        <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Promise-to-Pay (P2P) Tracker</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active State Machine
            </span>
          </div>

          {p2pCommitment ? (
            <div className="space-y-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-xs">
              <div className="flex items-center justify-between font-bold text-white">
                <span>{p2pCommitment.customer_name}</span>
                <span className="text-emerald-400">₹{p2pCommitment.amount}</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Promised Date: <strong>{p2pCommitment.promised_date}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Time: <strong>{p2pCommitment.promised_time}</strong></span>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aggressive dunning paused. Non-intrusive reminder scheduled.</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-[#1E2E52] rounded-xl p-4">
              <Clock className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <span>No active commitment detected yet.</span>
              <p className="mt-1 text-[11px] text-slate-400">
                Click <em>"Kal shaam 6 baje payment karunga"</em> in the chat to see intent extraction in action.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right 2 Columns: WhatsApp / Voice Simulator */}
      <div className="lg:col-span-2 bg-[#101828] border border-[#1E2E52] rounded-2xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#1E2E52] bg-[#0A1020] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10B981] to-[#3395FF] flex items-center justify-center font-bold text-white text-sm">
              RR
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Priya from {selectedScenario?.merchant_name || 'RazorRevive'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Calling / WhatsApp to {selectedScenario?.customer_name} • Pending ₹{selectedScenario?.amount}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
              if (lastAssistant) speakText(lastAssistant.content);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSpeaking
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-[#162238] text-slate-300 border-[#1E2E52] hover:bg-[#1E2E52]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSpeaking ? 'Speaking...' : 'Play Hinglish Voice'}</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080D1A]/60">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                    isUser
                      ? 'bg-[#3395FF] text-white rounded-tr-none'
                      : 'bg-[#162238] border border-[#1E2E52] text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#162238] border border-[#1E2E52] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-slate-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
                <span>Priya is replying...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2 bg-[#0A1020]/90 border-t border-[#1E2E52]/60 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">Test Prompts:</span>
          {[
            'Kal shaam 6 baje payment karunga',
            'Direct UPI link WhatsApp pe bhej do',
            'Maine already pay kar diya hai',
            'Stop calling me, unsubscribe',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-[#162238] hover:bg-[#1E2E52] text-slate-300 px-3 py-1 rounded-full whitespace-nowrap border border-[#1E2E52] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#1E2E52] bg-[#0A1020] flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your reply in Hinglish or English (e.g. 'Parson subah karunga')..."
            className="flex-1 bg-[#162238] border border-[#1E2E52] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3395FF]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-[#3395FF] hover:bg-blue-600 disabled:bg-slate-700 text-white rounded-xl transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
