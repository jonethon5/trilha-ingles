// Mede a distância entre gravações para calibrar a nota de pronúncia (CALIBRATION em js/pronounce.js).
// Uso: node tools/calibrate.mjs <pasta com voz A> <pasta com voz B>
// As duas pastas têm os mesmos arquivos .wav (mesmas frases), cada uma com uma voz diferente.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mfcc, dtw, trimSilence, resample, compare } from "../js/pronounce.js";

export function readWav(path) {
  const buf = readFileSync(path);
  let pos = 12;
  let rate = 0;
  let channels = 1;
  while (pos < buf.length - 8) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") {
      channels = buf.readUInt16LE(pos + 10);
      rate = buf.readUInt32LE(pos + 12);
    } else if (id === "data") {
      const count = Math.floor(Math.min(size, buf.length - pos - 8) / 2 / channels);
      const samples = new Float32Array(count);
      for (let i = 0; i < count; i++) samples[i] = buf.readInt16LE(pos + 8 + i * 2 * channels) / 32768;
      return { samples, rate };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error(`WAV inválido: ${path}`);
}

if (process.argv[1].endsWith("calibrate.mjs")) {
  const [dirA, dirB] = process.argv.slice(2);
  const names = readdirSync(dirA).filter((f) => f.endsWith(".wav") && readdirSync(dirB).includes(f));
  const feats = (dir) => names.map((n) => { const w = readWav(join(dir, n)); return mfcc(trimSilence(resample(w.samples, w.rate))); });
  const a = feats(dirA);
  const b = feats(dirB);
  const same = [];
  const different = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < names.length; j++) (i === j ? same : different).push(dtw(a[i], b[j]));
  }
  const stats = (list) => {
    const sorted = [...list].sort((x, y) => x - y);
    const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].toFixed(3);
    return `n=${list.length} min=${at(0)} p10=${at(0.1)} mediana=${at(0.5)} p90=${at(0.9)} max=${at(0.999)}`;
  };
  console.log("mesma frase, vozes diferentes:", stats(same));
  console.log("frases diferentes:            ", stats(different));
  const scoreSame = names.map((n) => compare(readWav(join(dirA, n)), readWav(join(dirB, n))).score);
  const scoreDiff = names.map((n, i) => compare(readWav(join(dirA, n)), readWav(join(dirB, names[(i + 3) % names.length]))).score);
  const self = names.slice(0, 3).map((n) => compare(readWav(join(dirA, n)), readWav(join(dirA, n))).score);
  console.log("nota, mesma frase:    ", scoreSame.join(" "));
  console.log("nota, frase diferente:", scoreDiff.join(" "));
  console.log("nota, áudio idêntico: ", self.join(" "));
}
