// Aba Histórias: contos curtos em partes, uma parte nova por dia. A leitura avança frase a frase,
// com a tradução embaixo; dá para tocar em uma palavra para ver o significado e ouvir,
// e mandar frases ou palavras para os flashcards.

import { $, h, app, actions, tabViews, show, save, toast, titleBar, barHtml, indexContent, allSentences, openTab, effect, audio, srs, ex, fx } from "../core.js";
import { STORIES, GLOSSARY, storyById, pieces } from "../stories.js";
import { storyFile, wordFile } from "../audio-paths.js";
import { character, castFor } from "../characters.js";
import { owl } from "../owl.js";
import { startSession } from "./session.js";

const QUIZ_SIZE = 3;

// Estado da leitura em andamento.
let reader = null;

const progress = (id) => app.state.stories[id] || { done: 0, day: 0 };
const finished = (story) => progress(story.id).done >= story.parts.length;

// Uma parte nova por dia, contando todas as histórias.
function readToday() {
  const today = srs.dayStart();
  return Object.values(app.state.stories).some((p) => p.day === today);
}

function unlockedStory(index) {
  return index === 0 || finished(STORIES[index - 1]);
}

function storyCard(story, index) {
  const { done } = progress(story.id);
  const open = unlockedStory(index);
  const parts = story.parts
    .map((part) => {
      if (part.index < done) return `<button class="part done" data-act="story-read" data-story="${story.id}" data-part="${part.index}"><span>✓</span><b>${h(part.title)}</b><em>reler</em></button>`;
      if (part.index === done && open) {
        return readToday()
          ? `<div class="part wait"><span>🌙</span><b>${h(part.title)}</b><em>amanhã</em></div>`
          : `<button class="part next" data-act="story-read" data-story="${story.id}" data-part="${part.index}"><span>▶</span><b>${h(part.title)}</b><em>ler agora</em></button>`;
      }
      return `<div class="part locked"><span>🔒</span><b>${h(part.title)}</b></div>`;
    })
    .join("");
  return `<div class="card story ${open ? "" : "muted"}"><div class="story-head"><span class="story-icon">${story.icon}</span>
      <div><h3 lang="en">${h(story.title)}</h3><p>${h(story.pt)} · nível ${story.level}</p></div></div>
    <div class="goal">${barHtml(done / story.parts.length, "primary")}<span class="small">${done} / ${story.parts.length}</span></div>
    <div class="parts">${parts}</div>${open ? "" : `<p class="small wrap">Termine a história anterior para liberar esta.</p>`}</div>`;
}

function showStories() {
  reader = null;
  const saved = app.state.custom.filter((c) => c.from).length;
  show(`${titleBar("Histórias", "Uma parte nova por dia")}<div class="scroll">
    <div class="card hero"><div class="talk">${owl("happy", 88)}<div class="bubble"><p>Leia um pedacinho por dia. Toque em qualquer palavra para ver o que significa, e no <b>＋</b> para guardar a frase nos seus flashcards.</p></div></div>
      ${saved ? `<p class="small wrap">Você já guardou ${saved} ${saved === 1 ? "cartão" : "cartões"} das histórias. Eles aparecem na aba Revisão.</p>` : ""}</div>
    ${STORIES.map(storyCard).join("")}</div>`);
}

// ---------- Leitura ----------

function openPart(storyId, partIndex) {
  const story = storyById.get(storyId);
  const done = progress(storyId).done;
  if (partIndex > done || (partIndex === done && readToday())) return showStories();
  reader = { story, part: story.parts[partIndex], shown: 1, showPt: true, reread: partIndex < done, cast: castFor(storyId) };
  audio.preload(reader.part.sentences.map((s) => storyFile(s.id)));
  drawReader(true);
  playSentence(0);
}

const isSaved = (key) => app.state.custom.some((c) => c.from === key);

function sentenceHtml(s, index) {
  const words = pieces(s.en)
    .map((p) => (p.word ? `<button class="w" data-act="story-word" data-word="${h(p.word)}">${h(p.text)}</button>` : h(p.text)))
    .join("");
  const saved = isSaved(s.id);
  return `<div class="line" data-i="${index}">
    <button class="speak" data-act="story-say" data-i="${index}" aria-label="Ouvir">🔊</button>
    <div><p class="en" lang="en">${words}</p><p class="pt ${reader.showPt ? "" : "veil"}" data-act="story-peek">${h(s.pt)}</p></div>
    <button class="add ${saved ? "saved" : ""}" data-act="story-save" data-i="${index}" aria-label="${saved ? "Já está nos flashcards" : "Guardar nos flashcards"}">${saved ? "✓" : "＋"}</button></div>`;
}

function drawReader(first = false) {
  const { story, part, shown, showPt, reread } = reader;
  const total = part.sentences.length;
  const end = shown >= total;
  const foot = !end
    ? `<button class="btn" data-act="story-next">Continuar</button>`
    : reread
      ? `<button class="btn ok" data-act="tab" data-tab="stories">Concluir</button>`
      : `<button class="btn ok" data-act="story-quiz">Responder ${QUIZ_SIZE} perguntas</button>`;
  show(
    `<div class="session-top"><button class="close" data-act="tab" data-tab="stories" aria-label="Fechar">✕</button>${barHtml(shown / total, "green")}
      <button class="pt-toggle ${showPt ? "on" : ""}" data-act="story-toggle" aria-label="Mostrar ou esconder o português">PT</button></div>
    <div class="scroll reader">
      <div class="reader-head">${character(reader.cast, { height: 118 })}<div><p class="section-title">${h(story.pt)} · parte ${part.index + 1}</p><h2>${h(part.title)}</h2></div></div>
      ${part.sentences.slice(0, shown).map(sentenceHtml).join("")}
    </div>
    <div class="session-foot">${foot}</div>`,
    { showTabs: false },
  );
  const scroll = $(".reader");
  scroll.scrollTop = scroll.scrollHeight;
  fx.enter(first ? scroll : scroll.querySelector(".line:last-child"));
}

function playSentence(index) {
  if (app.state.settings.sound) audio.play(storyFile(reader.part.sentences[index].id));
}

function closeSheet() {
  $(".sheet")?.remove();
}

// Ficha de uma palavra: significado, áudio e o botão para virar flashcard.
function openWord(word) {
  closeSheet();
  const meaning = GLOSSARY[word] || "";
  const saved = isSaved(`word:${word}`);
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.innerHTML = `<div class="sheet-back" data-act="story-close"></div><div class="sheet-box">
    <div class="sheet-head"><button class="speak big" data-act="story-word-say" data-word="${h(word)}" aria-label="Ouvir">🔊</button><div><h3 lang="en">${h(word)}</h3><p>${h(meaning || "Sem tradução cadastrada para esta palavra.")}</p></div></div>
    <div class="listen-row"><button class="btn ghost" data-act="story-save-word" data-word="${h(word)}" ${saved || !meaning ? "disabled" : ""}>${saved ? "✓ Nos flashcards" : "＋ Flashcard"}</button><button class="btn" data-act="story-close">Fechar</button></div></div>`;
  document.querySelector("#view").append(sheet);
  fx.enter(sheet.querySelector(".sheet-box"), { from: "translateY(100%)", duration: 220 });
  if (app.state.settings.sound && audio.has(wordFile(word))) audio.play(wordFile(word));
}

// Cartão vindo da história: inglês na frente, português atrás, com o áudio gravado.
function saveCard({ key, en, pt, file }) {
  if (isSaved(key)) return false;
  if (allSentences().some((s) => !s.from && ex.canon(s.en) === ex.canon(en))) {
    toast("Essa frase já está nos seus cartões.");
    return false;
  }
  app.state.custom.push({ id: `c${Date.now()}`, en, pt, front: "en", audio: file, from: key });
  save();
  indexContent();
  effect("match");
  toast("Guardado nos flashcards. Aparece na revisão de hoje.");
  return true;
}

function startQuiz() {
  const { story, part } = reader;
  const today = srs.dayStart();
  app.state.stories[story.id] = { done: Math.max(progress(story.id).done, part.index + 1), day: today };
  save();
  const plan = ex.sample(part.sentences, QUIZ_SIZE).map((s) => ({ s: { ...s, alts: [], audio: audio.has(storyFile(s.id)) ? storyFile(s.id) : null }, type: "choice" }));
  startSession({ kind: "story", title: story.id, plan, back: () => openTab("stories") });
}

Object.assign(actions, {
  "story-read": (el) => openPart(el.dataset.story, Number(el.dataset.part)),
  "story-next": () => {
    reader.shown++;
    effect("tap");
    drawReader();
    playSentence(reader.shown - 1);
  },
  "story-say": (el) => playSentence(Number(el.dataset.i)),
  "story-toggle": () => {
    reader.showPt = !reader.showPt;
    drawReader();
  },
  // Com o português escondido, tocar na linha revela só aquela tradução.
  "story-peek": (el) => el.classList.remove("veil"),
  "story-word": (el) => openWord(el.dataset.word),
  "story-word-say": (el) => audio.has(wordFile(el.dataset.word)) && audio.play(wordFile(el.dataset.word)),
  "story-close": closeSheet,
  "story-save": (el) => {
    const s = reader.part.sentences[Number(el.dataset.i)];
    if (saveCard({ key: s.id, en: s.en, pt: s.pt, file: storyFile(s.id) })) {
      el.textContent = "✓";
      el.classList.add("saved");
      fx.pop(el);
    }
  },
  "story-save-word": (el) => {
    const word = el.dataset.word;
    if (saveCard({ key: `word:${word}`, en: word, pt: GLOSSARY[word], file: wordFile(word) })) closeSheet();
  },
  "story-quiz": startQuiz,
});

tabViews.stories = showStories;
