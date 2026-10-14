import { COURSE, flatLessons } from "./course.js";
import * as srs from "./srs.js";
import * as game from "./game.js";
import * as ex from "./exercise.js";
import * as store from "./store.js";
import * as speech from "./speech.js";
import * as decksDb from "./decks.js";
import { guessMapping, convertPackage, cleanText } from "./anki.js";
import { parseApkg } from "./importer.js";
import { loadApkgLibs } from "./libs.js";

const $ = (sel, el = document) => el.querySelector(sel);
const view = $("#view");
const tabs = $("#tabs");
const h = (text) => String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const LESSON_SIZE = 8;
const lessons = flatLessons(COURSE);

let state = store.load();
let decks = [];
let tab = "path";
let session = null;
let pending = null; // importação aguardando a escolha dos campos

// ---------- Conteúdo: curso embutido + baralhos importados ----------

const byId = new Map();
const groups = new Map();
const poolCache = new Map();

function indexContent() {
  byId.clear();
  groups.clear();
  poolCache.clear();
  const course = [];
  for (const lesson of lessons) {
    for (const s of lesson.sentences) {
      s.group = "course";
      byId.set(s.id, s);
      course.push(s);
    }
  }
  groups.set("course", course);
  for (const deck of decks) {
    const key = `deck:${deck.id}`;
    for (const s of deck.sentences) {
      s.group = key;
      byId.set(s.id, s);
    }
    groups.set(key, deck.sentences);
  }
}

// Palavras erradas saem do mesmo grupo da frase (o curso ou o baralho dela).
function poolFor(sentence) {
  if (!poolCache.has(sentence.group)) {
    poolCache.set(sentence.group, ex.wordPool(ex.sample(groups.get(sentence.group), 400)));
  }
  return poolCache.get(sentence.group);
}

function save() {
  store.save(state);
}

function todayXp() {
  const today = srs.dayStart();
  return state.daily.day === today ? state.daily.xp : 0;
}

function dueList() {
  return srs.dueIds(state.items).filter((id) => byId.has(id));
}

// ---------- Utilidades de interface ----------

function toast(message, ms = 2600) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), ms);
}

function busy(text) {
  $("#overlay-text").textContent = text;
  $("#overlay").hidden = false;
}

function idle() {
  $("#overlay").hidden = true;
}

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

function show(html, { showTabs = true } = {}) {
  view.innerHTML = html;
  tabs.hidden = !showTabs;
  for (const btn of tabs.querySelectorAll("button")) btn.classList.toggle("on", btn.dataset.tab === tab);
}

function topBar(title) {
  const today = srs.dayStart();
  const streak = game.currentStreak(state.streak, today);
  const lit = game.studiedToday(state.streak, today);
  return `<header class="top"><h1>${h(title)}</h1><div class="stats">
    <span class="${lit ? "" : "off"}" title="Sequência de dias">🔥 ${streak}</span>
    <span title="XP total">⚡ ${state.xp}</span>
    <span title="Nível">⭐ ${game.levelInfo(state.xp).level}</span>
  </div></header>`;
}

function barHtml(fraction, cls = "") {
  const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return `<div class="bar ${cls}"><i style="width:${pct}%"></i></div>`;
}

// ---------- Áudio: gravação do Anki quando existe, voz do aparelho quando não ----------

const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const player = new Audio();
const urlCache = new Map();

async function mediaUrl(name) {
  if (urlCache.has(name)) return urlCache.get(name);
  const row = await decksDb.getMedia(name);
  if (!row) return null;
  const url = URL.createObjectURL(new Blob([row.data], { type: row.type }));
  urlCache.set(name, url);
  return url;
}

function clearMediaCache() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

// O iOS só libera áudio depois de um toque; isto "destrava" o player dentro do toque.
function unlockAudio() {
  player.src = SILENCE;
  player.play().catch(() => {});
}

function stopSound() {
  player.pause();
  speech.stop();
}

async function say(sentence, slow = false) {
  if (!state.settings.sound) return;
  if (sentence.audio) {
    const url = await mediaUrl(sentence.audio);
    if (url) {
      speech.stop();
      player.src = url;
      player.defaultPlaybackRate = slow ? 0.7 : 1;
      player.playbackRate = slow ? 0.7 : 1;
      player.play().catch(() => {});
      return;
    }
  }
  player.pause();
  speech.speak(sentence.en, { slow });
}

function canListen(sentence) {
  return state.settings.sound && (Boolean(sentence.audio) || speech.supported);
}

// ---------- Aba Trilha ----------

function lessonStatus(index) {
  if (state.lessonsDone[lessons[index].id]) return "done";
  return index === 0 || state.lessonsDone[lessons[index - 1].id] ? "next" : "locked";
}

function reviewCard() {
  const due = dueList().length;
  if (!due) return "";
  const size = Math.min(due, game.REVIEW_SIZE);
  return `<div class="card"><h3>Revisão do dia</h3>
    <p>${due} ${due === 1 ? "frase está" : "frases estão"} na hora de revisar. Revisar no dia certo é o que fixa na memória.</p>
    <button class="btn ok" data-act="review">Revisar ${size} ${size === 1 ? "frase" : "frases"}</button></div>`;
}

function goalCard() {
  const xp = todayXp();
  const done = xp >= state.goal;
  return `<div class="card"><div class="goal"><span>${done ? "🏆" : "🎯"}</span>${barHtml(xp / state.goal)}<span class="small">${xp} / ${state.goal} XP hoje</span></div></div>`;
}

function showPath() {
  tab = "path";
  session = null;
  stopSound();
  clearMediaCache();
  const icons = { done: "✓", next: "★", locked: "🔒" };
  const units = COURSE.units
    .map((unit, unitIndex) => {
      const nodes = lessons
        .map((lesson, index) => ({ lesson, index }))
        .filter(({ lesson }) => lesson.unitIndex === unitIndex)
        .map(({ lesson, index }) => {
          const status = lessonStatus(index);
          return `<button class="node ${status}" data-act="open-lesson" data-i="${index}" ${status === "locked" ? "disabled" : ""}>
            <i>${icons[status]}</i><span>${h(lesson.title)}</span></button>`;
        })
        .join("");
      return `<section><div class="unit"><small>Unidade ${unitIndex + 1}</small><h2>${h(unit.title)}</h2><p>${h(unit.desc)}</p></div><div class="nodes">${nodes}</div></section>`;
    })
    .join("");
  show(`${topBar("Trilha")}<div class="scroll">${goalCard()}${reviewCard()}${units}</div>`);
}

function showLessonIntro(index) {
  const lesson = lessons[index];
  const done = lessonStatus(index) === "done";
  const vocab = lesson.vocab
    .map(([en, pt]) => `<button class="vocab" data-act="say-word" data-text="${h(en)}"><span>🔊</span><b>${h(en)}</b><span>${h(pt)}</span></button>`)
    .join("");
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="path" aria-label="Fechar">✕</button></div>
    <div class="scroll">
      <p class="section-title">Unidade ${lesson.unitIndex + 1} · Lição ${lesson.lessonIndex + 1}</p>
      <h2 style="margin:0 4px 6px">${h(lesson.title)}</h2>
      <p class="small" style="margin:0 4px 16px;white-space:normal">${done ? "Você já concluiu esta lição. Praticar de novo vale menos XP." : `${lesson.sentences.length} frases novas. Toque nas palavras para ouvir.`}</p>
      ${vocab}
    </div>
    <div class="session-foot"><button class="btn" data-act="start-lesson" data-i="${index}">${done ? "Praticar de novo" : "Começar"}</button></div>`,
    { showTabs: false },
  );
}

// ---------- Sessão de exercícios ----------

function startSession({ kind, title, plan, sentences = [], lessonId = null, back = showPath }) {
  if (!plan.length) return back();
  unlockAudio();
  session = {
    kind, // "lesson" (frases novas), "review" (revisão do dia) ou "practice" (repetir lição feita)
    title,
    queue: plan,
    total: plan.length,
    done: 0,
    hearts: game.HEARTS,
    mistakes: 0,
    firstTry: new Map(), // id da frase -> acertou todos os exercícios de primeira?
    sentences,
    lessonId,
    back,
    current: null,
    phase: "answer",
  };
  nextExercise();
}

function prepare({ s, type }) {
  if (type === "choice") return { ...ex.buildChoices(s, groups.get(s.group)), selected: null };
  if (type === "type") return {};
  return { ...ex.buildWordBank(s, poolFor(s), type === "listen" ? 2 : 3), picked: [] };
}

function nextExercise() {
  const entry = session.queue[0];
  session.current = prepare(entry);
  session.phase = "answer";
  drawSession();
  if (entry.type === "listen" || entry.type === "choice") say(entry.s);
  if (entry.type === "type") $(".typing")?.focus();
}

const INSTRUCTIONS = {
  choice: "Qual é a tradução?",
  build: "Monte a frase em inglês",
  listen: "Toque para ouvir e monte a frase",
  type: "Escreva em inglês",
};

function exerciseBody(entry, cur) {
  const { s, type } = entry;
  const speakBtn = canListen(s) ? `<button class="speak" data-act="say" aria-label="Ouvir">🔊</button>` : "";
  if (type === "choice") {
    const options = cur.options
      .map((pt, i) => `<button class="option ${cur.selected === i ? "sel" : ""}" data-act="select" data-i="${i}">${h(pt)}</button>`)
      .join("");
    return `<div class="prompt">${speakBtn}<p lang="en">${h(s.en)}</p></div><div class="options">${options}</div>`;
  }
  if (type === "type") {
    return `<div class="prompt"><p>${h(s.pt)}</p></div>
      <textarea class="typing" lang="en" placeholder="Digite em inglês" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>`;
  }
  const picked = cur.picked.map((id) => `<button class="chip" data-act="unpick" data-id="${id}">${h(cur.bank[id].text)}</button>`).join("");
  const bank = cur.bank
    .map((w) => `<button class="chip ${cur.picked.includes(w.id) ? "used" : ""}" data-act="pick" data-id="${w.id}">${h(w.text)}</button>`)
    .join("");
  const head =
    type === "listen"
      ? `<div class="listen"><button class="speak" data-act="say" aria-label="Ouvir">🔊</button><button class="speak slow" data-act="say-slow" aria-label="Ouvir devagar">🐢</button></div>`
      : `<div class="prompt"><p>${h(s.pt)}</p></div>`;
  return `${head}<div class="answer-line" lang="en">${picked}</div><div class="bank" lang="en">${bank}</div>`;
}

function hasResponse(entry, cur) {
  if (entry.type === "choice") return cur.selected !== null;
  if (entry.type === "type") return ($(".typing")?.value || "").trim() !== "";
  return cur.picked.length > 0;
}

function footHtml(entry, cur) {
  if (session.phase === "answer") {
    return `<div class="session-foot"><button class="btn" id="check" data-act="check" ${hasResponse(entry, cur) ? "" : "disabled"}>Verificar</button></div>`;
  }
  const { s } = entry;
  const speakBtn = canListen(s) ? `<button class="speak" data-act="say" aria-label="Ouvir">🔊</button>` : "";
  const ok = cur.ok;
  return `<div class="session-foot ${ok ? "ok" : "bad"}">
    <div class="feedback"><div><h3>${ok ? "Correto!" : "Resposta certa:"}</h3><p lang="en"><b>${h(s.en)}</b></p><p class="small">${h(s.pt)}</p></div>${speakBtn}</div>
    <button class="btn ${ok ? "ok" : "bad"}" data-act="continue">Continuar</button></div>`;
}

function drawSession() {
  const entry = session.queue[0];
  const cur = session.current;
  const fresh = srs.isNew(state.items[entry.s.id]) && session.kind === "lesson";
  const answered = session.phase === "feedback";
  // Com a resposta dada, o exercício fica travado: nenhum botão dele responde a toque.
  show(
    `<div class="session-top"><button class="close" data-act="quit" aria-label="Sair">✕</button>${barHtml(session.done / session.total, "green")}<span class="hearts">♥ ${session.hearts}</span></div>
    <div class="exercise" data-type="${entry.type}" data-sid="${h(entry.s.id)}" ${answered ? 'style="pointer-events:none"' : ""}>
      ${fresh ? `<span class="tag">Frase nova</span>` : ""}
      <h2 class="instruction">${INSTRUCTIONS[entry.type]}</h2>
      ${exerciseBody(entry, cur)}
    </div>${footHtml(entry, cur)}`,
    { showTabs: false },
  );
  const typing = $(".typing");
  if (typing) {
    typing.value = cur.text || "";
    typing.readOnly = answered;
    typing.oninput = () => {
      cur.text = typing.value;
      const btn = $("#check");
      if (btn) btn.disabled = typing.value.trim() === "";
    };
    typing.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (session.phase === "answer" && typing.value.trim()) checkAnswer();
      }
    };
  }
}

// Só mexe no agendamento de frase nova ou com revisão vencida; praticar fora de hora não adianta a data.
function schedule(id, correct) {
  const item = state.items[id] || srs.newItem();
  if (srs.isNew(item) || srs.isDue(item)) state.items[id] = srs.review(item, correct);
}

function checkAnswer() {
  const entry = session.queue[0];
  const cur = session.current;
  const { s, type } = entry;
  let response;
  if (type === "choice") response = cur.options[cur.selected];
  else if (type === "type") response = $(".typing").value;
  else response = cur.picked.map((id) => cur.bank[id].text);

  const ok = ex.check(type, response, s);
  cur.ok = ok;
  if (!ok) session.firstTry.set(s.id, false);
  else if (!session.firstTry.has(s.id)) session.firstTry.set(s.id, true);

  if (ok) {
    session.queue.shift();
    session.done++;
  } else {
    session.hearts--;
    session.mistakes++;
    session.queue.push(session.queue.shift());
  }
  // Na revisão cada frase aparece uma vez, então o resultado já vale na hora (e fica salvo se a sessão for interrompida).
  if (session.kind !== "lesson" && !session.scheduled?.has(s.id)) {
    (session.scheduled ??= new Set()).add(s.id);
    schedule(s.id, ok);
    save();
  }
  session.phase = "feedback";
  // A frase respondida continua na tela durante o retorno, mesmo já tendo saído do começo da fila.
  session.shown = entry;
  drawFeedback();
  say(s);
}

function drawFeedback() {
  const queue = session.queue;
  session.queue = [session.shown, ...queue];
  drawSession();
  session.queue = queue;
}

function continueSession() {
  if (session.hearts <= 0) return showFailed();
  if (!session.queue.length) return finishSession();
  nextExercise();
}

function finishSession() {
  const { kind, mistakes, total } = session;
  if (kind === "lesson") {
    // Lição nova: a frase conta como acerto se todos os exercícios dela saíram de primeira.
    for (const s of session.sentences) schedule(s.id, session.firstTry.get(s.id) !== false);
    if (session.lessonId) state.lessonsDone[session.lessonId] = true;
  }
  const today = srs.dayStart();
  const gained = game.sessionXp(kind, mistakes);
  const before = game.levelInfo(state.xp).level;
  state.xp += gained;
  state.daily = { day: today, xp: todayXp() + gained };
  state.streak = game.streakAfter(state.streak, today);
  save();
  stopSound();
  const levelUp = game.levelInfo(state.xp).level > before;
  const accuracy = Math.round((total / (total + mistakes)) * 100);
  const back = session.back;
  session = { back };
  show(
    `<div class="center"><div class="big">${levelUp ? "⭐" : mistakes ? "🎉" : "🏆"}</div>
      <h2>${levelUp ? `Nível ${game.levelInfo(state.xp).level}!` : mistakes ? "Sessão concluída!" : "Sessão perfeita!"}</h2>
      <p>${kind === "lesson" ? "As frases novas voltam amanhã para a primeira revisão." : kind === "review" ? "Cada acerto empurrou a próxima revisão para mais longe." : "Praticar mantém as frases frescas."}</p>
      <div class="result-row">
        <div><b>+${gained}</b><span>XP</span></div>
        <div><b>${accuracy}%</b><span>Precisão</span></div>
        <div><b>🔥 ${state.streak.count}</b><span>${state.streak.count === 1 ? "Dia" : "Dias"}</span></div>
      </div></div>
    <div class="session-foot"><button class="btn" data-act="leave">Continuar</button></div>`,
    { showTabs: false },
  );
}

function showFailed() {
  stopSound();
  const { kind, back } = session;
  session = { back };
  show(
    `<div class="center"><div class="big">💔</div><h2>Acabaram as vidas</h2>
      <p>${kind === "lesson" ? "A lição recomeça do início. Errar faz parte: as frases vão ficando conhecidas." : "O que você já respondeu nesta sessão ficou registrado."}</p></div>
    <div class="session-foot"><button class="btn" data-act="leave">Voltar</button></div>`,
    { showTabs: false },
  );
}

function startCourseLesson(index) {
  const lesson = lessons[index];
  const done = lessonStatus(index) === "done";
  const listen = lesson.sentences.every(canListen);
  startSession({
    kind: done ? "practice" : "lesson",
    title: lesson.title,
    plan: ex.lessonPlan(lesson.sentences, { listen }),
    sentences: lesson.sentences,
    lessonId: lesson.id,
  });
}

function startReview() {
  const plan = dueList()
    .slice(0, game.REVIEW_SIZE)
    .map((id) => {
      const s = byId.get(id);
      return { s, type: ex.typeForStrength(srs.strength(state.items[id]), { listen: canListen(s) }) };
    });
  // A revisão pode ser aberta da Trilha ou dos Baralhos; ao terminar, volta para onde começou.
  startSession({ kind: "review", title: "Revisão", plan: ex.shuffle(plan), back: openTab[tab] });
}

// ---------- Aba Baralhos (importados do Anki) ----------

function deckProgress(deck) {
  let learned = 0;
  for (const s of deck.sentences) if (!srs.isNew(state.items[s.id])) learned++;
  return { learned, total: deck.sentences.length };
}

function showDecks() {
  tab = "decks";
  session = null;
  const cards = decks
    .map((deck) => {
      const { learned, total } = deckProgress(deck);
      const left = total - learned;
      const size = Math.min(LESSON_SIZE, left);
      return `<div class="card"><h3>${h(deck.name)}</h3>
        <div class="goal" style="margin-top:8px">${barHtml(learned / total, "primary")}<span class="small">${learned} / ${total}</span></div>
        <button class="btn" data-act="deck-lesson" data-id="${deck.id}" ${left ? "" : "disabled"}>${left ? `Aprender ${size} ${size === 1 ? "frase nova" : "frases novas"}` : "Todas as frases já foram vistas"}</button>
        <button class="link danger" data-act="delete-deck" data-id="${deck.id}">Excluir baralho</button></div>`;
    })
    .join("");
  const empty = `<div class="card"><h3>Seus baralhos do Anki</h3>
    <p>Importe um pacote .apkg de frases em português e inglês. O app usa as frases e o áudio gravado para montar os mesmos exercícios da trilha.</p></div>`;
  show(`${topBar("Baralhos")}<div class="scroll">${reviewCard()}${cards || empty}
    <button class="btn ghost" data-act="import">Importar do Anki (.apkg)</button>
    <p class="small" style="white-space:normal;margin:14px 4px 0">No Anki do computador: Arquivo → Exportar → "Pacote de baralho do Anki (.apkg)", com a mídia incluída.</p></div>`);
}

function startDeckLesson(deckId) {
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return showDecks();
  const sentences = deck.sentences.filter((s) => srs.isNew(state.items[s.id])).slice(0, LESSON_SIZE);
  startSession({
    kind: "lesson",
    title: deck.name,
    plan: ex.lessonPlan(sentences, { listen: sentences.every(canListen) }),
    sentences,
    back: showDecks,
  });
}

async function deleteDeck(deckId) {
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return;
  if (!confirm(`Excluir "${deck.name}" com ${deck.sentences.length} frases e o progresso delas? Isso não pode ser desfeito.`)) return;
  await decksDb.deleteDeck(deck, decks.filter((d) => d.id !== deckId));
  for (const s of deck.sentences) delete state.items[s.id];
  save();
  decks = decks.filter((d) => d.id !== deckId);
  indexContent();
  showDecks();
}

// Primeiro passo da importação: ler o pacote e mostrar o palpite de campos para o usuário conferir.
async function readPackage(file) {
  busy("Lendo o pacote…");
  try {
    await nextFrame();
    const libs = await loadApkgLibs();
    const pkg = parseApkg(new Uint8Array(await file.arrayBuffer()), libs);
    const counts = new Map();
    const examples = new Map();
    for (const note of pkg.notes) {
      counts.set(note.ntid, (counts.get(note.ntid) || 0) + 1);
      if (!examples.has(note.ntid)) examples.set(note.ntid, note);
    }
    const mappings = new Map(pkg.notetypes.map((nt) => [nt.id, guessMapping(nt)]));
    pending = { pkg, mappings, counts, examples, keepProgress: true };
    idle();
    showMapping();
  } catch (err) {
    idle();
    console.error(err);
    alert(`Não foi possível ler o arquivo.\n\n${err.message || err}`);
  }
}

function showMapping() {
  const { pkg, mappings, counts, examples, keepProgress } = pending;
  const blocks = pkg.notetypes
    .map((nt) => {
      const map = mappings.get(nt.id);
      const example = examples.get(nt.id);
      const select = (key, allowNone) =>
        `<select data-nt="${nt.id}" data-key="${key}">${allowNone ? `<option value="-1">(nenhum)</option>` : ""}${nt.fields
          .map((name, i) => `<option value="${i}" ${map[key] === i ? "selected" : ""}>${h(name)}</option>`)
          .join("")}</select>`;
      const preview = example
        ? `<div class="example"><b>PT:</b> ${h(cleanText(example.fields[map.pt] || "") || "(vazio)")}<br><b>EN:</b> ${h(cleanText(example.fields[map.en] || "") || "(vazio)")}</div>`
        : "";
      return `<div class="card"><div class="row" style="border:0;min-height:0"><h3>${h(nt.name)}</h3>
          <label class="small"><input type="checkbox" data-nt="${nt.id}" data-key="use" ${map.use ? "checked" : ""} style="vertical-align:middle;width:20px;height:20px" /> usar</label></div>
        <p>${counts.get(nt.id)} notas</p>
        <div class="map-row"><span>Português</span>${select("pt", false)}</div>
        <div class="map-row"><span>Inglês</span>${select("en", false)}</div>
        <div class="map-row"><span>Áudio</span>${select("audio", true)}</div>
        ${preview}</div>`;
    })
    .join("");
  show(
    `<div class="session-top"><button class="close" data-act="cancel-import" aria-label="Cancelar">✕</button><h2 style="font-size:18px">Conferir os campos</h2></div>
    <div class="scroll"><p class="small" style="white-space:normal;margin:0 4px 14px">Para cada tipo de nota, confira qual campo é o português e qual é o inglês. O exemplo mostra como a primeira nota fica.</p>
      ${blocks}
      <div class="card"><label class="row" style="border:0"><span>Manter meu progresso do Anki</span><input type="checkbox" id="keep-progress" ${keepProgress ? "checked" : ""} /></label>
        <p>Frases que você já revisa no Anki entram direto na revisão, com as mesmas datas.</p></div></div>
    <div class="session-foot"><button class="btn" data-act="confirm-import">Importar</button></div>`,
    { showTabs: false },
  );
  for (const el of view.querySelectorAll("[data-nt]")) {
    el.onchange = () => {
      const map = pending.mappings.get(Number(el.dataset.nt));
      map[el.dataset.key] = el.type === "checkbox" ? el.checked : Number(el.value);
      showMapping();
    };
  }
  $("#keep-progress").onchange = (e) => (pending.keepProgress = e.target.checked);
}

async function confirmImport() {
  const { pkg, mappings, keepProgress } = pending;
  busy("Preparando as frases…");
  try {
    await nextFrame();
    const result = convertPackage(pkg, mappings, { keepProgress });
    if (!result.decks.length) {
      idle();
      alert("Nenhuma frase utilizável com esses campos. Confira qual campo é o português e qual é o inglês.");
      return;
    }
    const known = new Map(decks.map((d) => [d.id, d]));
    for (const deck of result.decks) {
      await decksDb.saveDeck(deck);
      known.set(deck.id, deck);
    }
    // Progresso que já existe no app vale mais do que o que vem do pacote.
    let carried = 0;
    for (const [id, item] of Object.entries(result.items)) {
      if (!state.items[id]) {
        state.items[id] = item;
        carried++;
      }
    }
    save();

    const wanted = pkg.media.filter((m) => result.audio.has(m.name));
    let saved = 0;
    for (let i = 0; i < wanted.length; i += 40) {
      busy(`Importando áudio… ${saved} de ${wanted.length}`);
      await nextFrame();
      const files = pkg.extractMedia(wanted.slice(i, i + 40));
      await decksDb.saveMedia(files);
      saved += files.length;
    }

    decks = [...known.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
    indexContent();
    pending = null;
    idle();
    showDecks();
    const total = result.decks.reduce((sum, d) => sum + d.sentences.length, 0);
    const left = result.skipped.long + result.skipped.empty + result.skipped.unmapped;
    alert(
      `Importação concluída.\n\n${total} frases em ${result.decks.length} ${result.decks.length === 1 ? "baralho" : "baralhos"}\n${saved} áudios` +
        (carried ? `\n${carried} frases já em revisão (progresso do Anki)` : "") +
        (left ? `\n${left} notas ficaram de fora (vazias, longas demais ou de tipo não usado)` : ""),
    );
  } catch (err) {
    idle();
    console.error(err);
    alert(`Não foi possível importar.\n\n${err.message || err}`);
  }
}

// ---------- Aba Perfil ----------

function showProfile() {
  tab = "profile";
  session = null;
  const today = srs.dayStart();
  const level = game.levelInfo(state.xp);
  const items = Object.entries(state.items).filter(([id]) => byId.has(id));
  const learned = items.filter(([, item]) => !srs.isNew(item)).length;
  const mastered = items.filter(([, item]) => srs.isMastered(item)).length;
  const counts = srs.forecast(Object.fromEntries(items), Date.now(), 7);
  const peak = Math.max(1, ...counts);
  const names = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const bars = counts
    .map((n, i) => {
      const label = i === 0 ? "hoje" : names[new Date(srs.addDays(today, i)).getDay()];
      return `<div><span>${n}</span><i style="height:${Math.round((n / peak) * 70)}px"></i><span>${label}</span></div>`;
    })
    .join("");
  const goals = [10, 20, 30, 50].map((g) => `<option value="${g}" ${g === state.goal ? "selected" : ""}>${g} XP</option>`).join("");
  show(`${topBar("Perfil")}<div class="scroll">
    <div class="card"><div class="row" style="border:0;min-height:0"><h3>Nível ${level.level}</h3><span class="small">${level.into} / ${level.span} XP</span></div>
      <div style="margin-top:10px">${barHtml(level.into / level.span, "primary")}</div></div>
    <div class="grid">
      <div><b>🔥 ${game.currentStreak(state.streak, today)}</b><span>Sequência atual</span></div>
      <div><b>${state.streak.best}</b><span>Maior sequência</span></div>
      <div><b>${learned}</b><span>Frases aprendidas</span></div>
      <div><b>${mastered}</b><span>Frases dominadas</span></div>
    </div>
    <div class="card"><h3>Revisões dos próximos dias</h3><p>Quantas frases voltam em cada dia.</p><div class="forecast">${bars}</div></div>
    <p class="section-title">Ajustes</p>
    <div class="card">
      <label class="row"><span>Meta diária</span><select id="goal">${goals}</select></label>
      <label class="row"><span>Som e exercícios de ouvir</span><input type="checkbox" id="sound" ${state.settings.sound ? "checked" : ""} /></label>
    </div>
    <p class="section-title">Backup do progresso</p>
    <div class="card">
      <p>O progresso fica só neste aparelho. O backup guarda XP, sequência e as datas de revisão; os baralhos do Anki precisam ser importados de novo.</p>
      <button class="link" data-act="export">Salvar backup</button>
      <button class="link" data-act="restore">Restaurar backup</button>
      <button class="link danger" data-act="reset">Apagar tudo</button>
    </div></div>`);
  $("#goal").onchange = (e) => {
    state.goal = Number(e.target.value);
    save();
  };
  $("#sound").onchange = (e) => {
    state.settings.sound = e.target.checked;
    save();
  };
}

async function exportBackup() {
  const name = `trilha-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([store.exportJson(state)], name, { type: "application/json" });
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

async function restoreBackup(file) {
  try {
    const restored = store.importJson(await file.text());
    const learned = Object.keys(restored.items).length;
    if (!confirm(`Restaurar este backup (${restored.xp} XP, ${learned} frases)? Isso substitui o progresso atual (${state.xp} XP).`)) return;
    state = restored;
    save();
    showProfile();
    toast("Backup restaurado.");
  } catch (err) {
    alert(err.message || String(err));
  }
}

async function resetAll() {
  if (!confirm(`Apagar todo o progresso (${state.xp} XP, ${Object.keys(state.items).length} frases) e os ${decks.length} baralhos importados? Isso não pode ser desfeito.`)) return;
  await decksDb.clearAll();
  state = store.defaultState();
  save();
  decks = [];
  indexContent();
  showPath();
  toast("Tudo apagado.");
}

// ---------- Eventos ----------

const openTab = { path: showPath, decks: showDecks, profile: showProfile };

const actions = {
  tab: (el) => openTab[el.dataset.tab](),
  "open-lesson": (el) => showLessonIntro(Number(el.dataset.i)),
  "say-word": (el) => state.settings.sound && speech.speak(el.dataset.text),
  "start-lesson": (el) => startCourseLesson(Number(el.dataset.i)),
  review: startReview,
  "deck-lesson": (el) => startDeckLesson(Number(el.dataset.id)),
  "delete-deck": (el) => deleteDeck(Number(el.dataset.id)),
  import: () => $("#file-apkg").click(),
  "cancel-import": () => {
    pending = null;
    showDecks();
  },
  "confirm-import": confirmImport,
  pick: (el) => {
    const cur = session.current;
    const id = Number(el.dataset.id);
    if (cur.picked.includes(id)) return;
    cur.picked.push(id);
    drawSession();
    // No exercício de ouvir, falar a palavra tocada entregaria a resposta.
    if (state.settings.sound && session.queue[0].type === "build") speech.speak(cur.bank[id].text);
  },
  unpick: (el) => {
    const cur = session.current;
    cur.picked = cur.picked.filter((id) => id !== Number(el.dataset.id));
    drawSession();
  },
  select: (el) => {
    session.current.selected = Number(el.dataset.i);
    drawSession();
  },
  say: () => say((session.shown && session.phase === "feedback" ? session.shown : session.queue[0]).s),
  "say-slow": () => say(session.queue[0].s, true),
  check: checkAnswer,
  continue: continueSession,
  quit: () => {
    if (confirm("Sair desta sessão? O progresso dela será perdido.")) {
      const back = session.back;
      stopSound();
      back();
    }
  },
  leave: () => session.back(),
  export: exportBackup,
  restore: () => $("#file-backup").click(),
  reset: resetAll,
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-act]");
  if (!el || el.disabled) return;
  Promise.resolve(actions[el.dataset.act]?.(el)).catch((err) => {
    console.error(err);
    idle();
    toast(`Erro: ${err.message || err}`, 5000);
  });
});

function onFile(selector, handler) {
  $(selector).addEventListener("change", (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) handler(file);
  });
}

onFile("#file-apkg", readPackage);
onFile("#file-backup", restoreBackup);

// Ao voltar para o app em outro dia, a sequência e as revisões vencidas são recalculadas.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !tabs.hidden) openTab[tab]();
});

async function boot() {
  try {
    decks = (await decksDb.loadDecks()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
  } catch (err) {
    console.error(err);
    decks = [];
  }
  indexContent();
  showPath();
  navigator.storage?.persist?.().catch(() => {});
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

boot();
