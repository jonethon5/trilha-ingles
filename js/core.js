// Núcleo compartilhado pelas telas: estado, conteúdo indexado e utilidades de interface.

import { COURSE, flatLessons } from "./course.js";
import * as srs from "./srs.js";
import * as game from "./game.js";
import * as ex from "./exercise.js";
import * as store from "./store.js";
import * as audio from "./audio.js";
import { sentenceFile, wordFile } from "./audio-paths.js";

export const $ = (sel, el = document) => el.querySelector(sel);
export const h = (text) => String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const view = $("#view");
const tabs = $("#tabs");

// `app.state` é o progresso salvo; o resto é estado de tela, que não vai para o armazenamento.
export const app = { state: store.load(), tab: "learn", session: null };

// Cada tela registra aqui as suas ações; o atributo data-act dos botões diz qual chamar.
export const actions = {};
export const tabViews = {};

export const lessons = flatLessons(COURSE);
export const units = COURSE.units.map((unit, index) => ({
  ...unit,
  index,
  lessons: lessons.filter((l) => l.unitIndex === index),
  reviewId: `${unit.id}-review`,
}));

const UNIT_COLORS = [
  ["#5b4fe0", "#4337b8"],
  ["#e0562f", "#b03d1b"],
  ["#1f9d55", "#167a41"],
  ["#d6408a", "#a82c69"],
  ["#2a8fd6", "#1b6ca6"],
  ["#c98a12", "#9a6808"],
  ["#7a52cc", "#5b38a3"],
  ["#1aa39a", "#107a73"],
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
  for (const s of app.state.custom) byId.set(s.id, { ...s, alts: [], audio: null, custom: true });
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

// Frases cadastradas pelo usuário que ainda não entraram na revisão.
export function freshCustom() {
  return app.state.custom.filter((s) => srs.isNew(app.state.items[s.id])).map((s) => s.id);
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
  for (const btn of tabs.querySelectorAll("button")) btn.classList.toggle("on", btn.dataset.tab === app.tab);
}

export const tabsVisible = () => !tabs.hidden;

export function openTab(name = app.tab) {
  app.tab = name;
  app.session = null;
  audio.stop();
  tabViews[name]();
}

export function barHtml(fraction, cls = "") {
  const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return `<div class="bar ${cls}"><i style="width:${pct}%"></i></div>`;
}

// Barra do topo, no estilo dos apps de idiomas: curso, sequência, gemas e vidas.
export function topBar() {
  const today = srs.dayStart();
  const streak = game.currentStreak(app.state.streak, today, app.state.freezes);
  const lit = game.studiedToday(app.state.streak, today);
  return `<header class="top">
    <span class="flag" title="Curso de inglês">🇺🇸</span>
    <button class="stat ${lit ? "" : "off"}" data-act="tab" data-tab="quests" aria-label="Sequência de ${streak} dias">🔥 <b>${streak}</b></button>
    <button class="stat gems" data-act="shop" aria-label="${app.state.gems} gemas">💎 <b>${app.state.gems}</b></button>
    <button class="stat hearts" data-act="shop" aria-label="${hearts().count} vidas">❤️ <b>${hearts().count}</b></button>
  </header>`;
}

export function titleBar(title, subtitle = "") {
  return `<header class="top titled"><div><h1>${h(title)}</h1>${subtitle ? `<p>${h(subtitle)}</p>` : ""}</div>
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

export { srs, game, ex, store, audio };
