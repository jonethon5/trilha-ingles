// Regras do jogo: XP, níveis, sequência de dias e vidas. Só contas, sem tela nem armazenamento.

import { addDays } from "./srs.js";

export const HEARTS = 5;
export const REVIEW_SIZE = 10;

export const XP = { lesson: 10, review: 10, practice: 5, perfectBonus: 5 };

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

// Sequência depois de concluir uma sessão hoje. `streak` é { count, best, lastDay }.
export function streakAfter(streak, today) {
  if (streak.lastDay === today) return streak;
  const continued = streak.lastDay === addDays(today, -1);
  const count = continued ? streak.count + 1 : 1;
  return { count, best: Math.max(streak.best, count), lastDay: today };
}

// Sequência a mostrar agora: zera se o último dia de estudo foi antes de ontem.
export function currentStreak(streak, today) {
  if (streak.lastDay === today || streak.lastDay === addDays(today, -1)) return streak.count;
  return 0;
}

export function studiedToday(streak, today) {
  return streak.lastDay === today;
}
