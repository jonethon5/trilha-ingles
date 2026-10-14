// Aba Missões: as três missões do dia, a sequência e a meta diária.

import { h, app, actions, tabViews, show, save, titleBar, barHtml, daily, effect, toast, srs, game } from "../core.js";

function timeLeft() {
  const ms = srs.addDays(srs.dayStart(), 1) - Date.now();
  const hours = Math.floor(ms / 3600000);
  return hours >= 1 ? `${hours} h` : `${Math.max(1, Math.ceil(ms / 60000))} min`;
}

function questCard(quest, counters) {
  const { value, done, claimed } = game.questStatus(quest, counters);
  const action = claimed
    ? `<span class="claimed">✓ Coletado</span>`
    : done
      ? `<button class="btn ok small-btn" data-act="claim" data-key="${quest.key}">Coletar +${quest.reward} 💎</button>`
      : `<span class="reward">🎁 ${quest.reward} 💎</span>`;
  return `<div class="card quest ${claimed ? "muted" : ""}"><span class="q-icon">${quest.icon}</span>
    <div><h3>${h(quest.text)}</h3><div class="goal">${barHtml(value / quest.target)}<span class="small">${value} / ${quest.target}</span></div></div>${action}</div>`;
}

function showQuests() {
  const state = app.state;
  const today = srs.dayStart();
  const counters = daily();
  const quests = game.dailyQuests(today);
  const streak = game.currentStreak(state.streak, today, state.freezes);
  const dots = game
    .weekDots(state.streak, today)
    .map((d) => `<div class="${d.done ? "done" : ""} ${d.today ? "today" : ""}"><span>${d.label}</span><i>${d.done ? "✓" : ""}</i></div>`)
    .join("");
  const studied = game.studiedToday(state.streak, today);
  show(`${titleBar("Missões", `Novas em ${timeLeft()}`)}<div class="scroll">
    <p class="section-title">Missões do dia</p>
    ${quests.map((q) => questCard(q, counters)).join("")}
    <p class="section-title">Sequência</p>
    <div class="card streak-card"><div class="row plain"><h2>🔥 ${streak} ${streak === 1 ? "dia" : "dias"}</h2><span class="small">recorde: ${state.streak.best}</span></div>
      <div class="week">${dots}</div>
      <p>${studied ? "Você já estudou hoje. A sequência está garantida." : streak ? "Conclua uma sessão hoje para não perder a sequência." : "Conclua uma sessão para começar uma sequência."}${state.freezes ? ` Você tem ${state.freezes} 🧊 de proteção.` : ""}</p></div>
    <p class="section-title">Meta diária</p>
    <div class="card"><div class="goal"><span>${counters.xp >= state.goal ? "🏆" : "🎯"}</span>${barHtml(counters.xp / state.goal)}<span class="small">${counters.xp} / ${state.goal} XP</span></div></div>
  </div>`);
}

function claim(key) {
  const today = srs.dayStart();
  const counters = daily();
  const quest = game.dailyQuests(today).find((q) => q.key === key);
  const status = quest && game.questStatus(quest, counters);
  if (!status?.done || status.claimed) return;
  counters.claimed.push(key);
  app.state.gems += quest.reward;
  save();
  effect("done");
  toast(`+${quest.reward} 💎`);
  showQuests();
}

Object.assign(actions, { claim: (el) => claim(el.dataset.key) });

tabViews.quests = showQuests;
