// Núcleo compartilhado pelas telas: estado, conteúdo indexado e utilidades de interface.

import { COURSE, flatLessons } from "./course.js";
import * as srs from "./srs.js";
import * as game from "./game.js";
import * as ex from "./exercise.js";
import * as store from "./store.js";
import * as audio from "./audio.js";
import { contextFile, sentenceFile, wordFile } from "./audio-paths.js";
import { WORDS } from "./words.js";
import * as fx from "./fx.js";

export const $ = (sel, el = document) => el.querySelector(sel);
export const h = (text) => String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const view = $("#view");
const tabs = $("#tabs");

// `app.state` é o progresso salvo; o resto é estado de tela, que não vai para o armazenamento.
export const app = { state: store.load(), tab: "learn", session: null };

// Cada tela registra aqui as suas ações; o atributo data-act dos botões diz qual chamar.
export const actions = {};
export const tabViews = {};
// Ganchos opcionais: afterTab(nome) roda depois de desenhar uma aba; leaveTabs() ao sair delas.
export const hooks = { afterTab: null, leaveTabs: null };

export const lessons = flatLessons(COURSE);
export const units = COURSE.units.map((unit, index) => ({
  ...unit,
  index,
  lessons: lessons.filter((l) => l.unitIndex === index),
  reviewId: `${unit.id}-review`,
}));

const UNIT_COLORS = [
  ["#58cc02", "#58a700"],
  ["#ce82ff", "#a568cc"],
  ["#1cb0f6", "#1899d6"],
  ["#ff9600", "#e07a00"],
  ["#ff4b4b", "#ea2b2b"],
  ["#00cd9c", "#00a47d"],
  ["#ff86d0", "#e06bb3"],
  ["#2b70c9", "#1f57a0"],
];
export const unitColor = (index) => UNIT_COLORS[index % UNIT_COLORS.length];

// ---------- Conteúdo ----------

export const byId = new Map();
let wordPoolCache = null;

export function indexContent() {
  byId.clear();
  wordPoolCache = null;
  for (const lesson of lessons) {
    for (const s of lesson.sentences) {
      const file = sentenceFile(s.id);
      s.audio = audio.has(file) ? file : null;
      byId.set(s.id, s);
    }
  }
  for (const word of WORDS) {
    for (const card of word.cards) {
      const file = contextFile(card.id);
      card.audio = audio.has(file) ? file : null;
      card.alts = [];
      byId.set(card.id, card);
    }
  }
  for (const s of app.state.custom) byId.set(s.id, { ...s, alts: [], audio: s.audio && audio.has(s.audio) ? s.audio : null, custom: true });
}

export const allSentences = () => [...byId.values()];

// Palavras erradas do banco saem de todas as frases conhecidas.
export function wordPool() {
  wordPoolCache ??= ex.wordPool(allSentences());
  return wordPoolCache;
}

// ---------- Estado ----------

export function save() {
  store.save(app.state);
}

export function replaceState(next) {
  app.state = next;
  save();
  indexContent();
}

// Contadores do dia; zeram sozinhos quando o dia de estudo vira.
export function daily() {
  const today = srs.dayStart();
  if (app.state.daily.day !== today) app.state.daily = game.newDaily(today);
  return app.state.daily;
}

export function hearts() {
  return game.heartsNow(app.state.hearts);
}

export function dueIds() {
  return srs.dueIds(app.state.items).filter((id) => byId.has(id));
}

const seen = (id) => !srs.isNew(app.state.items[id]);

// Palavras do baralho cujas cinco frases já foram vistas.
export function wordsLearned() {
  return WORDS.filter((word) => word.cards.every((card) => seen(card.id))).length;
}

export function customUnlocked() {
  return game.customUnlocked(wordsLearned(), app.state.profile.skill);
}

// Os cartões de hoje: os que venceram e os novos. Novos são as frases das palavras do dia
// (até o limite de palavras por dia do plano), mais os cartões próprios ainda não vistos.
// Palavra começada em outro dia e não terminada entra sempre, sem gastar o limite.
export function todayCards() {
  const state = app.state;
  const today = srs.dayStart();
  let budget = state.profile.wordsPerDay - Object.values(state.words).filter((day) => day === today).length;
  const fresh = [];
  const newWords = [];
  for (const word of WORDS) {
    const unseen = word.cards.filter((card) => !seen(card.id));
    if (!unseen.length) continue;
    if (!(word.id in state.words)) {
      if (budget <= 0) continue;
      budget--;
      newWords.push(word.id);
    }
    fresh.push(...unseen.map((card) => card.id));
  }
  for (const s of state.custom) if (!seen(s.id)) fresh.push(s.id);
  return { due: dueIds(), fresh, newWords };
}

// Soma XP e devolve as recompensas que isso gerou.
export function addXp(amount) {
  const before = game.levelInfo(app.state.xp).level;
  app.state.xp += amount;
  daily().xp += amount;
  const level = game.levelInfo(app.state.xp).level;
  const levelUp = level > before;
  if (levelUp) app.state.gems += game.LEVEL_UP_GEMS;
  return { levelUp, level };
}

// Só mexe no agendamento de frase nova ou com revisão vencida; praticar fora de hora não adianta a data.
export function schedule(id, correct) {
  const item = app.state.items[id] || srs.newItem();
  if (srs.isNew(item) || srs.isDue(item)) app.state.items[id] = srs.review(item, correct);
}

// ---------- Som ----------

export function say(sentence, slow = false) {
  if (!app.state.settings.sound) return;
  if (sentence.audio) audio.play(sentence.audio, { slow });
  else audio.synthesize(sentence.en, { slow });
}

export function sayWord(word) {
  if (!app.state.settings.sound) return;
  const file = wordFile(word);
  if (audio.has(file)) audio.play(file);
}

export function playFile(file) {
  if (app.state.settings.sound && audio.has(file)) audio.play(file);
}

// Exercício de ouvir só entra para frases com gravação: a voz sintética do aparelho não é confiável.
export function canListen(sentence) {
  return app.state.settings.sound && Boolean(sentence.audio);
}

export function effect(name) {
  if (app.state.settings.effects) audio.effect(name);
}

// ---------- Interface ----------

export function toast(message, ms = 2400) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), ms);
}

export function show(html, { showTabs = true } = {}) {
  view.innerHTML = html;
  tabs.hidden = !showTabs;
  if (!showTabs) hooks.leaveTabs?.();
  for (const btn of tabs.querySelectorAll("button")) btn.classList.toggle("on", btn.dataset.tab === app.tab);
}

export const tabsVisible = () => !tabs.hidden;

export function openTab(name = app.tab) {
  app.tab = name;
  app.session = null;
  audio.stop();
  tabViews[name]();
  fx.enter(view.querySelector(".scroll"), { duration: 200 });
  hooks.afterTab?.(name);
}

export function barHtml(fraction, cls = "") {
  const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return `<div class="bar ${cls}"><i style="width:${pct}%"></i></div>`;
}

// Atalho para as missões do dia, com um aviso quando há recompensa para coletar.
function questsButton() {
  const counters = daily();
  const ready = game.dailyQuests(srs.dayStart()).filter((q) => {
    const status = game.questStatus(q, counters);
    return status.done && !status.claimed;
  }).length;
  return `<button class="stat quests ${ready ? "ready" : ""}" data-act="tab" data-tab="quests" aria-label="Missões do dia">🎯${ready ? ` <b>${ready}</b>` : ""}</button>`;
}

// Barra do topo, no estilo dos apps de idiomas: curso, sequência, missões, gemas e vidas.
export function topBar() {
  const today = srs.dayStart();
  const streak = game.currentStreak(app.state.streak, today, app.state.freezes);
  const lit = game.studiedToday(app.state.streak, today);
  return `<header class="top">
    <span class="flag" title="Curso de inglês">🇺🇸</span>
    <button class="stat ${lit ? "" : "off"}" data-act="tab" data-tab="quests" aria-label="Sequência de ${streak} dias">🔥 <b>${streak}</b></button>
    ${questsButton()}
    <button class="stat gems" data-act="shop" aria-label="${app.state.gems} gemas">💎 <b>${app.state.gems}</b></button>
    <button class="stat hearts" data-act="shop" aria-label="${hearts().count} vidas">❤️ <b>${hearts().count}</b></button>
  </header>`;
}

export function titleBar(title, subtitle = "") {
  return `<header class="top titled"><div><h1>${h(title)}</h1>${subtitle ? `<p>${h(subtitle)}</p>` : ""}</div>
    ${questsButton()}
    <button class="stat gems" data-act="shop">💎 <b>${app.state.gems}</b></button>
    <button class="stat hearts" data-act="shop">❤️ <b>${hearts().count}</b></button></header>`;
}

// Bolinhas de força (0 a 4) de uma frase na memória.
export function strengthDots(id) {
  const level = srs.strength(app.state.items[id]);
  return `<span class="dots" title="Força ${level} de 4">${[1, 2, 3, 4].map((n) => `<i class="${n <= level ? "on" : ""}"></i>`).join("")}</span>`;
}

export function dueLabel(id) {
  const item = app.state.items[id];
  if (srs.isNew(item)) return "nova";
  const days = Math.round((item.due - srs.dayStart()) / srs.DAY);
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export { srs, game, ex, store, audio, fx };
