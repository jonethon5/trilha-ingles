// Aba Sons: as vogais e consoantes do inglês em uma grade. Tocar em um som toca a palavra de exemplo
// e abre a ficha dele. Há também um treino de ouvido com pares de palavras parecidas.

import { $, h, app, actions, tabViews, show, save, titleBar, openTab, effect, audio, ex, fx } from "../core.js";
import { SOUND_GROUPS, STRESS_MARKS, MINIMAL_PAIRS, extras } from "../ipa.js";
import { wordFile } from "../audio-paths.js";
import { owl } from "../owl.js";
import { complete } from "./session.js";

const ROUNDS = 8;

const play = (word, slow = false) => audio.has(wordFile(word)) && audio.play(wordFile(word), { slow });

function tile(groupIndex, soundIndex) {
  const [symbol, word] = SOUND_GROUPS[groupIndex].sounds[soundIndex];
  const heard = app.state.sounds[symbol];
  return `<button class="sound-tile ${heard ? "heard" : ""}" data-act="sound-open" data-g="${groupIndex}" data-i="${soundIndex}">
    <b>${h(symbol)}</b><span lang="en">${h(word)}</span></button>`;
}

function showSounds() {
  const total = SOUND_GROUPS.reduce((sum, g) => sum + g.sounds.length, 0);
  const heard = SOUND_GROUPS.reduce((sum, g) => sum + g.sounds.filter(([symbol]) => app.state.sounds[symbol]).length, 0);
  const groups = SOUND_GROUPS.map(
    (group, g) => `<p class="section-title">${h(group.title)}</p><p class="lead">${h(group.note)}</p>
      <div class="sound-grid">${group.sounds.map((_, i) => tile(g, i)).join("")}</div>`,
  ).join("");
  const stress = STRESS_MARKS.map(
    ([symbol, word, ipa, tip]) => `<button class="sound" data-act="sound-word" data-word="${h(word)}"><b class="symbol">${h(symbol)}</b>
      <div><span lang="en"><b>${h(word)}</b> <i>/${h(ipa)}/</i></span><small>${h(tip)}</small></div><span>🔊</span></button>`,
  ).join("");
  show(`${titleBar("Sons", `${heard} de ${total} sons ouvidos`)}<div class="scroll">
    <div class="card hero"><div class="talk">${owl("normal", 88)}<div class="bubble"><p><b>Vamos aprender os sons do inglês!</b> Toque em um som para ouvir a palavra em que ele aparece.</p></div></div>
      <button class="btn" data-act="sound-quiz">Treinar o ouvido · +5 XP</button></div>
    ${groups}
    <p class="section-title">Sinais de acento</p><p class="lead">Em inglês, errar a sílaba forte atrapalha mais do que errar um som.</p>
    <div class="card list">${stress}</div></div>`);
}

// ---------- Ficha de um som ----------

function closeSheet() {
  $(".sheet")?.remove();
}

function openSound(groupIndex, soundIndex) {
  closeSheet();
  const sound = SOUND_GROUPS[groupIndex].sounds[soundIndex];
  const [symbol, word, ipa, tip] = sound;
  const examples = [word, ...extras(sound)]
    .map((w) => `<button class="chip" data-act="sound-word" data-word="${h(w)}" lang="en">🔊 ${h(w)}</button>`)
    .join("");
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.innerHTML = `<div class="sheet-back" data-act="sound-close"></div><div class="sheet-box">
    <div class="sheet-head"><b class="symbol big">${h(symbol)}</b><div><h3 lang="en">${h(word)} <i>/${h(ipa)}/</i></h3><p>${h(tip)}</p></div></div>
    <p class="section-title">Ouça em outras palavras</p><div class="bank left">${examples}</div>
    <div class="listen-row"><button class="btn ghost" data-act="sound-word" data-word="${h(word)}" data-slow="1">🐢 Devagar</button><button class="btn" data-act="sound-close">Fechar</button></div></div>`;
  document.querySelector("#view").append(sheet);
  fx.enter(sheet.querySelector(".sheet-box"), { from: "translateY(100%)", duration: 240 });
  play(word);
  if (!app.state.sounds[symbol]) {
    app.state.sounds[symbol] = true;
    save();
    document.querySelector(`.sound-tile[data-g="${groupIndex}"][data-i="${soundIndex}"]`)?.classList.add("heard");
    // Atualiza a contagem do topo sem redesenhar a tela, para a ficha continuar aberta.
    const counter = document.querySelector(".top p");
    if (counter) counter.textContent = counter.textContent.replace(/^\d+/, String(Object.keys(app.state.sounds).length));
  }
}

// ---------- Treino de ouvido ----------

let quiz = null;

function startQuiz() {
  const pairs = ex.sample(MINIMAL_PAIRS, ROUNDS);
  quiz = {
    rounds: pairs.map(([a, b, what]) => ({ options: [a, b], answer: Math.random() < 0.5 ? a : b, what })),
    index: 0,
    mistakes: 0,
    picked: null,
    startedAt: Date.now(),
  };
  app.session = { back: () => openTab("sounds") };
  drawQuiz();
  play(quiz.rounds[0].answer);
}

function drawQuiz() {
  const round = quiz.rounds[quiz.index];
  const answered = quiz.picked !== null;
  const options = round.options
    .map((w) => {
      const state = !answered ? "" : w === round.answer ? "right" : w === quiz.picked ? "wrong" : "";
      return `<button class="ear-option ${state}" data-act="sound-pick" data-word="${h(w)}" lang="en" ${answered ? "disabled" : ""}>${h(w)}</button>`;
    })
    .join("");
  const ok = quiz.picked === round.answer;
  const foot = answered
    ? `<div class="session-foot ${ok ? "ok" : "bad"}"><div class="feedback"><span class="mark">${ok ? "✓" : "✕"}</span><div><h3>${ok ? "Isso mesmo!" : `Era "${h(round.answer)}"`}</h3><p class="small">A diferença está em: ${h(round.what)}. Toque nas palavras para comparar.</p></div></div>
        <button class="btn ${ok ? "ok" : "bad"}" data-act="sound-next">Continuar</button></div>`
    : `<div class="session-foot"><button class="btn" disabled>Escolha a palavra que você ouviu</button></div>`;
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="sounds" aria-label="Sair">✕</button><div class="bar green"><i style="width:${Math.round((quiz.index / ROUNDS) * 100)}%"></i></div></div>
    <div class="exercise"><h2 class="instruction">Qual palavra você ouviu?</h2>
      <div class="listen">${owl("normal", 96)}<button class="speak" data-act="sound-replay" aria-label="Ouvir">🔊</button><button class="speak slow" data-act="sound-replay" data-slow="1" aria-label="Ouvir devagar">🐢</button></div>
      <div class="ear-options">${options}</div>
      ${answered ? `<div class="listen-row">${round.options.map((w) => `<button class="btn ghost" data-act="sound-word" data-word="${h(w)}" lang="en">🔊 ${h(w)}</button>`).join("")}</div>` : ""}
    </div>${foot}`,
    { showTabs: false },
  );
  if (answered) {
    fx.enter($(".session-foot"), { from: "translateY(100%)", duration: 240 });
    if (!ok) fx.shake($(".ear-options"));
  }
}

function pick(word) {
  const round = quiz.rounds[quiz.index];
  quiz.picked = word;
  const ok = word === round.answer;
  if (!ok) quiz.mistakes++;
  effect(ok ? "correct" : "wrong");
  drawQuiz();
}

function nextRound() {
  quiz.index++;
  quiz.picked = null;
  if (quiz.index >= ROUNDS) {
    return complete({ kind: "sounds", mistakes: quiz.mistakes, total: ROUNDS, startedAt: quiz.startedAt, back: () => openTab("sounds") });
  }
  drawQuiz();
  fx.enter($(".exercise"), { from: "translateX(28px)" });
  play(quiz.rounds[quiz.index].answer);
}

Object.assign(actions, {
  "sound-open": (el) => openSound(Number(el.dataset.g), Number(el.dataset.i)),
  "sound-close": closeSheet,
  "sound-word": (el) => play(el.dataset.word, Boolean(el.dataset.slow)),
  "sound-quiz": startQuiz,
  "sound-replay": (el) => play(quiz.rounds[quiz.index].answer, Boolean(el.dataset.slow)),
  "sound-pick": (el) => pick(el.dataset.word),
  "sound-next": nextRound,
});

tabViews.sounds = showSounds;
