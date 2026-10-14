// Sessão de exercícios: desenha cada exercício, confere a resposta e fecha com a tela de resultado.

import { $, h, app, actions, show, save, toast, barHtml, allSentences, wordPool, hearts, daily, addXp, schedule, say, sayWord, playFile, effect, srs, game, ex, audio } from "../core.js";
import { vocabFile } from "../audio-paths.js";
import { owl } from "../owl.js";
import { character, castFor } from "../characters.js";
import { speakerFor } from "../voices.js";
import * as fx from "../fx.js";

const USES_HEARTS = { lesson: true, unit: true, practice: false };

const INSTRUCTIONS = {
  pairs: "Toque nos pares",
  choice: "Qual é a tradução?",
  build: "Monte a frase em inglês",
  listen: "Toque para ouvir e monte a frase",
  type: "Escreva em inglês",
};

/**
 * kind: "lesson" (frases novas), "unit" (revisão de unidade), "practice" (repetir lição feita)
 *       ou "story" (perguntas no fim de uma história). Só "lesson" e "unit" gastam vidas.
 */
export function startSession({ kind, title, plan, sentences = [], lessonId = null, back }) {
  if (!plan.length) return back();
  app.session = {
    kind,
    title,
    queue: plan,
    total: plan.length,
    done: 0,
    mistakes: 0,
    combo: 0,
    maxCombo: 0,
    firstTry: new Map(), // id da frase -> acertou todos os exercícios dela de primeira?
    scheduled: new Set(),
    sentences,
    lessonId,
    back,
    current: null,
    shown: null,
    phase: "answer",
    startedAt: Date.now(),
    cast: castFor(lessonId || title), // o personagem dos exercícios sem frase (ligar pares)
    entering: false, // true no primeiro desenho de cada exercício, para animar a entrada
    lastFraction: 0,
  };
  nextExercise();
}

function prepare(entry) {
  const { s, type } = entry;
  // left/right guardam o par selecionado em cada coluna; matched, os pares já ligados.
  if (type === "pairs") return { cols: ex.buildPairs(entry.pairs), left: null, right: null, matched: [], wrong: null, text: "" };
  if (type === "choice") return { ...ex.buildChoices(s, allSentences()), selected: null };
  if (type === "type") return { text: "" };
  return { ...ex.buildWordBank(s, wordPool(), type === "listen" ? 2 : 3), picked: [] };
}

function nextExercise() {
  const session = app.session;
  const entry = session.queue[0];
  session.current = prepare(entry);
  session.shown = entry;
  session.phase = "answer";
  session.entering = true;
  if (entry.s?.audio) audio.preload([entry.s.audio]);
  draw();
  if (entry.type === "listen" || entry.type === "choice") say(entry.s);
  if (entry.type === "type") $(".typing")?.focus();
}

function bubble(text, sentence, lang) {
  const speak = sentence && (sentence.audio || audio.canSynthesize) ? `<button class="speak" data-act="say" aria-label="Ouvir">🔊</button>` : "";
  return `<div class="talk">${actor()}<div class="bubble">${speak}<p ${lang ? `lang="${lang}"` : ""}>${h(text)}</p></div></div>`;
}

// O personagem da sessão, com a expressão do momento: neutro, contente no acerto, triste no erro.
// É sempre o personagem dono da voz da frase: quem aparece é quem fala.
function actor(height = 132) {
  const { phase, current, shown } = app.session;
  const cast = shown?.s ? speakerFor(shown.s.id) : app.session.cast;
  if (cast === "cora") return owl(phase !== "feedback" ? "normal" : current.ok ? "happy" : "sad", height * 0.62);
  if (phase !== "feedback") return character(cast, { height });
  return character(cast, current.ok ? { mood: "happy", height, cls: "cheer" } : { mood: "sad", height, cls: "droop" });
}

function body(entry, cur) {
  const { s, type } = entry;
  if (type === "pairs") {
    const tile = (side, item) => {
      const matched = cur.matched.includes(item.id);
      const selected = cur[side] === item.id;
      const wrong = cur.wrong && cur.wrong[side] === item.id;
      return `<button class="tile ${matched ? "matched" : ""} ${selected ? "sel" : ""} ${wrong ? "wrong" : ""}" data-act="pair" data-side="${side}" data-id="${item.id}" ${matched ? "disabled" : ""}>${h(item.text)}</button>`;
    };
    return `<div class="pairs"><div>${cur.cols.left.map((i) => tile("left", i)).join("")}</div><div>${cur.cols.right.map((i) => tile("right", i)).join("")}</div></div>`;
  }
  if (type === "choice") {
    const options = cur.options
      .map((pt, i) => `<button class="option ${cur.selected === i ? "sel" : ""}" data-act="select" data-i="${i}"><span>${i + 1}</span>${h(pt)}</button>`)
      .join("");
    return `${bubble(s.en, s, "en")}<div class="options">${options}</div>`;
  }
  if (type === "type") {
    return `${bubble(s.pt)}<textarea class="typing" lang="en" placeholder="Digite em inglês" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
  }
  const picked = cur.picked.map((id) => `<button class="chip" data-act="unpick" data-id="${id}">${h(cur.bank[id].text)}</button>`).join("");
  const bank = cur.bank
    .map((w) => `<button class="chip ${cur.picked.includes(w.id) ? "used" : ""}" data-act="pick" data-id="${w.id}">${h(w.text)}</button>`)
    .join("");
  const head =
    type === "listen"
      ? `<div class="listen">${actor(120)}<button class="speak" data-act="say" aria-label="Ouvir">🔊</button><button class="speak slow" data-act="say-slow" aria-label="Ouvir devagar">🐢</button></div>`
      : bubble(s.pt);
  return `${head}<div class="answer-line" lang="en">${picked}</div><div class="bank" lang="en">${bank}</div>`;
}

function hasResponse(entry, cur) {
  if (entry.type === "choice") return cur.selected !== null;
  if (entry.type === "type") return cur.text.trim() !== "";
  return cur.picked?.length > 0;
}

function foot(entry, cur) {
  const session = app.session;
  if (session.phase === "answer") {
    if (entry.type === "pairs") return `<div class="session-foot"><button class="btn" disabled>Ligue todos os pares</button></div>`;
    return `<div class="session-foot"><button class="btn" id="check" data-act="check" ${hasResponse(entry, cur) ? "" : "disabled"}>Verificar</button></div>`;
  }
  const ok = cur.ok;
  const s = entry.s;
  const detail = s
    ? `<p lang="en"><b>${h(s.en)}</b></p><p class="small">${h(s.pt)}</p>`
    : `<p class="small">Vocabulário da lição revisado.</p>`;
  const speak = s && (s.audio || audio.canSynthesize) ? `<button class="speak" data-act="say" aria-label="Ouvir">🔊</button>` : "";
  return `<div class="session-foot ${ok ? "ok" : "bad"}">
    <div class="feedback"><span class="mark">${ok ? "✓" : "✕"}</span><div><h3>${ok ? praise(session.combo) : "Resposta certa:"}</h3>${detail}</div>${speak}</div>
    <button class="btn ${ok ? "ok" : "bad"}" data-act="continue">Continuar</button></div>`;
}

function praise(combo) {
  if (combo >= 10) return "Imbatível!";
  if (combo >= 5) return "Em sequência!";
  return ["Correto!", "Muito bem!", "Isso mesmo!", "Boa!"][combo % 4];
}

function heartsHtml() {
  return USES_HEARTS[app.session.kind] ? `<span class="hearts">❤️ ${hearts().count}</span>` : `<span class="hearts free">❤️ ∞</span>`;
}

function draw() {
  const session = app.session;
  const entry = session.shown;
  const cur = session.current;
  const answered = session.phase === "feedback";
  const fresh = session.kind === "lesson" && entry.s && srs.isNew(app.state.items[entry.s.id]);
  // Com a resposta dada, o exercício fica travado: nenhum botão dele responde a toque.
  show(
    `<div class="session-top"><button class="close" data-act="quit" aria-label="Sair">✕</button>${barHtml(session.done / session.total, "green")}${heartsHtml()}</div>
    <div class="exercise" data-type="${entry.type}" data-sid="${h(entry.s?.id || "")}" ${answered ? 'style="pointer-events:none"' : ""}>
      ${fresh ? `<span class="tag">Frase nova</span>` : ""}
      <h2 class="instruction">${INSTRUCTIONS[entry.type]}</h2>
      ${body(entry, cur)}
    </div>${foot(entry, cur)}`,
    { showTabs: false },
  );
  const typing = $(".typing");
  if (typing) {
    typing.value = cur.text;
    typing.readOnly = answered;
    typing.oninput = () => {
      cur.text = typing.value;
      const btn = $("#check");
      if (btn) btn.disabled = typing.value.trim() === "";
    };
    typing.onkeydown = (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (session.phase === "answer" && typing.value.trim()) checkAnswer();
    };
  }
  animate(answered);
}

// Movimento depois de cada desenho: a barra avança, o exercício novo chega, o retorno sobe.
function animate(answered) {
  const session = app.session;
  const fill = $(".session-top .bar i");
  const target = session.done / session.total;
  if (fill && target !== session.lastFraction) {
    fill.style.width = `${Math.round(session.lastFraction * 100)}%`;
    requestAnimationFrame(() => (fill.style.width = `${Math.round(target * 100)}%`));
    session.lastFraction = target;
  }
  if (session.entering) {
    session.entering = false;
    fx.enter($(".exercise"), { from: "translateX(28px)" });
  }
  if (answered && !session.current.revealed) {
    session.current.revealed = true;
    fx.enter($(".session-foot"), { from: "translateY(100%)", duration: 260 });
    if (!session.current.ok) fx.shake($(".exercise"));
  }
  if (session.popChip !== undefined) {
    fx.pop($(`.answer-line .chip[data-id="${session.popChip}"]`));
    session.popChip = undefined;
  }
}

// Registra acerto ou erro do exercício atual e mostra o retorno.
function resolve(ok) {
  const session = app.session;
  const entry = session.queue[0];
  const s = entry.s;
  session.current.ok = ok;
  if (s) {
    if (!ok) session.firstTry.set(s.id, false);
    else if (!session.firstTry.has(s.id)) session.firstTry.set(s.id, true);
  }
  if (ok) {
    session.queue.shift();
    session.done++;
    session.combo++;
    session.maxCombo = Math.max(session.maxCombo, session.combo);
    const today = daily();
    today.combo = Math.max(today.combo, session.combo);
    session.milestone = [3, 5, 10].includes(session.combo);
    if (session.milestone) toast(`${session.combo} seguidas! 🔥`, 1500);
  } else {
    registerMistake();
    session.queue.push(session.queue.shift());
  }
  // Fora das lições novas, cada frase aparece uma vez: o resultado já vale na hora
  // e fica salvo mesmo se a sessão for interrompida.
  if (s && session.kind !== "lesson" && session.kind !== "story" && !session.scheduled.has(s.id)) {
    session.scheduled.add(s.id);
    schedule(s.id, ok);
    if (session.kind === "review") daily().reviewed++;
  }
  save();
  session.phase = "feedback";
  effect(!ok ? (USES_HEARTS[session.kind] ? "heart" : "wrong") : session.milestone ? "combo" : "correct");
  session.milestone = false;
  draw();
  if (s) say(s);
}

function registerMistake() {
  const session = app.session;
  session.mistakes++;
  session.combo = 0;
  if (USES_HEARTS[session.kind]) app.state.hearts = game.loseHeart(app.state.hearts);
}

function checkAnswer() {
  const { s, type } = app.session.queue[0];
  const cur = app.session.current;
  let response;
  if (type === "choice") response = cur.options[cur.selected];
  else if (type === "type") response = cur.text;
  else response = cur.picked.map((id) => cur.bank[id].text);
  resolve(ex.check(type, response, s));
}

function tapPair(side, id) {
  const session = app.session;
  const entry = session.queue[0];
  const cur = session.current;
  if (cur.wrong || cur.matched.includes(id)) return;
  cur[side] = cur[side] === id ? null : id;
  if (side === "left" && cur.left !== null && entry.lessonId) playFile(vocabFile(entry.lessonId, id));
  if (cur.left === null || cur.right === null) return draw();
  if (cur.left === cur.right) {
    cur.matched.push(cur.left);
    effect("match");
    cur.left = null;
    cur.right = null;
    if (cur.matched.length === entry.pairs.length) return resolve(true);
    return draw();
  }
  // Par errado: pisca em vermelho, custa uma vida e o exercício continua.
  cur.wrong = { left: cur.left, right: cur.right };
  cur.left = null;
  cur.right = null;
  registerMistake();
  save();
  effect("wrong");
  draw();
  setTimeout(() => {
    if (app.session !== session || session.current !== cur) return;
    cur.wrong = null;
    if (USES_HEARTS[session.kind] && hearts().count <= 0) return showFailed();
    draw();
  }, 600);
}

function continueSession() {
  const session = app.session;
  if (USES_HEARTS[session.kind] && hearts().count <= 0 && session.queue.length) return showFailed();
  if (!session.queue.length) return finish();
  nextExercise();
}

function formatTime(ms) {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function finish() {
  const session = app.session;
  if (session.kind === "lesson") {
    // Lição nova: a frase conta como acerto se todos os exercícios dela saíram de primeira.
    for (const s of session.sentences) schedule(s.id, session.firstTry.get(s.id) !== false);
  }
  if (session.lessonId) app.state.lessonsDone[session.lessonId] = true;
  complete(session);
}

// Fecha qualquer tipo de sessão: soma XP, atualiza missões, vidas e sequência, e mostra o resultado.
// `info` precisa de { kind, mistakes, total, startedAt, back }.
export function complete({ kind, mistakes, total, startedAt, back }) {
  const state = app.state;
  const today = srs.dayStart();
  const gained = game.sessionXp(kind, mistakes);
  const { levelUp, level } = addXp(gained);
  const counters = daily();
  counters.sessions++;
  if (mistakes === 0) counters.perfect++;

  const extras = [];
  if (kind === "review" && hearts().count < game.MAX_HEARTS) {
    state.hearts = game.gainHearts(state.hearts, 1);
    extras.push("+1 ❤️ por revisar");
  }
  if (levelUp) extras.push(`Nível ${level} alcançado: +${game.LEVEL_UP_GEMS} 💎`);

  const firstToday = !game.studiedToday(state.streak, today);
  const result = game.streakAfter(state.streak, today, state.freezes);
  state.streak = result.streak;
  if (result.usedFreeze) state.freezes--;
  save();
  audio.stop();
  effect(levelUp ? "level" : "done");

  const accuracy = Math.round((total / (total + mistakes)) * 100);
  app.session = { back, streakScreen: firstToday, usedFreeze: result.usedFreeze };
  const messages = {
    lesson: "As frases novas voltam amanhã para a primeira revisão.",
    unit: "Unidade concluída. A próxima está liberada.",
    practice: "Praticar mantém as frases frescas.",
    review: "Cada cartão volta na data certa para você não esquecer.",
    story: "Parte concluída. A próxima fica disponível amanhã.",
    sounds: "Ouvido treinado. Volte amanhã para outra rodada.",
  };
  show(
    `<div class="center">${owl("happy", 150)}
      <h2>${mistakes ? "Sessão concluída!" : "Sessão perfeita!"}</h2>
      <p>${messages[kind]}</p>
      <div class="result-row">
        <div class="r-xp"><span>XP total</span><b>⚡ ${gained}</b></div>
        <div class="r-acc"><span>Precisão</span><b>🎯 ${accuracy}%</b></div>
        <div class="r-time"><span>Tempo</span><b>⏱ ${formatTime(Date.now() - startedAt)}</b></div>
      </div>
      ${extras.map((e) => `<p class="extra">${h(e)}</p>`).join("")}</div>
    <div class="session-foot"><button class="btn" data-act="after-result">Continuar</button></div>`,
    { showTabs: false },
  );
  // A comemoração: confete, a coruja pula e os números sobem contando.
  fx.confetti(mistakes ? 40 : 90);
  fx.pop($(".center .owl"));
  fx.stagger(document.querySelectorAll(".result-row > div"), 110);
  for (const el of document.querySelectorAll(".result-row b")) fx.countUp(el);
}

function showStreak() {
  const { back, usedFreeze } = app.session;
  const today = srs.dayStart();
  const count = app.state.streak.count;
  const dots = game
    .weekDots(app.state.streak, today)
    .map((d) => `<div class="${d.done ? "done" : ""} ${d.today ? "today" : ""}"><span>${d.label}</span><i>${d.done ? "✓" : ""}</i></div>`)
    .join("");
  app.session = { back };
  show(
    `<div class="center"><div class="big flame">🔥</div><h2 class="streak-count">${count}</h2>
      <p><b>${count === 1 ? "dia de sequência" : "dias de sequência"}</b></p>
      <div class="week">${dots}</div>
      <p>${usedFreeze ? "Você faltou ontem, mas o bloqueio de sequência segurou a sua ofensiva." : "Estude todos os dias para a sequência não zerar."}</p></div>
    <div class="session-foot"><button class="btn" data-act="leave">Continuar</button></div>`,
    { showTabs: false },
  );
  effect("streak");
  fx.pop($(".streak-count"));
  fx.stagger(document.querySelectorAll(".week > div"), 60);
}

function showFailed() {
  audio.stop();
  const { back } = app.session;
  const next = hearts().nextIn;
  app.session = { back };
  show(
    `<div class="center">${owl("sad", 150)}<h2>Acabaram as vidas</h2>
      <p>A lição recomeça do início. Uma revisão concluída devolve 1 vida${next ? `, e a próxima volta sozinha em ${game.formatWait(next)}` : ""}.</p></div>
    <div class="session-foot"><button class="btn" data-act="leave">Voltar</button></div>`,
    { showTabs: false },
  );
}

Object.assign(actions, {
  pick: (el) => {
    const cur = app.session.current;
    const id = Number(el.dataset.id);
    if (cur.picked.includes(id)) return;
    cur.picked.push(id);
    app.session.popChip = id;
    effect("pick");
    draw();
    // No exercício de ouvir, falar a palavra tocada entregaria a resposta.
    if (app.session.queue[0].type === "build") sayWord(cur.bank[id].text);
  },
  unpick: (el) => {
    const cur = app.session.current;
    cur.picked = cur.picked.filter((id) => id !== Number(el.dataset.id));
    effect("drop");
    draw();
  },
  select: (el) => {
    app.session.current.selected = Number(el.dataset.i);
    effect("pick");
    draw();
  },
  pair: (el) => tapPair(el.dataset.side, Number(el.dataset.id)),
  say: () => app.session.shown?.s && say(app.session.shown.s),
  "say-slow": () => say(app.session.shown.s, true),
  check: checkAnswer,
  continue: continueSession,
  quit: () => {
    if (!confirm("Sair desta sessão? O progresso dela será perdido.")) return;
    const back = app.session.back;
    audio.stop();
    back();
  },
  "after-result": () => (app.session.streakScreen ? showStreak() : app.session.back()),
  leave: () => app.session.back(),
});
