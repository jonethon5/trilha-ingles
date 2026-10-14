// Grava a voz pelo microfone e transforma gravações em amostras para a comparação de pronúncia.

let stream = null;
let recorder = null;
let chunks = [];
let context = null;

export const supported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";

function audioContext() {
  context ??= new (window.AudioContext || window.webkitAudioContext)();
  return context;
}

export function explain(err) {
  if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
    return "O app não tem permissão para usar o microfone. Libere em Ajustes do iPhone → Safari → Microfone (ou nos ajustes do site) e tente de novo.";
  }
  if (err?.name === "NotFoundError") return "Nenhum microfone encontrado neste aparelho.";
  return `Não foi possível gravar (${err?.name || "erro"}: ${err?.message || err}).`;
}

export async function start() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  recorder.start();
}

export const isRecording = () => recorder?.state === "recording";

// Para a gravação, solta o microfone e devolve o áudio gravado.
export function stop() {
  return new Promise((resolve, reject) => {
    if (!recorder) return reject(new Error("Nenhuma gravação em andamento."));
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/mp4" });
      for (const track of stream.getTracks()) track.stop();
      stream = null;
      recorder = null;
      resolve(blob);
    };
    recorder.stop();
  });
}

export function cancel() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
  for (const track of stream?.getTracks() || []) track.stop();
  stream = null;
  recorder = null;
}

// Decodifica um arquivo de áudio (mp3, m4a, webm...) em amostras mono: { samples, rate }.
export async function decode(arrayBuffer) {
  const ctx = audioContext();
  // A forma com callbacks funciona em todas as versões do Safari; a com Promise, só nas mais novas.
  const buffer = await new Promise((resolve, reject) => ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject));
  const samples = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) samples[i] += data[i] / buffer.numberOfChannels;
  }
  return { samples, rate: buffer.sampleRate };
}
