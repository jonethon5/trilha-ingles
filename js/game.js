// Regras do jogo: XP, níveis, vidas, gemas, sequência, missões e conquistas.
// Só contas: nada aqui mexe na tela nem no armazenamento.

import { addDays, DAY } from "./srs.js";

export const MAX_HEARTS = 5;
export const HEART_REGEN = 4 * 60 * 60 * 1000; // uma vida volta a cada 4 horas
export const REVIEW_SIZE = 10;

export const XP = { lesson: 10, practice: 5, unit: 20, review: 10, speak: 5, perfectBonus: 5 };
export const SHOP = { refill: { cost: 40 }, freeze: { cost: 30, max: 2 } };
export const CHEST_GEMS = 20;
export const LEVEL_UP_GEMS = 10;

// ---------- Plano de estudo (vem das respostas da primeira abertura) ----------

export const REASONS = [
  { id: "work", icon: "💼", text: "Trabalho e carreira" },
  { id: "travel", icon: "✈️", text: "Viajar" },
  { id: "study", icon: "🎓", text: "Estudos" },
  { id: "people", icon: "💬", text: "Conversar com pessoas" },
  { id: "fun", icon: "🎬", text: "Filmes, séries e jogos" },
  { id: "self", icon: "🌱", text: "Desenvolvimento pessoal" },
];

// Cada nível declarado define em que unidade a trilha começa e o nível inicial do treino de fala.
export const SKILLS = [
  { id: "a1", icon: "🌱", text: "Estou começando do zero", startUnit: 0 },
  { id: "a2", icon: "🙂", text: "Sei palavras e frases soltas", startUnit: 2 },
  { id: "b1", icon: "😀", text: "Consigo conversas simples", startUnit: 4 },
  { id: "b2", icon: "😎", text: "Falo sobre vários assuntos", startUnit: 6 },
];

// Quanto tempo a pessoa tem por dia define a meta de XP, as palavras novas e as frases de fala.
export const PACES = [
  { minutes: 5, name: "Casual", goal: 10, wordsPerDay: 1, speakGoal: 1 },
  { minutes: 10, name: "Regular", goal: 20, wordsPerDay: 2, speakGoal: 3 },
  { minutes: 15, name: "Sério", goal: 30, wordsPerDay: 3, speakGoal: 5 },
  { minutes: 20, name: "Intenso", goal: 50, wordsPerDay: 4, speakGoal: 5 },
];

export function planFor(minutes, skill) {
  const pace = PACES.find((p) => p.minutes === minutes) || PACES[1];
  const level = SKILLS.find((s) => s.id === skill) || SKILLS[0];
  return { goal: pace.goal, wordsPerDay: pace.wordsPerDay, speakGoal: pace.speakGoal, startUnit: level.startUnit, speakLevel: level.id };
}

// Cartões próprios liberam depois de uma base de palavras, ou de cara para quem já tem nível.
export const CUSTOM_UNLOCK_WORDS = 20;

export function customUnlocked(wordsLearned, skill) {
  return wordsLearned >= CUSTOM_UNLOCK_WORDS || skill === "b1" || skill === "b2";
}

// ---------- XP e níveis ----------

// XP total necessário para ALCANÇAR um nível: 0, 100, 300, 600, 1000...
export function xpForLevel(level) {
  return 50 * level * (level - 1);
}

export function levelInfo(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return { level, into: xp - floor, span: ceil - floor };
}

export function sessionXp(kind, mistakes) {
  return XP[kind] + (mistakes === 0 ? XP.perfectBonus : 0);
}

// ---------- Vidas ----------

// Vidas disponíveis agora, contando as que voltaram com o tempo. `hearts` é { count, since }.
export function heartsNow(hearts, now = Date.now()) {
  if (hearts.count >= MAX_HEARTS) return { count: MAX_HEARTS, since: now, nextIn: 0 };
  const regained = Math.floor((now - hearts.since) / HEART_REGEN);
  const count = Math.min(MAX_HEARTS, hearts.count + regained);
  if (count >= MAX_HEARTS) return { count: MAX_HEARTS, since: now, nextIn: 0 };
  const since = hearts.since + regained * HEART_REGEN;
  return { count, since, nextIn: since + HEART_REGEN - now };
}

export function loseHeart(hearts, now = Date.now()) {
  const cur = heartsNow(hearts, now);
  // O relógio da recarga começa quando se perde a primeira vida.
  return { count: Math.max(0, cur.count - 1), since: cur.count >= MAX_HEARTS ? now : cur.since };
}

export function gainHearts(hearts, amount, now = Date.now()) {
  const cur = heartsNow(hearts, now);
  return { count: Math.min(MAX_HEARTS, cur.count + amount), since: cur.since };
}

export function formatWait(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

// ---------- Sequência de dias ----------

// Sequência depois de concluir uma sessão hoje. Um dia perdido é coberto por um bloqueio, se houver.
export function streakAfter(streak, today, freezes = 0) {
  if (streak.lastDay === today) return { streak, usedFreeze: false };
  const yesterday = addDays(today, -1);
  const missedOne = streak.lastDay === addDays(today, -2) && freezes > 0 && streak.count > 0;
  const count = streak.lastDay === yesterday || missedOne ? streak.count + 1 : 1;
  return { streak: { count, best: Math.max(streak.best, count), lastDay: today }, usedFreeze: missedOne };
}

// Sequência a mostrar agora: zera se o último dia de estudo ficou para trás sem bloqueio para cobrir.
export function currentStreak(streak, today, freezes = 0) {
  if (streak.lastDay === today || streak.lastDay === addDays(today, -1)) return streak.count;
  if (streak.lastDay === addDays(today, -2) && freezes > 0) return streak.count;
  return 0;
}

export function studiedToday(streak, today) {
  return streak.lastDay === today;
}

// Os 7 dias da semana atual (domingo a sábado), marcando os que fazem parte da sequência.
export function weekDots(streak, today) {
  const count = currentStreak(streak, today, 1);
  const first = addDays(streak.lastDay, -(streak.count - 1));
  const sunday = addDays(today, -new Date(today).getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(sunday, i);
    return { label: "DSTQQSS"[i], today: day === today, done: count > 0 && day >= first && day <= streak.lastDay };
  });
}

// ---------- Missões do dia ----------

export function newDaily(day) {
  return { day, xp: 0, sessions: 0, perfect: 0, combo: 0, reviewed: 0, spoken: 0, spokenGood: 0, claimed: [] };
}

const QUESTS = [
  { key: "xp", icon: "⚡", targets: [20, 30, 40], reward: 10, text: (n) => `Ganhe ${n} XP` },
  { key: "sessions", icon: "📘", targets: [2, 3], reward: 10, text: (n) => `Conclua ${n} sessões` },
  { key: "combo", icon: "🎯", targets: [5, 8], reward: 5, text: (n) => `Acerte ${n} exercícios seguidos` },
  { key: "perfect", icon: "🏆", targets: [1], reward: 10, text: () => "Conclua 1 sessão sem erros" },
  { key: "reviewed", icon: "🔁", targets: [10], reward: 10, text: (n) => `Revise ${n} frases` },
  { key: "spoken", icon: "🎙️", targets: [3, 5], reward: 5, text: (n) => `Treine a fala ${n} vezes` },
  { key: "spokenGood", icon: "🗣️", targets: [1], reward: 10, text: () => "Tire 75 ou mais em uma frase falada" },
];

function seeded(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

// Três missões por dia: a de XP sempre, mais duas sorteadas. O sorteio depende só da data,
// então o mesmo dia mostra sempre as mesmas missões.
export function dailyQuests(day) {
  const random = seeded(Math.round(day / DAY));
  const pick = (list) => list[Math.floor(random() * list.length)];
  const rest = QUESTS.slice(1);
  const first = pick(rest);
  const second = pick(rest.filter((q) => q !== first));
  return [QUESTS[0], first, second].map((q) => {
    const target = pick(q.targets);
    return { key: q.key, icon: q.icon, target, reward: q.reward, text: q.text(target) };
  });
}

export function questStatus(quest, daily) {
  const value = Math.min(quest.target, daily[quest.key] || 0);
  return { value, done: value >= quest.target, claimed: daily.claimed.includes(quest.key) };
}

// ---------- Conquistas ----------

const ACHIEVEMENTS = [
  { key: "streak", icon: "🔥", name: "Em chamas", tiers: [3, 7, 30, 100], text: (n) => `Sequência de ${n} dias` },
  { key: "xp", icon: "⚡", name: "Energia", tiers: [100, 500, 1000, 5000], text: (n) => `Ganhe ${n} XP` },
  { key: "lessons", icon: "📘", name: "Estudioso", tiers: [3, 10, 24], text: (n) => `Conclua ${n} lições` },
  { key: "mastered", icon: "🧠", name: "Memória de elefante", tiers: [10, 50, 150], text: (n) => `Domine ${n} frases` },
  { key: "spoken", icon: "🎙️", name: "Voz ativa", tiers: [10, 50, 200], text: (n) => `Grave ${n} frases` },
  { key: "custom", icon: "✍️", name: "Colecionador", tiers: [5, 20, 50], text: (n) => `Cadastre ${n} frases suas` },
];

// `stats` traz um número para cada chave: { streak, xp, lessons, mastered, spoken, custom }.
export function achievements(stats) {
  return ACHIEVEMENTS.map((a) => {
    const value = stats[a.key] || 0;
    const tier = a.tiers.filter((t) => value >= t).length;
    const target = a.tiers[Math.min(tier, a.tiers.length - 1)];
    return { key: a.key, icon: a.icon, name: a.name, tier, maxTier: a.tiers.length, value: Math.min(value, target), target, text: a.text(target) };
  });
}
