export let ttsEnabled = false;

export function toggleTTS() {
  ttsEnabled = !ttsEnabled;
}
export function speak(text) {
      window.speechSynthesis.cancel();
    if (!ttsEnabled) return;
  if (!window.speechSynthesis) {
    console.error("Seu navegador não suporta SpeechSynthesis.");
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";     // idioma
  utter.rate = 1;           // velocidade
  utter.pitch = 1;          // tom

  window.speechSynthesis.cancel(); // interrompe qualquer fala anterior
  window.speechSynthesis.speak(utter);
}