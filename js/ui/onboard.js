// Primeira abertura: boas-vindas, três perguntas para conhecer a pessoa e o plano que sai delas.

import { h, app, actions, show, save, barHtml, openTab, game } from "../core.js";
import { owl, OWL_NAME } from "../owl.js";

// Respostas em andamento; só vão para o estado salvo no fim.
let answers = null;

function welcome() {
  answers = { reason: null, skill: null, minutes: null };
  show(
    `<div class="center welcome">${owl("normal", 190)}
      <h1>Trilha</h1><p>Inglês de verdade, um pouco por dia.</p></div>
    <div class="session-foot stack">
      <button class="btn ok" data-act="ob-hello">Começar</button>
      <button class="btn ghost" data-act="ob-account">Já tenho uma conta</button>
    </div>`,
    { showTabs: false },
  );
}

function account() {
  show(
    `<div class="center">${owl("sad", 150)}<h2>Contas ainda não estão disponíveis</h2>
      <p>Por enquanto o seu progresso fica guardado só neste aparelho. Quando as contas chegarem, é por aqui que você vai entrar.</p></div>
    <div class="session-foot"><button class="btn" data-act="ob-welcome">Voltar</button></div>`,
    { showTabs: false },
  );
}

function hello() {
  show(
    `<div class="center"><div class="talk tall">${owl("happy", 150)}<div class="bubble"><p>Oi! Eu sou a ${OWL_NAME}. Vou fazer três perguntas rápidas para montar um plano do seu tamanho.</p></div></div></div>
    <div class="session-foot"><button class="btn" data-act="ob-step" data-step="0">Continuar</button></div>`,
    { showTabs: false },
  );
}

// As três perguntas. `key` é o campo da resposta; `next` é a ação do botão Continuar.
const STEPS = [
  { key: "reason", ask: "Por que você quer aprender inglês?", options: () => game.REASONS.map((r) => ({ value: r.id, icon: r.icon, text: r.text })) },
  { key: "skill", ask: "Quanto de inglês você já sabe?", options: () => game.SKILLS.map((s) => ({ value: s.id, icon: s.icon, text: s.text })) },
  {
    key: "minutes",
    ask: "Quanto tempo por dia você tem para estudar?",
    options: () => game.PACES.map((p) => ({ value: p.minutes, icon: "⏱", text: `${p.minutes}${p.minutes === 20 ? " ou mais" : ""} minutos por dia`, side: p.name })),
  },
];

function question(step) {
  const { key, ask, options } = STEPS[step];
  const list = options()
    .map(
      (o) => `<button class="option ${String(answers[key]) === String(o.value) ? "sel" : ""}" data-act="ob-pick" data-step="${step}" data-value="${o.value}">
        <span class="o-icon">${o.icon}</span><b>${h(o.text)}</b>${o.side ? `<em>${h(o.side)}</em>` : ""}</button>`,
    )
    .join("");
  const back = step === 0 ? "ob-hello" : "ob-step";
  show(
    `<div class="session-top"><button class="close" data-act="${back}" data-step="${step - 1}" aria-label="Voltar">‹</button>${barHtml((step + 1) / (STEPS.length + 1), "green")}</div>
    <div class="exercise"><div class="talk">${owl("normal", 84)}<div class="bubble"><p>${h(ask)}</p></div></div>
      <div class="options">${list}</div></div>
    <div class="session-foot"><button class="btn" data-act="${step === STEPS.length - 1 ? "ob-plan" : "ob-step"}" data-step="${step + 1}" ${answers[key] === null ? "disabled" : ""}>Continuar</button></div>`,
    { showTabs: false },
  );
}

function plan() {
  const p = game.planFor(answers.minutes, answers.skill);
  const pace = game.PACES.find((x) => x.minutes === answers.minutes);
  const lessons = Math.max(1, Math.round(p.goal / game.XP.lesson));
  const lines = [
    ["🎯", `Meta de ${p.goal} XP por dia`, `Cerca de ${lessons} ${lessons === 1 ? "lição" : "lições"}, no ritmo ${pace.name.toLowerCase()}.`],
    ["🧠", `${p.wordsPerDay} ${p.wordsPerDay === 1 ? "palavra nova" : "palavras novas"} por dia`, "Cada palavra em 5 frases, na aba Revisão."],
    ["🎙️", `${p.speakGoal} ${p.speakGoal === 1 ? "frase falada" : "frases faladas"} por dia`, `No nível ${p.speakLevel.toUpperCase()}, na aba Falar.`],
    ["🧭", p.startUnit ? `Trilha a partir da unidade ${p.startUnit + 1}` : "Trilha desde o começo", p.startUnit ? "As unidades anteriores ficam abertas para revisar." : "Do primeiro \"hello\" em diante."],
  ];
  show(
    `<div class="session-top"><button class="close" data-act="ob-step" data-step="${STEPS.length - 1}" aria-label="Voltar">‹</button>${barHtml(1, "green")}</div>
    <div class="exercise"><div class="talk">${owl("happy", 84)}<div class="bubble"><p>Pronto! Este é o seu plano. Dá para mudar depois, no Perfil.</p></div></div>
      ${lines.map(([icon, title, text]) => `<div class="card plan"><span>${icon}</span><div><h3>${h(title)}</h3><p>${h(text)}</p></div></div>`).join("")}</div>
    <div class="session-foot"><button class="btn ok" data-act="ob-finish">Começar a aprender</button></div>`,
    { showTabs: false },
  );
}

function finish() {
  const state = app.state;
  const p = game.planFor(answers.minutes, answers.skill);
  state.profile = { onboarded: true, reason: answers.reason, skill: answers.skill, minutes: answers.minutes, wordsPerDay: p.wordsPerDay, startUnit: p.startUnit };
  state.goal = p.goal;
  state.speak.goal = p.speakGoal;
  state.speak.level = p.speakLevel;
  save();
  answers = null;
  openTab("learn");
}

export function startOnboarding() {
  welcome();
}

Object.assign(actions, {
  "ob-welcome": welcome,
  "ob-account": account,
  "ob-hello": hello,
  "ob-step": (el) => question(Number(el.dataset.step)),
  "ob-pick": (el) => {
    const step = Number(el.dataset.step);
    const { key } = STEPS[step];
    answers[key] = key === "minutes" ? Number(el.dataset.value) : el.dataset.value;
    question(step);
  },
  "ob-plan": plan,
  "ob-finish": finish,
});
