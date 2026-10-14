// Aba Aprender: a trilha de unidades, com lições, baús e revisão de unidade. Também a loja.

import { h, app, actions, tabViews, show, save, toast, topBar, barHtml, lessons, units, unitColor, hearts, daily, todayCards, canListen, playFile, openTab, effect, game, ex } from "../core.js";
import { vocabFile } from "../audio-paths.js";
import { startSession } from "./session.js";
import { owl } from "../owl.js";

const done = (id) => Boolean(app.state.lessonsDone[id]);

// Tudo o que precisa ser concluído em ordem: as lições de cada unidade e a revisão dela.
function gates() {
  return units.flatMap((unit) => [...unit.lessons.map((l) => l.id), unit.reviewId]);
}

// Quem declarou já saber inglês começa mais adiante: as unidades anteriores ficam abertas, sem ordem.
function unlocked(id) {
  const order = gates();
  const index = order.indexOf(id);
  if (index === 0 || done(order[index - 1])) return true;
  const unit = units.find((u) => u.reviewId === id || u.lessons.some((l) => l.id === id));
  const start = app.state.profile.startUnit;
  return unit.index < start || (unit.index === start && id === unit.lessons[0].id);
}

// "next" é a lição da vez (ganha o balão "Começar"); "open" está liberada, mas não é a da vez.
function gateStatus(id) {
  if (done(id)) return "done";
  if (!unlocked(id)) return "locked";
  const start = app.state.profile.startUnit;
  const current = gates().find((g) => !done(g) && unlocked(g) && units.find((u) => u.reviewId === g || u.lessons.some((l) => l.id === g)).index >= start);
  return id === current ? "next" : "open";
}

function chestStatus(unit) {
  if (app.state.chests[unit.id]) return "opened";
  return done(unit.lessons[1].id) ? "ready" : "locked";
}

function node({ status, act, data, icon, label, cls = "" }) {
  // A lição da vez ganha o balão e a coruja ao lado.
  const callout = status === "next" ? `<em class="callout">Começar</em>${cls ? "" : `<span class="buddy">${owl("normal", 62)}</span>`}` : "";
  return `<button class="node ${status} ${cls}" data-act="${act}" ${data} ${status === "locked" ? "disabled" : ""}>${callout}<i>${icon}</i><span>${h(label)}</span></button>`;
}

function unitHtml(unit) {
  const [color, dark] = unitColor(unit.index);
  const icons = { done: "✓", next: "★", open: "★", locked: "🔒" };
  const lessonNode = (lesson) => {
    const status = gateStatus(lesson.id);
    return node({ status, act: "open-lesson", data: `data-i="${lessons.indexOf(lesson)}"`, icon: icons[status], label: lesson.title });
  };
  const chest = chestStatus(unit);
  const chestNode = node({
    status: chest === "ready" ? "next" : chest === "opened" ? "done" : "locked",
    act: "open-chest",
    data: `data-unit="${unit.index}"`,
    icon: chest === "opened" ? "📭" : "🎁",
    label: chest === "opened" ? "Baú aberto" : "Baú",
    cls: "chest",
  }).replace(`<em class="callout">Começar</em>`, `<em class="callout">Abrir</em>`);
  const reviewStatus = gateStatus(unit.reviewId);
  const reviewNode = node({
    status: reviewStatus,
    act: "open-unit-review",
    data: `data-unit="${unit.index}"`,
    icon: reviewStatus === "locked" ? "🔒" : "🏆",
    label: "Revisão da unidade",
    cls: "trophy",
  });
  const [l1, l2, l3] = unit.lessons;
  const completed = unit.lessons.filter((l) => done(l.id)).length + (done(unit.reviewId) ? 1 : 0);
  return `<section style="--u:${color};--ud:${dark}">
    <div class="unit"><div><small>Unidade ${unit.index + 1} · ${completed}/4</small><h2>${h(unit.title)}</h2><p>${h(unit.desc)}</p></div>
      <button class="guide" data-act="open-guide" data-unit="${unit.index}" aria-label="Guia da unidade">📖<span>Guia</span></button></div>
    <div class="nodes">${lessonNode(l1)}${lessonNode(l2)}${chestNode}${lessonNode(l3)}${reviewNode}</div></section>`;
}

function goalCard() {
  const xp = daily().xp;
  const reached = xp >= app.state.goal;
  return `<div class="card slim"><div class="goal"><span>${reached ? "🏆" : "🎯"}</span>${barHtml(xp / app.state.goal)}<span class="small">${Math.min(xp, 999)} / ${app.state.goal} XP</span></div></div>`;
}

function reviewNudge() {
  const { due, fresh } = todayCards();
  const count = due.length + fresh.length;
  if (!count) return "";
  return `<button class="card nudge" data-act="tab" data-tab="review"><span>🔁</span><div><h3>${count} ${count === 1 ? "cartão para hoje" : "cartões para hoje"}</h3><p>Revisões e palavras novas, na aba Revisão.</p></div><b>›</b></button>`;
}

function showLearn() {
  show(`${topBar()}<div class="scroll path">${goalCard()}${reviewNudge()}${units.map(unitHtml).join("")}
    <p class="small end-note">Fim do curso por enquanto. Novas unidades entram aqui.</p></div>`);
  // Abre a trilha já na lição atual, não no topo.
  document.querySelector(".node.next:not(.chest)")?.scrollIntoView({ block: "center" });
}

// ---------- Lição ----------

function noHearts() {
  const next = hearts().nextIn;
  const canBuy = app.state.gems >= game.SHOP.refill.cost;
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="learn" aria-label="Fechar">✕</button></div>
    <div class="center"><div class="big">💔</div><h2>Você está sem vidas</h2>
      <p>Lições novas gastam vidas quando você erra. A próxima vida volta em ${game.formatWait(next)}.</p></div>
    <div class="session-foot stack">
      <button class="btn ok" data-act="tab" data-tab="review">Revisar para ganhar 1 ❤️</button>
      <button class="btn ghost" data-act="buy-refill" ${canBuy ? "" : "disabled"}>Recarregar por ${game.SHOP.refill.cost} 💎</button>
    </div>`,
    { showTabs: false },
  );
}

function showIntro(index) {
  const lesson = lessons[index];
  const practiced = done(lesson.id);
  const vocab = lesson.vocab
    .map(([en, pt], i) => `<button class="vocab" data-act="say-vocab" data-file="${vocabFile(lesson.id, i)}"><span>🔊</span><b>${h(en)}</b><span>${h(pt)}</span></button>`)
    .join("");
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="learn" aria-label="Fechar">✕</button></div>
    <div class="scroll">
      <p class="section-title">Unidade ${lesson.unitIndex + 1} · Lição ${lesson.lessonIndex + 1}</p>
      <h2 class="screen-title">${h(lesson.title)}</h2>
      <p class="lead">${practiced ? "Você já concluiu esta lição. Praticar de novo não gasta vidas e vale menos XP." : `${lesson.sentences.length} frases novas. Toque nas palavras para ouvir antes de começar.`}</p>
      ${vocab}
    </div>
    <div class="session-foot"><button class="btn" data-act="start-lesson" data-i="${index}">${practiced ? "Praticar de novo" : "Começar"}</button></div>`,
    { showTabs: false },
  );
}

function startLesson(index) {
  const lesson = lessons[index];
  const practiced = done(lesson.id);
  if (!practiced && hearts().count <= 0) return noHearts();
  const plan = ex.lessonPlan(lesson, { listen: lesson.sentences.every(canListen) });
  for (const entry of plan) if (entry.type === "pairs") entry.lessonId = lesson.id;
  startSession({
    kind: practiced ? "practice" : "lesson",
    title: lesson.title,
    plan,
    sentences: lesson.sentences,
    lessonId: lesson.id,
    back: () => openTab("learn"),
  });
}

function startUnitReview(unitIndex) {
  const unit = units[unitIndex];
  const sentences = unit.lessons.flatMap((l) => l.sentences);
  const repeat = done(unit.reviewId);
  if (!repeat && hearts().count <= 0) return noHearts();
  startSession({
    kind: repeat ? "practice" : "unit",
    title: `Revisão: ${unit.title}`,
    plan: ex.unitReviewPlan(sentences, { listen: sentences.every(canListen) }),
    sentences,
    lessonId: unit.reviewId,
    back: () => openTab("learn"),
  });
}

function showGuide(unitIndex) {
  const unit = units[unitIndex];
  const [color, dark] = unitColor(unitIndex);
  const blocks = unit.lessons
    .map(
      (lesson) => `<p class="section-title">${h(lesson.title)}</p>${lesson.vocab
        .map(([en, pt], i) => `<button class="vocab" data-act="say-vocab" data-file="${vocabFile(lesson.id, i)}"><span>🔊</span><b>${h(en)}</b><span>${h(pt)}</span></button>`)
        .join("")}`,
    )
    .join("");
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="learn" aria-label="Fechar">✕</button></div>
    <div class="scroll" style="--u:${color};--ud:${dark}">
      <div class="unit"><div><small>Guia da unidade ${unitIndex + 1}</small><h2>${h(unit.title)}</h2><p>${h(unit.desc)}</p></div></div>
      ${blocks}</div>`,
    { showTabs: false },
  );
}

function openChest(unitIndex) {
  const unit = units[unitIndex];
  if (chestStatus(unit) !== "ready") return;
  app.state.chests[unit.id] = true;
  app.state.gems += game.CHEST_GEMS;
  save();
  effect("chest");
  show(
    `<div class="center"><div class="big chest-open">🎁</div><h2>+${game.CHEST_GEMS} 💎</h2><p>Baú da unidade ${unitIndex + 1} aberto. Use as gemas na loja para recarregar vidas ou proteger a sua sequência.</p></div>
    <div class="session-foot"><button class="btn" data-act="tab" data-tab="learn">Continuar</button></div>`,
    { showTabs: false },
  );
}

// ---------- Loja ----------

function showShop() {
  const state = app.state;
  const now = hearts();
  const full = now.count >= game.MAX_HEARTS;
  const { refill, freeze } = game.SHOP;
  const maxed = state.freezes >= freeze.max;
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="${app.tab}" aria-label="Fechar">✕</button><h2 class="bar-title">Loja</h2><span class="hearts gems">💎 ${state.gems}</span></div>
    <div class="scroll">
      <div class="card shop"><span>❤️</span><div><h3>Recarga de vidas</h3>
        <p>${full ? "Suas vidas estão cheias." : `Você tem ${now.count} de ${game.MAX_HEARTS}. A próxima volta em ${game.formatWait(now.nextIn)}.`}</p>
        <button class="btn" data-act="buy-refill" ${full || state.gems < refill.cost ? "disabled" : ""}>${full ? "Vidas cheias" : `Recarregar · ${refill.cost} 💎`}</button></div></div>
      <div class="card shop"><span>🧊</span><div><h3>Bloqueio de sequência</h3>
        <p>Segura a sua sequência se você ficar um dia sem estudar. Você tem ${state.freezes} de ${freeze.max}.</p>
        <button class="btn" data-act="buy-freeze" ${maxed || state.gems < freeze.cost ? "disabled" : ""}>${maxed ? "Máximo atingido" : `Comprar · ${freeze.cost} 💎`}</button></div></div>
      <p class="small note">Gemas vêm das missões do dia, dos baús da trilha e de subir de nível.</p>
    </div>`,
    { showTabs: false },
  );
}

Object.assign(actions, {
  "open-lesson": (el) => showIntro(Number(el.dataset.i)),
  "start-lesson": (el) => startLesson(Number(el.dataset.i)),
  "open-unit-review": (el) => startUnitReview(Number(el.dataset.unit)),
  "open-guide": (el) => showGuide(Number(el.dataset.unit)),
  "open-chest": (el) => openChest(Number(el.dataset.unit)),
  "say-vocab": (el) => playFile(el.dataset.file),
  shop: showShop,
  "buy-refill": () => {
    if (app.state.gems < game.SHOP.refill.cost || hearts().count >= game.MAX_HEARTS) return;
    app.state.gems -= game.SHOP.refill.cost;
    app.state.hearts = game.gainHearts(app.state.hearts, game.MAX_HEARTS);
    save();
    toast("Vidas recarregadas ❤️");
    showShop();
  },
  "buy-freeze": () => {
    if (app.state.gems < game.SHOP.freeze.cost || app.state.freezes >= game.SHOP.freeze.max) return;
    app.state.gems -= game.SHOP.freeze.cost;
    app.state.freezes++;
    save();
    toast("Bloqueio de sequência comprado 🧊");
    showShop();
  },
});

tabViews.learn = showLearn;
