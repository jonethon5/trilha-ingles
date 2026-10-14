// Repetição espaçada: decide quando cada frase volta para revisão.
// É o modelo SM-2 (o mesmo do Anki), reduzido a duas respostas: acertou ou errou.

export const DAY = 24 * 60 * 60 * 1000;
const ROLLOVER_HOUR = 4; // o dia de estudo vira às 4h
const START_EASE = 2.5;
const MIN_EASE = 1.3;
const MASTERED_IVL = 21; // dias de intervalo para considerar a frase dominada

export function dayStart(now = Date.now()) {
  const d = new Date(now);
  if (d.getHours() < ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
  d.setHours(ROLLOVER_HOUR, 0, 0, 0);
  return d.getTime();
}

export function addDays(start, days) {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function newItem() {
  return { ivl: 0, ease: START_EASE, due: 0, reps: 0, lapses: 0 };
}

export function isNew(item) {
  return !item || item.reps === 0;
}

export function isDue(item, now = Date.now()) {
  return !isNew(item) && item.due <= dayStart(now);
}

// Devolve a frase com o novo agendamento, sem alterar o objeto recebido.
export function review(item, correct, now = Date.now()) {
  const today = dayStart(now);
  const next = { ...item, reps: item.reps + 1 };
  if (isNew(item)) {
    // Primeira vez: volta amanhã. Quem errou começa com facilidade menor.
    next.ivl = 1;
    next.ease = correct ? START_EASE : START_EASE - 0.2;
  } else if (correct) {
    // Acerto: o intervalo cresce pela facilidade, com bônus se a revisão estava atrasada.
    const overdue = Math.max(0, Math.round((today - item.due) / DAY));
    next.ivl = Math.max(item.ivl + 1, Math.round((item.ivl + overdue / 2) * item.ease));
  } else {
    // Erro: recomeça em 1 dia e a frase fica marcada como mais difícil.
    next.lapses = item.lapses + 1;
    next.ease = Math.max(MIN_EASE, item.ease - 0.2);
    next.ivl = 1;
  }
  next.due = addDays(today, next.ivl);
  return next;
}

// Ids das frases com revisão vencida, da mais atrasada para a menos.
export function dueIds(items, now = Date.now()) {
  return Object.keys(items)
    .filter((id) => isDue(items[id], now))
    .sort((a, b) => items[a].due - items[b].due || a.localeCompare(b));
}

// Força de 0 a 4, usada para mostrar o quanto a frase está firme na memória.
export function strength(item) {
  if (isNew(item)) return 0;
  if (item.ivl < 3) return 1;
  if (item.ivl < 8) return 2;
  if (item.ivl < MASTERED_IVL) return 3;
  return 4;
}

export function isMastered(item) {
  return strength(item) === 4;
}

// Quantas revisões vencem em cada um dos próximos dias (o primeiro inclui as atrasadas).
export function forecast(items, now = Date.now(), days = 7) {
  const today = dayStart(now);
  const counts = new Array(days).fill(0);
  for (const item of Object.values(items)) {
    if (isNew(item)) continue;
    const offset = Math.max(0, Math.round((item.due - today) / DAY));
    if (offset < days) counts[offset]++;
  }
  return counts;
}
