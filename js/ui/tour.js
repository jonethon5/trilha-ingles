// A coruja apresenta cada aba na primeira vez que ela é aberta.

import { $, h, app, actions, hooks, save, customUnlocked, game } from "../core.js";
import { owl, OWL_NAME } from "../owl.js";

const TOURS = {
  learn: () => [
    `Esta é a sua trilha. Cada bolinha é uma lição curta: toque na que tem o balão "Começar".`,
    "Lá em cima ficam a sua sequência de dias 🔥, as gemas 💎 e as vidas ❤️. Errar em lição nova gasta uma vida, e elas voltam com o tempo.",
    "Embaixo estão as outras áreas: Revisão, Falar, Missões e Perfil. Eu explico cada uma quando você entrar.",
  ],
  review: () => [
    "Aqui mora a sua memória de longo prazo. Todo dia eu separo os cartões que estão na hora de rever e algumas palavras novas.",
    "É um flashcard: você lê a frase em português, tenta dizer em inglês em voz alta, vira o cartão para ouvir a resposta e me conta como foi.",
    customUnlocked()
      ? "Cada palavra nova vem em cinco frases diferentes. E você já pode criar os seus próprios cartões, lá embaixo."
      : `Cada palavra nova vem em cinco frases diferentes. Com ${game.CUSTOM_UNLOCK_WORDS} palavras aprendidas, você libera os seus próprios cartões.`,
  ],
  speak: () => [
    "Aqui você treina a pronúncia. Escolha o nível, ouça a frase, grave a sua voz e compare com o modelo.",
    "Embaixo de cada palavra está como ela soa. Não conhece os símbolos? Abra o Guia de sons. E toque em qualquer palavra para ouvi-la sozinha.",
  ],
  quests: () => [
    "Todo dia tem três missões novas. Cumpra, colete as gemas e use na loja.",
    "A sequência conta os dias seguidos de estudo. Faltar um dia zera, a não ser que você tenha um bloqueio guardado.",
  ],
  profile: () => ["Aqui ficam os seus números, as conquistas e os ajustes. O seu plano de estudo pode ser mudado quando você quiser."],
};

let steps = null;
let index = 0;
let tab = null;

function draw() {
  const coach = $("#coach");
  const last = index === steps.length - 1;
  coach.innerHTML = `<div class="coach-box"><div class="talk">${owl("normal", 96)}<div class="bubble"><p>${h(steps[index])}</p></div></div>
    <div class="coach-foot"><span class="small">${OWL_NAME} · ${index + 1} de ${steps.length}</span><button class="btn" data-act="coach-next">${last ? "Entendi" : "Continuar"}</button></div></div>`;
  coach.hidden = false;
}

function close() {
  $("#coach").hidden = true;
  steps = null;
}

// Chamado depois que uma aba é desenhada.
hooks.afterTab = (name) => {
  if (steps) {
    // Trocou de aba com a coruja ainda falando: ela se cala.
    if (name !== tab) close();
    else return;
  }
  if (!app.state.profile.onboarded || app.state.tour[name] || !TOURS[name]) return;
  tab = name;
  steps = TOURS[name]();
  index = 0;
  draw();
};

hooks.leaveTabs = close;

Object.assign(actions, {
  "coach-next": () => {
    if (index < steps.length - 1) {
      index++;
      return draw();
    }
    app.state.tour[tab] = true;
    save();
    close();
  },
});
