// Ponto de entrada: carrega as telas, liga os eventos e abre o app.

import { $, app, actions, indexContent, openTab, tabsVisible, toast, audio } from "./core.js";
import "./ui/session.js";
import "./ui/learn.js";
import "./ui/review.js";
import "./ui/speak.js";
import "./ui/quests.js";
import "./ui/cards.js";
import "./ui/tour.js";
import { startOnboarding } from "./ui/onboard.js";
import { restoreBackup } from "./ui/profile.js";

actions.tab = (el) => openTab(el.dataset.tab);

// Um único ouvinte de clique para o app inteiro: o data-act do botão diz qual ação chamar.
document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-act]");
  if (!el || el.disabled) return;
  Promise.resolve(actions[el.dataset.act]?.(el, event)).catch((err) => {
    console.error(err);
    toast(`Erro: ${err.message || err}`, 5000);
  });
});

$("#file-backup").addEventListener("change", (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) restoreBackup(file);
});

// Ao voltar para o app em outro dia, sequência, vidas e revisões vencidas são recalculadas.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && tabsVisible()) openTab();
});

// Na primeira abertura a coruja faz as perguntas iniciais; depois disso o app abre direto na trilha.
function start() {
  if (app.state.profile.onboarded) openTab("learn");
  else startOnboarding();
}

async function boot() {
  indexContent();
  start();
  // O índice diz quais frases têm gravação; ao chegar, o conteúdo é marcado de novo.
  await audio.loadIndex();
  indexContent();
  if (tabsVisible() && app.tab === "learn") openTab("learn");
  navigator.storage?.persist?.().catch(() => {});
  // A primeira versão guardava baralhos importados aqui; hoje não há mais nada nesse banco.
  try {
    indexedDB.deleteDatabase("trilha-ingles");
  } catch {
    // sem IndexedDB neste navegador: nada a limpar
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

boot();
