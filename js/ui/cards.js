// Sessão de flashcards, no estilo do Anki: a frente em português, a resposta em inglês com áudio,
// e quatro botões para dizer como foi. O botão escolhido decide quando o cartão volta.

import { $, h, app, actions, show, save, barHtml, byId, daily, say, sayWord, effect, todayCards, srs, audio, fx } from "../core.js";
import { wordById, highlight, CONTEXTS_PER_WORD } from "../words.js";
import { owl } from "../owl.js";
import { complete } from "./session.js";

const SESSION_SIZE = 20;
const REQUEUE_GAP = 3; // quantos cartões passam antes de um "Errei" reaparecer

const BUTTONS = [
  { rating: srs.AGAIN, cls: "again", text: "Errei" },
  { rating: srs.HARD, cls: "hard", text: "Difícil" },
  { rating: srs.GOOD, cls: "good", text: "Bom" },
  { rating: srs.EASY, cls: "easy", text: "Fácil" },
];

let deck = null;

export function startCards(back) {
  const { due, fresh } = todayCards();
  // Revisões vencidas primeiro, como no Anki; depois os cartões novos, na ordem das palavras.
  const queue = [...due, ...fresh].slice(0, SESSION_SIZE);
  if (!queue.length) return back();
  deck = {
    queue,
    total: queue.length,
    done: 0,
    lapses: 0,
    rated: new Set(), // cartões que já tiveram a primeira resposta (a que vale para o agendamento)
    introduced: new Set(), // palavras novas já apresentadas nesta sessão
    shown: false,
    startedAt: Date.now(),
    back,
  };
  app.session = { back };
  next();
}

function next() {
  if (!deck.queue.length) return complete({ kind: "review", mistakes: deck.lapses, total: deck.total, startedAt: deck.startedAt, back: deck.back });
  const card = byId.get(deck.queue[0]);
  deck.shown = false;
  if (card.audio) audio.preload([card.audio]);
  const word = card.wordId && wordById.get(card.wordId);
  // Palavra nunca vista: a coruja apresenta antes do primeiro cartão dela.
  if (word && !(word.id in app.state.words) && !deck.introduced.has(word.id)) return drawIntro(word);
  drawCard();
  fx.enter($(".flash"), { from: "translateX(28px)" });
  // Cartão com o inglês na frente já fala a frase ao aparecer.
  if (card.front === "en") say(card);
}

function top() {
  const left = deck.queue.map((id) => srs.isNew(app.state.items[id]) && !deck.rated.has(id));
  const fresh = left.filter(Boolean).length;
  return `<div class="session-top"><button class="close" data-act="card-quit" aria-label="Sair">✕</button>${barHtml(deck.done / deck.total, "green")}
    <span class="counts"><b class="c-new">${fresh}</b><b class="c-due">${left.length - fresh}</b></span></div>`;
}

function drawIntro(word) {
  deck.introduced.add(word.id);
  show(
    `${top()}<div class="center intro">
      <span class="tag">Palavra nova</span>
      <button class="word-big" data-act="card-word" data-word="${h(word.word)}" lang="en">${h(word.word)} <span>🔊</span></button>
      <p class="gloss">${h(word.pt)}</p>
      <div class="talk">${owl("normal", 84)}<div class="bubble"><p>Você vai ver <b>${h(word.word)}</b> em ${CONTEXTS_PER_WORD} frases diferentes. É assim que a palavra gruda: pelo uso, não pela tradução.</p></div></div>
    </div>
    <div class="session-foot"><button class="btn" data-act="card-start-word">Ver as frases</button></div>`,
    { showTabs: false },
  );
  sayWord(word.word);
}

function sourceTag(card) {
  if (card.wordId) return `Palavra: ${card.wordId}`;
  if (card.from) return "Das histórias";
  return card.custom ? "Meu cartão" : "Frase da trilha";
}

function english(card) {
  const word = card.wordId && wordById.get(card.wordId);
  if (!word) return h(card.en);
  return highlight(word, card.en)
    .map((part) => (part.hit ? `<mark>${h(part.text)}</mark>` : h(part.text)))
    .join("");
}

function drawCard() {
  const card = byId.get(deck.queue[0]);
  const item = app.state.items[card.id];
  const fresh = srs.isNew(item) && !deck.rated.has(card.id);
  const word = card.wordId && wordById.get(card.wordId);
  // A frente pode ser o português (padrão: você produz o inglês) ou o inglês (você reconhece o sentido).
  const englishFirst = card.front === "en";
  const frontHtml = englishFirst
    ? `<p class="front" lang="en">${h(card.en)}</p><button class="speak big" data-act="card-say" aria-label="Ouvir">🔊</button>`
    : `<p class="front">${h(card.pt)}</p>`;
  const backText = englishFirst ? `<p class="back">${h(card.pt)}</p>` : `<p class="back" lang="en">${english(card)}</p>`;
  const back = deck.shown
    ? `<hr />${backText}
       ${word ? `<p class="gloss"><b lang="en">${h(word.word)}</b> = ${h(word.pt)}</p>` : ""}
       ${englishFirst ? "" : `<button class="speak big" data-act="card-say" aria-label="Ouvir de novo">🔊</button>`}`
    : "";
  const foot = deck.shown
    ? `<div class="grades">${BUTTONS.map((b) => {
        // "Errei" faz o cartão voltar ainda nesta sessão; os outros mostram em quantos dias ele retorna.
        const when = b.rating === srs.AGAIN ? "de novo" : deck.rated.has(card.id) ? "ok" : srs.intervalLabel(item, b.rating);
        return `<button class="grade ${b.cls}" data-act="card-rate" data-r="${b.rating}">${b.text}<small>${when}</small></button>`;
      }).join("")}</div>`
    : `<button class="btn" data-act="card-show">Mostrar resposta</button>`;
  show(
    `${top()}<div class="flash" data-id="${h(card.id)}" data-shown="${deck.shown}">
      <span class="tag ${fresh ? "" : "plain"}">${fresh ? "Novo · " : ""}${h(sourceTag(card))}</span>
      <p class="hint">${deck.shown ? "Como foi?" : englishFirst ? "O que significa?" : "Diga em inglês, em voz alta"}</p>
      ${frontHtml}${back}</div>
    <div class="session-foot">${foot}</div>`,
    { showTabs: false },
  );
}

function rate(rating) {
  const id = deck.queue.shift();
  const card = byId.get(id);
  const state = app.state;
  // Só a primeira resposta de cada cartão mexe no agendamento; as repetições são treino.
  if (!deck.rated.has(id)) {
    deck.rated.add(id);
    state.items[id] = srs.rate(state.items[id] || srs.newItem(), rating);
    if (card.wordId) state.words[card.wordId] ??= srs.dayStart();
    daily().reviewed++;
    if (rating === srs.AGAIN) deck.lapses++;
    save();
  }
  if (rating === srs.AGAIN) {
    deck.queue.splice(Math.min(REQUEUE_GAP, deck.queue.length), 0, id);
    effect("wrong");
  } else {
    deck.done++;
    effect("tap");
  }
  audio.stop();
  next();
}

Object.assign(actions, {
  "card-show": () => {
    deck.shown = true;
    drawCard();
    effect("flip");
    fx.enter($(".flash .back"), { from: "rotateX(85deg)", duration: 280 });
    const card = byId.get(deck.queue[0]);
    if (card.front !== "en") say(card);
  },
  "card-say": () => say(byId.get(deck.queue[0])),
  "card-word": (el) => sayWord(el.dataset.word),
  "card-start-word": drawCard,
  "card-rate": (el) => rate(Number(el.dataset.r)),
  "card-quit": () => {
    // As respostas já dadas ficam salvas; sair só interrompe a sessão.
    const back = deck.back;
    audio.stop();
    back();
  },
});
