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

// As quatro respostas de um flashcard, como no Anki.
export const AGAIN = 1;
export const HARD = 2;
export const GOOD = 3;
export const EASY = 4;

// Devolve a frase com o novo agendamento, sem alterar o objeto recebido.
//   Errei:   volta para 1 dia e a facilidade cai 0,20 (a frase passa a crescer mais devagar)
//   Difícil: o intervalo cresce só 1,2x e a facilidade cai 0,15
//   Bom:     o intervalo é multiplicado pela facilidade
//   Fácil:   multiplica pela facilidade e por mais 1,3, e a facilidade sobe 0,15
export function rate(item, rating, now = Date.now()) {
  const today = dayStart(now);
  const next = { ...item, reps: item.reps + 1 };
  if (isNew(item)) {
    // Primeira vez: volta amanhã (ou em 3 dias, se foi fácil). A resposta já ajusta a facilidade.
    next.ivl = rating === EASY ? 3 : 1;
    next.ease = START_EASE + { [AGAIN]: -0.2, [HARD]: -0.15, [GOOD]: 0, [EASY]: 0.15 }[rating];
  } else if (rating === AGAIN) {
    next.lapses = item.lapses + 1;
    next.ease = Math.max(MIN_EASE, item.ease - 0.2);
    next.ivl = 1;
  } else {
    // Revisão atrasada e mesmo assim lembrada ganha bônus: a memória aguentou mais do que o previsto.
    const overdue = Math.max(0, Math.round((today - item.due) / DAY));
    const hard = Math.max(item.ivl + 1, Math.round(item.ivl * 1.2));
    const good = Math.max(hard + 1, Math.round((item.ivl + overdue / 2) * item.ease));
    const easy = Math.max(good + 1, Math.round((item.ivl + overdue) * item.ease * 1.3));
    if (rating === HARD) {
      next.ivl = hard;
      next.ease = Math.max(MIN_EASE, item.ease - 0.15);
    } else if (rating === EASY) {
      next.ivl = easy;
      next.ease = item.ease + 0.15;
    } else {
      next.ivl = good;
    }
  }
  next.due = addDays(today, next.ivl);
  return next;
}

// Forma de duas respostas, usada pelos exercícios: acertou conta como "Bom", errou como "Errei".
export function review(item, correct, now = Date.now()) {
  return rate(item, correct ? GOOD : AGAIN, now);
}

// Texto do intervalo que cada botão aplicaria, para mostrar embaixo dele.
export function intervalLabel(item, rating, now = Date.now()) {
  const days = rate(item || newItem(), rating, now).ivl;
  if (days < 30) return `${days} d`;
  const n = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
  return days < 365 ? `${n(days / 30)} mês` : `${n(days / 365)} a`;
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
