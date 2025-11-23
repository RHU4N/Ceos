import { useState, useEffect } from 'react';

// Module-level TTS state and listeners so both hook and direct imports work
let enabled = false;
try { enabled = localStorage.getItem('ceos_tts_enabled') === 'true'; } catch (e) {}

const listeners = new Set();

function notify() {
  for (const cb of Array.from(listeners)) {
    try { cb(enabled); } catch (e) { /* ignore */ }
  }
}

export function isEnabled() {
  return enabled;
}

export function toggleTTS() {
  enabled = !enabled;
  try { localStorage.setItem('ceos_tts_enabled', enabled ? 'true' : 'false'); } catch (e) {}
  notify();
  return enabled;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function stop() {
  try { window.speechSynthesis.cancel(); } catch (e) {}
}

export function speak(text, opts = {}) {
  if (!enabled) return;
  if (!('speechSynthesis' in window)) return;
  try { window.speechSynthesis.cancel(); } catch (e) {}
  const utter = new SpeechSynthesisUtterance(String(text || ''));
  utter.lang = opts.lang || 'pt-BR';
  utter.rate = typeof opts.rate === 'number' ? opts.rate : 1;
  utter.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1;
  if (opts.voice) utter.voice = opts.voice;
  window.speechSynthesis.speak(utter);
}

// React hook to get reactive TTS enabled state and toggle function
export function useTTS() {
  const [state, setState] = useState(enabled);
  useEffect(() => {
    const unsub = subscribe((v) => setState(v));
    return unsub;
  }, []);
  return { enabled: state, toggle: toggleTTS, speak, stop };
}

export default { isEnabled, toggleTTS, speak, stop, subscribe, useTTS };