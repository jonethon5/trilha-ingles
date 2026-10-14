// Pronúncia em inglês usando a voz do próprio aparelho (Web Speech API). Não precisa de internet no iPhone.

let voice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  voice = voices.find((v) => v.lang === "en-US" && v.localService) || voices.find((v) => v.lang === "en-US") || voices[0] || null;
}

export const supported = typeof speechSynthesis !== "undefined";

if (supported) {
  pickVoice();
  // As vozes chegam de forma assíncrona em alguns navegadores.
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export function speak(text, { slow = false } = {}) {
  if (!supported) return;
  try {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (voice) utterance.voice = voice;
    utterance.rate = slow ? 0.6 : 0.95;
    speechSynthesis.speak(utterance);
  } catch {
    // sem voz disponível: o exercício continua funcionando em silêncio
  }
}

export function stop() {
  if (supported) speechSynthesis.cancel();
}
