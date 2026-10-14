// Aba Revisão: os flashcards do dia, o baralho de palavras em contexto, a explicação do método
// e os cartões próprios (que liberam depois de uma base de palavras).

import { $, h, app, actions, tabViews, show, save, toast, titleBar, barHtml, byId, indexContent, allSentences, todayCards, wordsLearned, customUnlocked, strengthDots, dueLabel, openTab, srs, game, ex } from "../core.js";
import { WORDS, CONTEXTS_PER_WORD } from "../words.js";
import { startCards } from "./cards.js";

const MAX_WORDS = 14;

function explainer() {
  const steps = [1, 3, 8, 20, 50].map((d, i) => `<div><b>${d}</b><span>${d === 1 ? "dia" : "dias"}</span>${i < 4 ? "<em>→</em>" : ""}</div>`).join("");
  return `<details class="card explain"><summary><span>🧠</span><div><h3>Como funciona a revisão espaçada</h3><p>Toque para entender o método</p></div></summary>
    <p>A memória apaga depressa o que acabou de aprender. Rever uma frase <b>pouco antes de esquecê-la</b> fixa muito mais do que repetir várias vezes no mesmo dia.</p>
    <p>Por isso cada cartão tem a sua própria data de revisão. A cada acerto, o intervalo até a próxima fica maior:</p>
    <div class="ladder">${steps}</div>
    <p>Você mesmo diz como foi, em quatro botões:</p>
    <ul class="grades-help">
      <li><b class="again">Errei</b> o cartão volta ainda nesta sessão e recomeça em 1 dia.</li>
      <li><b class="hard">Difícil</b> lembrei com esforço: o intervalo cresce pouco.</li>
      <li><b class="good">Bom</b> lembrei: o intervalo cresce no ritmo normal.</li>
      <li><b class="easy">Fácil</b> lembrei na hora: o cartão vai para bem mais longe.</li>
    </ul>
    <p>Seja honesto nos botões. Marcar "Bom" sem ter lembrado só adia o esquecimento.</p></details>`;
}

function todayCard() {
  const { due, fresh, newWords } = todayCards();
  const total = due.length + fresh.length;
  if (!total) {
    const learned = Object.keys(app.state.items).filter((id) => byId.has(id)).length;
    const finished = wordsLearned() === WORDS.length;
    return `<div class="card today"><p class="section-title">Para hoje</p><h2>${learned ? "Tudo em dia ✓" : "Nada ainda"}</h2>
      <p>${learned ? `Nenhum cartão vence hoje${finished ? "" : " e as palavras novas de hoje já foram vistas"}. Volte amanhã.` : "Comece pelas palavras de hoje."}</p></div>`;
  }
  const parts = [];
  if (due.length) parts.push(`<div><b class="c-due">${due.length}</b><span>para revisar</span></div>`);
  if (fresh.length) parts.push(`<div><b class="c-new">${fresh.length}</b><span>${fresh.length === 1 ? "cartão novo" : "cartões novos"}</span></div>`);
  const words = newWords.length ? `<p>Palavras novas de hoje: ${newWords.map((id) => `<b lang="en">${h(id)}</b>`).join(", ")}.</p>` : "";
  return `<div class="card today"><p class="section-title">Para hoje</p><div class="split">${parts.join("")}</div>${words}
    <button class="btn ok" data-act="cards">Estudar ${Math.min(total, 20)} ${total === 1 ? "cartão" : "cartões"}</button>
    <p class="small wrap">Revisar não gasta vidas, e cada sessão concluída devolve 1 ❤️.</p></div>`;
}

function wordsCard() {
  const learned = wordsLearned();
  const started = WORDS.filter((w) => w.id in app.state.words);
  const perDay = app.state.profile.wordsPerDay;
  const chips = started
    .map((w) => {
      const seen = w.cards.filter((c) => !srs.isNew(app.state.items[c.id])).length;
      return `<span class="word-chip ${seen === CONTEXTS_PER_WORD ? "done" : ""}" lang="en">${h(w.word)}${seen < CONTEXTS_PER_WORD ? ` <small>${seen}/${CONTEXTS_PER_WORD}</small>` : ""}</span>`;
    })
    .join("");
  return `<p class="section-title">Palavras em contexto</p>
    <div class="card"><div class="row plain"><h3>${learned} de ${WORDS.length} palavras</h3><span class="small">${perDay} ${perDay === 1 ? "nova" : "novas"} por dia</span></div>
      <div class="goal" style="margin-top:10px">${barHtml(learned / WORDS.length, "primary")}</div>
      <p style="margin-top:10px">Os 50 verbos mais usados do inglês. Cada um aparece em ${CONTEXTS_PER_WORD} frases diferentes, para você aprender a palavra pelo uso.</p>
      ${chips ? `<div class="word-chips">${chips}</div>` : ""}</div>`;
}

function forecastCard() {
  const known = Object.fromEntries(Object.entries(app.state.items).filter(([id]) => byId.has(id)));
  const counts = srs.forecast(known, Date.now(), 7);
  counts[0] += todayCards().fresh.length;
  if (!counts.some(Boolean)) return "";
  const peak = Math.max(...counts);
  const names = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const today = srs.dayStart();
  const bars = counts
    .map((n, i) => `<div><span>${n}</span><i style="height:${Math.round((n / peak) * 64)}px"></i><span>${i === 0 ? "hoje" : names[new Date(srs.addDays(today, i)).getDay()]}</span></div>`)
    .join("");
  return `<div class="card"><h3>Próximos 7 dias</h3><p>Quantos cartões vencem em cada dia.</p><div class="forecast">${bars}</div></div>`;
}

function customCard() {
  if (!customUnlocked()) {
    const learned = wordsLearned();
    return `<p class="section-title">Meus cartões</p>
      <div class="card locked-card"><div class="row plain"><h3>🔒 Libera com ${game.CUSTOM_UNLOCK_WORDS} palavras</h3><span class="small">${learned} / ${game.CUSTOM_UNLOCK_WORDS}</span></div>
        <div class="goal" style="margin-top:10px">${barHtml(learned / game.CUSTOM_UNLOCK_WORDS)}</div>
        <p style="margin-top:10px">Primeiro a base: com ${game.CUSTOM_UNLOCK_WORDS} palavras aprendidas, você passa a criar os seus próprios cartões com as frases que encontrar por aí.</p></div>`;
  }
  const list = app.state.custom;
  const rows = list
    .map(
      (s) => `<div class="mine"><div><b lang="en">${h(s.en)}</b><span>${h(s.pt)}</span><small>${strengthDots(s.id)} próxima revisão: ${dueLabel(s.id)}</small></div>
        <button class="link danger" data-act="delete-custom" data-id="${h(s.id)}" aria-label="Excluir">✕</button></div>`,
    )
    .join("");
  return `<p class="section-title">Meus cartões</p>
    <div class="card"><p>Ouviu uma frase em uma série ou em uma reunião? Crie um cartão e ela entra na sua revisão de hoje.</p>
      <label class="field"><span>Frente (português)</span><input id="new-pt" type="text" placeholder="Eu já volto." autocomplete="off" /></label>
      <label class="field"><span>Verso (inglês)</span><input id="new-en" type="text" lang="en" placeholder="I'll be right back." autocapitalize="sentences" autocomplete="off" /></label>
      <button class="btn" data-act="add-custom">Criar cartão</button></div>
    ${list.length ? `<div class="card list">${rows}</div>` : ""}`;
}

function showReview() {
  show(`${titleBar("Revisão", "Flashcards com repetição espaçada")}<div class="scroll">${todayCard()}${wordsCard()}${explainer()}${forecastCard()}${customCard()}</div>`);
}

function addCustom() {
  const clean = (value) => value.trim().replace(/\s+/g, " ");
  const en = clean($("#new-en").value);
  const pt = clean($("#new-pt").value);
  if (!en || !pt) return toast("Preencha a frente e o verso do cartão.");
  if (!/[a-z]/i.test(en)) return toast("O verso precisa ter a frase em inglês.");
  if (ex.tokenize(en).length > MAX_WORDS) return toast(`Use frases de até ${MAX_WORDS} palavras: cartão curto se fixa melhor.`);
  if (allSentences().some((s) => ex.canon(s.en) === ex.canon(en))) return toast("Essa frase já está no app.");
  app.state.custom.push({ id: `c${Date.now()}`, en, pt });
  save();
  indexContent();
  toast("Cartão criado. Ele já está na revisão de hoje.");
  showReview();
}

function deleteCustom(id) {
  const s = app.state.custom.find((c) => c.id === id);
  if (!s || !confirm(`Excluir o cartão "${s.en}" e o progresso dele?`)) return;
  app.state.custom = app.state.custom.filter((c) => c.id !== id);
  delete app.state.items[id];
  save();
  indexContent();
  showReview();
}

Object.assign(actions, {
  cards: () => startCards(() => openTab("review")),
  "add-custom": addCustom,
  "delete-custom": (el) => deleteCustom(el.dataset.id),
});

tabViews.review = showReview;
