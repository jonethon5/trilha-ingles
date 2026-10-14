// Som do app: frases e palavras gravadas (pasta audio/) e efeitos sonoros gerados na hora.
//
// O iPhone só deixa uma página tocar som depois de um toque do usuário, e só no elemento de áudio
// que tocou dentro desse toque. Por isso o app usa sempre os mesmos dois elementos: no primeiro toque
// na tela eles tocam um trecho de silêncio ("destravar") e depois disso podem tocar qualquer coisa.

const voice = new Audio();
const effects = new Audio();
voice.preload = "auto";
effects.preload = "auto";

let unlocked = false;
let lastError = "";
let files = new Set();
const base = new URL("../audio/", import.meta.url);

// ---------- WAV gerado em memória (silêncio e efeitos) ----------

function wavUrl(samples, rate = 22050) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (pos, value) => [...value].forEach((ch, i) => view.setUint8(pos + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true));
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

// Sequência de notas: cada uma é [frequência em Hz, duração em s].
function tones(notes, volume = 0.25, rate = 22050) {
  const samples = [];
  for (const [freq, seconds] of notes) {
    const count = Math.floor(seconds * rate);
    for (let i = 0; i < count; i++) {
      const fade = Math.min(1, i / 200, (count - i) / (count * 0.5));
      samples.push(Math.sin((2 * Math.PI * freq * i) / rate) * volume * fade);
    }
  }
  return wavUrl(samples, rate);
}

const SOUNDS = {
  silence: wavUrl(new Array(2205).fill(0)),
  correct: tones([[660, 0.09], [990, 0.16]]),
  wrong: tones([[220, 0.12], [165, 0.2]], 0.3),
  done: tones([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]]),
  tap: tones([[880, 0.03]], 0.12),
};

// ---------- Destravar no primeiro toque ----------

export function unlock() {
  if (unlocked) return;
  for (const el of [voice, effects]) {
    el.src = SOUNDS.silence;
    el.play()
      .then(() => (unlocked = true))
      .catch((err) => (lastError = `destravar: ${err.name}`));
  }
}

// No iOS, quem conta como "toque do usuário" para liberar áudio é o touchend e o click.
for (const type of ["touchend", "click", "keydown"]) document.addEventListener(type, unlock, { capture: true, passive: true });

// ---------- Arquivos gravados ----------

export async function loadIndex() {
  try {
    files = new Set(await (await fetch(new URL("index.json", base))).json());
  } catch {
    files = new Set();
  }
  return files.size;
}

export const has = (file) => files.has(file);

const blobUrls = new Map();

// Baixa o arquivo inteiro e toca a partir da memória. Tocar direto pela URL faria o Safari pedir
// o arquivo em pedaços (Range), o que não funciona bem com o cache do service worker.
async function blobUrl(file) {
  if (blobUrls.has(file)) return blobUrls.get(file);
  const response = await fetch(new URL(file, base));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const url = URL.createObjectURL(await response.blob());
  blobUrls.set(file, url);
  if (blobUrls.size > 120) {
    const [oldest, oldUrl] = blobUrls.entries().next().value;
    URL.revokeObjectURL(oldUrl);
    blobUrls.delete(oldest);
  }
  return url;
}

// Deixa o áudio pronto antes de precisar dele, para tocar sem atraso.
export function preload(list) {
  for (const file of list) if (has(file)) blobUrl(file).catch(() => {});
}

let playId = 0;

export async function play(file, { slow = false } = {}) {
  const id = ++playId;
  try {
    const url = await blobUrl(file);
    if (id !== playId) return false; // outro som foi pedido enquanto este carregava
    voice.src = url;
    voice.defaultPlaybackRate = slow ? 0.7 : 1;
    voice.playbackRate = slow ? 0.7 : 1;
    await voice.play();
    lastError = "";
    return true;
  } catch (err) {
    lastError = `${err.name}: ${err.message}`;
    return false;
  }
}

// Bytes do arquivo, para a comparação de pronúncia decodificar.
export async function fetchBytes(file) {
  const response = await fetch(new URL(file, base));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
}

export async function playBlob(blob) {
  playId++;
  voice.src = URL.createObjectURL(blob);
  voice.defaultPlaybackRate = 1;
  voice.playbackRate = 1;
  try {
    await voice.play();
    return true;
  } catch (err) {
    lastError = `${err.name}: ${err.message}`;
    return false;
  }
}

// ---------- Voz sintética do aparelho, só para frases sem gravação (as cadastradas pelo usuário) ----------

export const canSynthesize = typeof speechSynthesis !== "undefined";

export function synthesize(text, { slow = false } = {}) {
  if (!canSynthesize) return false;
  try {
    // Cancelar logo antes de falar faz o Safari engolir a fala; só cancela se houver algo tocando.
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = slow ? 0.6 : 0.95;
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stop() {
  playId++;
  voice.pause();
  if (canSynthesize) speechSynthesis.cancel();
}

export function effect(name) {
  effects.src = SOUNDS[name];
  effects.play().catch(() => {});
}

// Diagnóstico para a tela de ajustes: toca um arquivo e conta o que aconteceu.
export async function selfTest(file) {
  const ok = await play(file);
  return ok ? "Som tocando. Se não ouvir, confira o volume do aparelho." : `Falhou (${lastError || "motivo desconhecido"}). Arquivos conhecidos: ${files.size}.`;
}

// Baixa todos os áudios em segundo plano, para o app funcionar offline por inteiro.
export async function cacheAll(onProgress = () => {}) {
  const list = [...files];
  let done = 0;
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(
      list.slice(i, i + 8).map((file) =>
        fetch(new URL(file, base))
          .then((r) => r.blob())
          .catch(() => {}),
      ),
    );
    done = Math.min(list.length, i + 8);
    onProgress(done, list.length);
  }
  return done;
}
