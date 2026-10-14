// Aba Perfil: números gerais, conquistas, ajustes e backup.

import { $, h, app, actions, tabViews, show, save, toast, titleBar, barHtml, byId, replaceState, lessons, srs, game, store, audio } from "../core.js";
import { sentenceFile } from "../audio-paths.js";
import { startOnboarding } from "./onboard.js";

function stats() {
  const state = app.state;
  const items = Object.entries(state.items).filter(([id]) => byId.has(id));
  return {
    streak: state.streak.best,
    xp: state.xp,
    lessons: lessons.filter((l) => state.lessonsDone[l.id]).length,
    learned: items.filter(([, item]) => !srs.isNew(item)).length,
    mastered: items.filter(([, item]) => srs.isMastered(item)).length,
    spoken: Object.values(state.speak.history).reduce((sum, list) => sum + list.length, 0),
    custom: state.custom.length,
  };
}

function planText() {
  const { profile, goal, speak } = app.state;
  const pace = game.PACES.find((p) => p.minutes === profile.minutes);
  const skill = game.SKILLS.find((s) => s.id === profile.skill);
  return `${profile.minutes} minutos por dia (ritmo ${pace.name.toLowerCase()}), nível "${skill.text.toLowerCase()}": meta de ${goal} XP, ${profile.wordsPerDay} ${profile.wordsPerDay === 1 ? "palavra nova" : "palavras novas"} e ${speak.goal} ${speak.goal === 1 ? "frase falada" : "frases faladas"} por dia.`;
}

function showProfile() {
  const state = app.state;
  const today = srs.dayStart();
  const level = game.levelInfo(state.xp);
  const numbers = stats();
  const badges = game
    .achievements(numbers)
    .map(
      (a) => `<div class="achievement ${a.tier ? "" : "locked"}"><span class="a-icon">${a.icon}<em>${a.tier}/${a.maxTier}</em></span>
        <div><h3>${h(a.name)}</h3><p>${h(a.text)}</p><div class="goal">${barHtml(a.value / a.target)}<span class="small">${a.value} / ${a.target}</span></div></div></div>`,
    )
    .join("");
  const goals = [10, 20, 30, 50].map((g) => `<option value="${g}" ${g === state.goal ? "selected" : ""}>${g} XP</option>`).join("");
  show(`${titleBar("Perfil", `Nível ${level.level}`)}<div class="scroll">
    <div class="card"><div class="row plain"><h3>Nível ${level.level}</h3><span class="small">${level.into} / ${level.span} XP</span></div>
      <div style="margin-top:10px">${barHtml(level.into / level.span, "primary")}</div></div>
    <p class="section-title">Estatísticas</p>
    <div class="grid">
      <div><b>🔥 ${game.currentStreak(state.streak, today, state.freezes)}</b><span>Sequência atual</span></div>
      <div><b>⚡ ${state.xp}</b><span>XP total</span></div>
      <div><b>📘 ${numbers.lessons}</b><span>Lições concluídas</span></div>
      <div><b>🧠 ${numbers.learned}</b><span>Frases aprendidas</span></div>
      <div><b>🏅 ${numbers.mastered}</b><span>Frases dominadas</span></div>
      <div><b>🎙️ ${numbers.spoken}</b><span>Gravações de fala</span></div>
    </div>
    <p class="section-title">Conquistas</p>
    <div class="card list">${badges}</div>
    <p class="section-title">Meu plano</p>
    <div class="card"><p>${h(planText())}</p><button class="link" data-act="redo-onboarding">Refazer as perguntas iniciais</button></div>
    <p class="section-title">Ajustes</p>
    <div class="card">
      <label class="row"><span>Meta diária</span><select id="goal">${goals}</select></label>
      <label class="row"><span>Som das frases</span><input type="checkbox" id="sound" ${state.settings.sound ? "checked" : ""} /></label>
      <label class="row"><span>Efeitos sonoros</span><input type="checkbox" id="effects" ${state.settings.effects ? "checked" : ""} /></label>
      <div class="row"><span>Testar o som</span><button class="link" data-act="sound-test">Tocar</button></div>
      <p id="sound-result" class="small wrap"></p>
      <div class="row"><span>Uso sem internet</span><button class="link" data-act="offline">Baixar áudios</button></div>
      <p id="offline-result" class="small wrap">Os áudios são guardados conforme você usa. Baixe todos de uma vez antes de ficar sem internet.</p>
    </div>
    <p class="section-title">Backup</p>
    <div class="card">
      <p>O progresso fica só neste aparelho. O backup guarda XP, sequência, gemas, as suas frases e as datas de revisão.</p>
      <button class="link" data-act="export">Salvar backup</button>
      <button class="link" data-act="restore">Restaurar backup</button>
      <button class="link danger" data-act="reset">Apagar tudo</button>
    </div>
    <p class="section-title">Créditos</p>
    <div class="card"><p>Vozes geradas com o sintetizador Piper. Bia e Malu usam o LibriTTS-R (Koizumi et al., 2023), sob licença CC BY 4.0. Cora, Dona Rosa, Tom e Leo usam vozes em domínio público (LJ Speech, Kristin, Norman e Bryce).</p></div></div>`);
  $("#goal").onchange = (e) => {
    state.goal = Number(e.target.value);
    save();
  };
  $("#sound").onchange = (e) => {
    state.settings.sound = e.target.checked;
    save();
  };
  $("#effects").onchange = (e) => {
    state.settings.effects = e.target.checked;
    save();
  };
}

async function exportBackup() {
  const name = `trilha-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([store.exportJson(app.state)], name, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function restoreBackup(file) {
  try {
    const restored = store.importJson(await file.text());
    const count = Object.keys(restored.items).length;
    if (!confirm(`Restaurar este backup (${restored.xp} XP, ${count} frases)? Isso substitui o progresso atual (${app.state.xp} XP).`)) return;
    replaceState(restored);
    showProfile();
    toast("Backup restaurado.");
  } catch (err) {
    alert(err.message || String(err));
  }
}

Object.assign(actions, {
  "redo-onboarding": startOnboarding,
  export: exportBackup,
  restore: () => $("#file-backup").click(),
  reset: () => {
    if (!confirm(`Apagar todo o progresso (${app.state.xp} XP, ${Object.keys(app.state.items).length} frases em revisão e ${app.state.custom.length} frases suas)? Isso não pode ser desfeito.`)) return;
    replaceState(store.defaultState());
    showProfile();
    toast("Tudo apagado.");
  },
  "sound-test": async () => {
    $("#sound-result").textContent = "Tocando…";
    $("#sound-result").textContent = await audio.selfTest(sentenceFile(lessons[0].sentences[0].id));
  },
  offline: async () => {
    const out = $("#offline-result");
    const total = await audio.cacheAll((done, all) => out.isConnected && (out.textContent = `Baixando áudios… ${done} de ${all}`));
    if (out.isConnected) out.textContent = `${total} áudios guardados neste aparelho.`;
  },
});

tabViews.profile = showProfile;
