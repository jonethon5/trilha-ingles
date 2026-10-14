// Gera os arquivos de áudio do app (pasta audio/) a partir dos textos do curso, do baralho de palavras,
// das histórias e do treino de fala. Cada texto sai na voz do personagem que o fala (js/voices.js).
//
// Além do MP3, grava em audio/index.json o "mapa da boca" de cada áudio: o volume da fala 25 vezes
// por segundo, de 0 a 9. É com ele que os personagens abrem e fecham a boca no ritmo da fala.
//
// Precisa de dois programas, que NÃO fazem parte do repositório:
//   - Piper (https://github.com/rhasspy/piper), sintetizador de voz que roda no próprio computador,
//     e os modelos de voz listados em js/voices.js (https://huggingface.co/rhasspy/piper-voices)
//   - LAME (https://lame.sourceforge.io), para converter WAV em MP3
//
// Uso:
//   PIPER=caminho/piper.exe VOICES=pasta/dos/modelos LAME=caminho/lame.exe node tools/make-audio.mjs
//
// Só gera o que falta ou o que mudou de voz. Para refazer tudo, apague a pasta audio/.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COURSE, flatLessons } from "../js/course.js";
import { flatSpeaking } from "../js/speaking.js";
import { tokenize } from "../js/exercise.js";
import { contextFile, storyFile, wordFile } from "../js/audio-paths.js";
import { WORDS } from "../js/words.js";
import { guideWords } from "../js/ipa.js";
import { STORIES, pieces } from "../js/stories.js";
import { VOICES, speakerFor } from "../js/voices.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { PIPER, VOICES: VOICE_DIR, LAME } = process.env;
if (!PIPER || !VOICE_DIR || !LAME) {
  console.error("Defina as variáveis PIPER, VOICES e LAME (veja o comentário no topo deste arquivo).");
  process.exit(1);
}

const FPS = 25;

// Tudo o que precisa de áudio: caminho dentro de audio/, o texto e quem fala.
const jobs = new Map();
const add = (path, text, voice) => jobs.set(path, { text, voice });
for (const lesson of flatLessons(COURSE)) {
  for (const s of lesson.sentences) {
    add(`s/${s.id}.mp3`, s.en, speakerFor(s.id));
    for (const word of tokenize(s.en)) add(wordFile(word), word, "cora");
  }
  lesson.vocab.forEach(([en], i) => add(`v/${lesson.id}-${i + 1}.mp3`, en.replace(/\s*\/\s*/g, ", "), speakerFor(lesson.sentences[0].id)));
}
for (const s of flatSpeaking()) {
  add(`p/${s.id}.mp3`, s.en, speakerFor(s.id));
  // Cada palavra do treino de fala também existe sozinha, para tocar ao ser tocada na tela.
  for (const word of tokenize(s.en)) add(wordFile(word), word, "cora");
}
for (const word of WORDS) {
  add(wordFile(word.word), word.word, "cora");
  for (const card of word.cards) add(contextFile(card.id), card.en, speakerFor(card.id));
}
for (const word of guideWords()) add(wordFile(word), word, "cora");
for (const story of STORIES) {
  for (const part of story.parts) {
    for (const s of part.sentences) {
      add(storyFile(s.id), s.en, speakerFor(s.id));
      for (const piece of pieces(s.en)) if (piece.word) add(wordFile(piece.word), piece.word, "cora");
    }
  }
}

const out = join(root, "audio");
const indexPath = join(out, "index.json");
mkdirSync(out, { recursive: true });
let previous = {};
try {
  const old = JSON.parse(readFileSync(indexPath, "utf8"));
  if (old.version === 2) previous = old.files;
} catch {
  // índice antigo ou ausente: tudo é gerado de novo
}

const todo = [...jobs].filter(([path, job]) => !existsSync(join(out, path)) || previous[path]?.voice !== job.voice || !previous[path]?.mouth);
const chars = [...jobs.values()].reduce((sum, job) => sum + job.text.length, 0);
console.log(`${jobs.size} áudios (${chars} caracteres de texto), ${todo.length} a gerar`);

function readWav(path) {
  const buf = readFileSync(path);
  let pos = 12;
  let rate = 22050;
  while (pos < buf.length - 8) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") rate = buf.readUInt32LE(pos + 12);
    if (id === "data") {
      const n = Math.floor(Math.min(size, buf.length - pos - 8) / 2);
      const samples = new Float32Array(n);
      for (let i = 0; i < n; i++) samples[i] = buf.readInt16LE(pos + 8 + i * 2) / 32768;
      return { samples, rate };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error(`WAV inválido: ${path}`);
}

// Volume em janelas de 40 ms, normalizado pelo pico do próprio áudio, em dígitos de 0 a 9.
function mouthMap({ samples, rate }) {
  const size = Math.round(rate / FPS);
  const values = [];
  for (let start = 0; start < samples.length; start += size) {
    let sum = 0;
    const end = Math.min(samples.length, start + size);
    for (let i = start; i < end; i++) sum += samples[i] ** 2;
    values.push(Math.sqrt(sum / (end - start)));
  }
  const peak = Math.max(...values) || 1;
  return values.map((v) => Math.min(9, Math.round((v / peak) ** 0.7 * 9))).join("");
}

const tmp = mkdtempSync(join(tmpdir(), "trilha-audio-"));
const results = {};
const byVoice = new Map();
for (const [path, job] of todo) {
  if (!byVoice.has(job.voice)) byVoice.set(job.voice, []);
  byVoice.get(job.voice).push(path);
}
for (const [voice, paths] of byVoice) {
  const config = VOICES[voice];
  const args = ["--model", join(VOICE_DIR, `${config.model}.onnx`), "--json-input", "--sentence_silence", "0.1", "--length_scale", String(config.speed)];
  if (config.speaker !== undefined) args.push("--speaker", String(config.speaker));
  const input = paths.map((path, i) => JSON.stringify({ text: jobs.get(path).text, output_file: join(tmp, `${voice}-${i}.wav`).replace(/\\/g, "/") })).join("\n");
  const synth = spawnSync(PIPER, args, { input, encoding: "utf8", maxBuffer: 1 << 28 });
  if (synth.status !== 0) throw new Error(`Piper falhou na voz ${voice}: ${synth.stderr.slice(-400)}`);
  paths.forEach((path, i) => {
    const wav = join(tmp, `${voice}-${i}.wav`);
    const target = join(out, path);
    mkdirSync(dirname(target), { recursive: true });
    const enc = spawnSync(LAME, ["--quiet", "-m", "m", "-b", "32", "--resample", "22.05", wav, target]);
    if (enc.status !== 0) throw new Error(`LAME falhou em ${path}`);
    results[path] = { voice, mouth: mouthMap(readWav(wav)) };
  });
  console.log(`  ${voice}: ${paths.length} áudios`);
}
rmSync(tmp, { recursive: true, force: true });

// Remove áudios de textos que não existem mais e grava o índice que o app consulta.
let bytes = 0;
for (const dir of readdirSync(out, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const file of readdirSync(join(out, dir.name))) {
    const path = `${dir.name}/${file}`;
    if (!jobs.has(path)) rmSync(join(out, path));
    else bytes += statSync(join(out, path)).size;
  }
}
const files = {};
for (const path of [...jobs.keys()].sort()) files[path] = results[path] || previous[path];
writeFileSync(indexPath, JSON.stringify({ version: 2, fps: FPS, files }));
console.log(`pronto: ${jobs.size} arquivos, ${(bytes / 1048576).toFixed(1)} MB; índice ${(statSync(indexPath).size / 1024).toFixed(0)} KB`);
