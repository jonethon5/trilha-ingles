// Gera os arquivos de áudio do app (pasta audio/) a partir dos textos do curso e do treino de fala.
//
// Precisa de dois programas, que NÃO fazem parte do repositório:
//   - Piper (https://github.com/rhasspy/piper), sintetizador de voz que roda no próprio computador
//   - LAME (https://lame.sourceforge.io), para converter WAV em MP3
//
// Uso:
//   PIPER=caminho/piper.exe VOICE=caminho/en_US-ljspeech-medium.onnx LAME=caminho/lame.exe node tools/make-audio.mjs
//
// A voz usada é a en_US-ljspeech-medium, treinada no LJ Speech Dataset (domínio público).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COURSE, flatLessons } from "../js/course.js";
import { flatSpeaking } from "../js/speaking.js";
import { tokenize } from "../js/exercise.js";
import { wordFile } from "../js/audio-paths.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { PIPER, VOICE, LAME } = process.env;
if (!PIPER || !VOICE || !LAME) {
  console.error("Defina as variáveis PIPER, VOICE e LAME (veja o comentário no topo deste arquivo).");
  process.exit(1);
}

// Lista de tudo o que precisa de áudio: caminho dentro de audio/ e o texto a falar.
const jobs = new Map();
for (const lesson of flatLessons(COURSE)) {
  for (const s of lesson.sentences) {
    jobs.set(`s/${s.id}.mp3`, s.en);
    for (const word of tokenize(s.en)) jobs.set(wordFile(word), word);
  }
  lesson.vocab.forEach(([en], i) => jobs.set(`v/${lesson.id}-${i + 1}.mp3`, en.replace(/\s*\/\s*/g, ", ")));
}
for (const s of flatSpeaking()) jobs.set(`p/${s.id}.mp3`, s.en);

const out = join(root, "audio");
const tmp = mkdtempSync(join(tmpdir(), "trilha-audio-"));
const todo = [...jobs].filter(([path]) => !existsSync(join(out, path)));
console.log(`${jobs.size} áudios no total, ${todo.length} a gerar`);

if (todo.length) {
  const input = todo.map(([, text], i) => JSON.stringify({ text, output_file: join(tmp, `${i}.wav`).replace(/\\/g, "/") })).join("\n");
  const synth = spawnSync(PIPER, ["--model", VOICE, "--json-input", "--sentence_silence", "0.1"], { input, encoding: "utf8", maxBuffer: 1 << 28 });
  if (synth.status !== 0) throw new Error(`Piper falhou: ${synth.stderr.slice(-400)}`);
  todo.forEach(([path], i) => {
    const target = join(out, path);
    mkdirSync(dirname(target), { recursive: true });
    const enc = spawnSync(LAME, ["--quiet", "-m", "m", "-b", "32", "--resample", "22.05", join(tmp, `${i}.wav`), target]);
    if (enc.status !== 0) throw new Error(`LAME falhou em ${path}`);
  });
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
writeFileSync(join(out, "index.json"), JSON.stringify([...jobs.keys()].sort()));
console.log(`pronto: ${jobs.size} arquivos, ${(bytes / 1048576).toFixed(1)} MB`);
