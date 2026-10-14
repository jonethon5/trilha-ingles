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
let mouths = {}; // arquivo -> volume da fala, 25 vezes por segundo, em dígitos de 0 a 9
let fps = 25;
let currentFile = null;
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
  pick: tones([[620, 0.035]], 0.14), // palavra ou opção escolhida
  drop: tones([[440, 0.035]], 0.12), // palavra devolvida ao banco
  flip: tones([[520, 0.03], [780, 0.05]], 0.12), // cartão virado
  match: tones([[700, 0.05], [1050, 0.08]], 0.18), // par ligado
  open: tones([[392, 0.05], [523, 0.07]], 0.12), // tela nova
  heart: tones([[330, 0.08], [247, 0.14]], 0.22), // vida perdida
  combo: tones([[784, 0.06], [988, 0.06], [1175, 0.12]], 0.2),
  chest: tones([[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.07], [1319, 0.22]], 0.22),
  level: tones([[392, 0.1], [523, 0.1], [659, 0.1], [784, 0.14], [1047, 0.3]], 0.24),
  streak: tones([[440, 0.08], [554, 0.08], [659, 0.08], [880, 0.26]], 0.22),
};

// ---------- Boca dos personagens ----------
//
// Enquanto uma fala toca, o <body> ganha a classe "talking" e a variável CSS --mouth (de 0 a 1),
// lida do mapa de volume gravado junto com cada áudio. O CSS usa as duas para abrir e fechar a boca
// no ritmo exato da fala. Sem mapa (voz sintética do aparelho), o CSS anima a boca sozinho.

let mouthFrame = 0;

function moveMouth() {
  const map = currentFile && mouths[currentFile];
  if (map) {
    const digit = map.charCodeAt(Math.floor(voice.currentTime * fps)) - 48;
    document.body.style.setProperty("--mouth", digit >= 0 && digit <= 9 ? (digit / 9).toFixed(2) : "0");
  }
  mouthFrame = requestAnimationFrame(moveMouth);
}

voice.addEventListener("playing", () => {
  if (voice.src === SOUNDS.silence) return;
  document.body.classList.add("talking");
  document.body.classList.toggle("lipsync", Boolean(currentFile && mouths[currentFile]));
  cancelAnimationFrame(mouthFrame);
  moveMouth();
});

for (const type of ["pause", "ended", "error", "emptied"]) {
  voice.addEventListener(type, () => {
    cancelAnimationFrame(mouthFrame);
    document.body.classList.remove("talking", "lipsync");
    document.body.style.setProperty("--mouth", "0");
  });
}

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
    const index = await (await fetch(new URL("index.json", base))).json();
    files = new Set(Object.keys(index.files));
    mouths = Object.fromEntries(Object.entries(index.files).map(([file, info]) => [file, info.mouth]));
    fps = index.fps || 25;
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
    currentFile = file;
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
  currentFile = null;
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
