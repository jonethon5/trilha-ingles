// Aba Falar: ouvir a frase modelo, ver a transcrição fonética (IPA), gravar a própria voz
// e comparar as duas gravações.

import { h, app, actions, tabViews, show, save, toast, titleBar, barHtml, daily, addXp, effect, game, audio } from "../core.js";
import { LEVELS, flatSpeaking, words } from "../speaking.js";
import { speakingFile } from "../audio-paths.js";
import * as recorder from "../recorder.js";
import { compare, label } from "../pronounce.js";

const sentences = flatSpeaking();
const byId = new Map(sentences.map((s) => [s.id, s]));
const GOALS = [1, 3, 5, 10];
const GOOD = 75; // nota a partir da qual a fala conta como "muito parecida"
const MAX_SECONDS = 15;

// Estado da tela de prática: frase atual, fase (idle, recording, analyzing, result) e último resultado.
let practice = null;
const modelCache = new Map();

const history = (id) => app.state.speak.history[id] || [];
const best = (id) => history(id).reduce((max, a) => Math.max(max, a.score), 0);

function levelSentences(levelId = app.state.speak.level) {
  return sentences.filter((s) => s.level === levelId);
}

// A próxima frase a treinar: a nunca gravada primeiro, depois a de menor nota.
function nextId(levelId, skip = null) {
  const list = levelSentences(levelId).filter((s) => s.id !== skip);
  const fresh = list.find((s) => !history(s.id).length);
  return (fresh || [...list].sort((a, b) => best(a.id) - best(b.id))[0]).id;
}

function badge(id) {
  const top = best(id);
  if (!history(id).length) return `<span class="score none">—</span>`;
  return `<span class="score ${top >= GOOD ? "good" : top >= 60 ? "mid" : "low"}">${top}</span>`;
}

function showSpeak() {
  practice = null;
  const speak = app.state.speak;
  const done = daily().spoken;
  const levels = LEVELS.map(
    (l) => `<button class="level ${l.id === speak.level ? "on" : ""}" data-act="speak-level" data-level="${l.id}"><b>${l.name}</b><span>${h(l.title)}</span></button>`,
  ).join("");
  const level = LEVELS.find((l) => l.id === speak.level);
  const rows = levelSentences()
    .map((s) => `<button class="row-btn" data-act="speak-open" data-id="${s.id}"><span lang="en">${h(s.en)}</span>${badge(s.id)}</button>`)
    .join("");
  const goals = GOALS.map((g) => `<option value="${g}" ${g === speak.goal ? "selected" : ""}>${g} por dia</option>`).join("");
  show(`${titleBar("Falar", "Treino de pronúncia")}<div class="scroll">
    <div class="card today"><div class="row plain"><p class="section-title">Meta de hoje</p><select id="speak-goal" aria-label="Frases por dia">${goals}</select></div>
      <div class="goal"><span>${done >= speak.goal ? "🏆" : "🎙️"}</span>${barHtml(done / speak.goal, "green")}<span class="small">${Math.min(done, speak.goal)} / ${speak.goal}</span></div>
      <button class="btn" data-act="speak-next">${done >= speak.goal ? "Treinar mais uma" : "Treinar agora"}</button></div>
    <div class="levels">${levels}</div>
    <p class="section-title">${level.name} · ${h(level.desc)}</p>
    <div class="card list">${rows}</div>
    <p class="small note">Você ouve a frase, vê como ela soa no alfabeto fonético (IPA), grava a sua voz e o app compara as duas gravações. A nota fica guardada para você acompanhar a evolução; a gravação não sai do aparelho e não é salva.</p></div>`);
  document.querySelector("#speak-goal").onchange = (e) => {
    speak.goal = Number(e.target.value);
    save();
    showSpeak();
  };
}

// ---------- Tela de prática ----------

function openPractice(id) {
  recorder.cancel();
  practice = { id, phase: "idle", result: null, blob: null, error: "" };
  audio.preload([speakingFile(id)]);
  drawPractice();
}

function ipaHtml(s) {
  const list = words(s.en);
  return `<div class="ipa" lang="en">${list.map((w, i) => `<div><b>${h(w)}</b><span>${h(s.ipa[i] || "")}</span></div>`).join("")}</div>`;
}

// As duas falas, uma sobre a outra: o volume ao longo do tempo de cada gravação.
function wave(values, cls) {
  const bars = values.map((v, i) => `<rect x="${i * 3}" y="${(20 - v * 20).toFixed(1)}" width="2" height="${Math.max(1, v * 40).toFixed(1)}" rx="1"/>`).join("");
  return `<svg class="wave ${cls}" viewBox="0 0 ${values.length * 3} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

function historyHtml(id) {
  const list = history(id).slice(-12);
  if (list.length < 2) return "";
  const bars = list.map((a) => `<i class="${a.score >= GOOD ? "good" : a.score >= 60 ? "mid" : "low"}" style="height:${Math.max(4, a.score * 0.5)}px" title="${a.score}"></i>`).join("");
  const delta = list[list.length - 1].score - list[0].score;
  return `<div class="card"><div class="row plain"><h3>Sua evolução nesta frase</h3><span class="small">melhor: ${best(id)}</span></div>
    <div class="trend">${bars}</div><p>${delta > 0 ? `Subiu ${delta} pontos desde a primeira tentativa mostrada.` : "Cada barra é uma gravação, da mais antiga para a mais nova."}</p></div>`;
}

function resultHtml() {
  const r = practice.result;
  const problems = {
    silent: "Não ouvi a sua voz. Fale mais perto do microfone.",
    short: "A gravação ficou curta demais: fale a frase inteira.",
    long: "A gravação ficou bem mais longa que o modelo. Tente falar de uma vez.",
  };
  const cls = r.score >= GOOD ? "good" : r.score >= 60 ? "mid" : "low";
  return `<div class="card result ${cls}">
      <div class="ring"><b>${r.score}</b><span>de 100</span></div>
      <div><h3>${h(r.problem ? problems[r.problem] : label(r.score))}</h3>
        <p>${r.xp ? `+${r.xp} XP · ` : ""}modelo ${r.modelSeconds.toFixed(1)} s · você ${r.userSeconds.toFixed(1)} s</p></div>
    </div>
    <div class="card"><h3>Compare as duas falas</h3>
      <div class="compare"><span>Modelo</span>${wave(r.modelEnvelope, "model")}<button class="speak" data-act="speak-model" aria-label="Ouvir o modelo">🔊</button></div>
      <div class="compare"><span>Você</span>${wave(r.userEnvelope, "user")}<button class="speak" data-act="speak-mine" aria-label="Ouvir a minha gravação">▶</button></div>
      <p>Os desenhos mostram o volume ao longo da frase. Repare onde ficam as pausas e as sílabas fortes: quanto mais os dois se parecem, mais o seu ritmo está próximo do modelo.</p></div>`;
}

function drawPractice() {
  const s = byId.get(practice.id);
  const level = LEVELS.find((l) => l.id === s.level);
  const phase = practice.phase;
  const foot = {
    idle: `<button class="btn rec" data-act="speak-record" ${recorder.supported ? "" : "disabled"}>🎙️ ${practice.result ? "Gravar de novo" : "Gravar a minha voz"}</button>`,
    recording: `<button class="btn bad pulse" data-act="speak-stop">⏹ Parar a gravação</button>`,
    analyzing: `<button class="btn" disabled>Comparando…</button>`,
  }[phase];
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="speak" aria-label="Fechar">✕</button><h2 class="bar-title">${level.name} · ${h(level.title)}</h2></div>
    <div class="scroll">
      <div class="card phrase">${ipaHtml(s)}<p class="pt">${h(s.pt)}</p>
        <div class="listen-row"><button class="btn ghost" data-act="speak-model">🔊 Ouvir</button><button class="btn ghost" data-act="speak-model-slow">🐢 Devagar</button></div></div>
      ${practice.error ? `<div class="card warn"><p>${h(practice.error)}</p></div>` : ""}
      ${!recorder.supported ? `<div class="card warn"><p>Este navegador não permite gravar áudio. Você ainda pode ouvir e repetir.</p></div>` : ""}
      ${practice.result ? resultHtml() : `<p class="lead">Ouça o modelo, depois grave a frase. A linha de baixo de cada palavra mostra como ela soa.</p>`}
      ${historyHtml(s.id)}
      ${practice.result ? `<p class="small note">A nota mede o quanto a sua gravação se parece com a do modelo em ritmo e em sons. Serve para acompanhar a sua evolução na mesma frase; não substitui a avaliação de um professor, e ruído no ambiente derruba o resultado.</p>` : ""}
    </div>
    <div class="session-foot stack">${foot}${practice.result && phase === "idle" ? `<button class="btn ok" data-act="speak-next">Próxima frase</button>` : ""}</div>`,
    { showTabs: false },
  );
}

async function modelAudio(id) {
  if (!modelCache.has(id)) modelCache.set(id, await recorder.decode(await audio.fetchBytes(speakingFile(id))));
  return modelCache.get(id);
}

async function startRecording() {
  audio.stop();
  practice.error = "";
  const current = practice;
  try {
    await recorder.start();
  } catch (err) {
    practice.error = recorder.explain(err);
    return drawPractice();
  }
  if (practice !== current) return recorder.cancel();
  practice.phase = "recording";
  drawPractice();
  // Corta gravações esquecidas ligadas.
  setTimeout(() => practice === current && current.phase === "recording" && stopRecording(), MAX_SECONDS * 1000);
}

async function stopRecording() {
  if (practice?.phase !== "recording") return;
  const current = practice;
  current.phase = "analyzing";
  drawPractice();
  try {
    const blob = await recorder.stop();
    const [model, user] = await Promise.all([modelAudio(current.id), blob.arrayBuffer().then(recorder.decode)]);
    const result = compare(model, user);
    if (practice !== current) return;
    current.blob = blob;
    current.result = result;
    record(current.id, result);
  } catch (err) {
    if (practice !== current) return;
    current.error = `Não consegui analisar a gravação (${err?.message || err}). Tente de novo.`;
  }
  current.phase = "idle";
  drawPractice();
}

// Guarda a nota e aplica as recompensas: XP só até bater a meta do dia, para não virar atalho.
function record(id, result) {
  if (result.problem === "silent") return;
  const speak = app.state.speak;
  speak.history[id] = [...history(id), { t: Date.now(), score: result.score }].slice(-30);
  const counters = daily();
  counters.spoken++;
  if (result.score >= GOOD) counters.spokenGood++;
  if (counters.spoken <= speak.goal) {
    result.xp = game.XP.speak;
    addXp(result.xp);
  }
  save();
  effect(result.score >= GOOD ? "done" : result.score >= 60 ? "correct" : "tap");
  if (counters.spoken === speak.goal) toast("Meta de fala do dia batida! 🎙️");
}

Object.assign(actions, {
  "speak-level": (el) => {
    app.state.speak.level = el.dataset.level;
    save();
    showSpeak();
  },
  "speak-open": (el) => openPractice(el.dataset.id),
  "speak-next": () => openPractice(nextId(practice ? byId.get(practice.id).level : app.state.speak.level, practice?.id)),
  "speak-model": () => audio.play(speakingFile(practice.id)),
  "speak-model-slow": () => audio.play(speakingFile(practice.id), { slow: true }),
  "speak-mine": () => practice.blob && audio.playBlob(practice.blob),
  "speak-record": startRecording,
  "speak-stop": stopRecording,
});

tabViews.speak = () => {
  recorder.cancel();
  showSpeak();
};
