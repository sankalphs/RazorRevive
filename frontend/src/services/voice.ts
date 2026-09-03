/* Voice playback for the Promise-to-Pay talk track.

   One owner of browser speech: voice lookup (with voiceschanged
   fallback for the first-call empty-voices race), play, and stop.
   Returns false when speech is unavailable so callers degrade honestly.
 */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return voices.find(
    (v) => v.lang.includes('hi') || v.lang.includes('en-IN') || v.name.includes('India'),
  );
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
}

export function speakHinglish(text: string, cb: SpeakCallbacks = {}): boolean {
  if (!isSpeechSupported()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.05;

  const assignVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const indian = pickIndianVoice(voices);
    if (indian) utterance.voice = indian;
  };
  assignVoice();
  // Voices often load async — retry once when they arrive.
  if (window.speechSynthesis.getVoices().length === 0 && 'onvoiceschanged' in window.speechSynthesis) {
    const synth = window.speechSynthesis as SpeechSynthesis & { onvoiceschanged: (() => void) | null };
    synth.onvoiceschanged = () => assignVoice();
  }

  utterance.onstart = () => cb.onStart?.();
  utterance.onend = () => cb.onEnd?.();
  utterance.onerror = () => cb.onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
