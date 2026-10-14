// Aba Revisão: a repetição espaçada à vista. Explica o método, mostra o que vence hoje
// e deixa o usuário cadastrar as próprias frases para revisar.

import { $, h, app, actions, tabViews, show, save, toast, titleBar, byId, indexContent, dueIds, freshCustom, allSentences, canListen, strengthDots, dueLabel, openTab, srs, game, ex } from "../core.js";
import { startSession } from "./session.js";

const MAX_WORDS = 14;

function todayIds() {
  return [...dueIds(), ...freshCustom()];
}

function explainer() {
  const steps = [1, 3, 8, 20, 50].map((d, i) => `<div><b>${d}</b><span>${d === 1 ? "dia" : "dias"}</span>${i < 4 ? "<em>→</em>" : ""}</div>`).join("");
  return `<details class="card explain"><summary><span>🧠</span><div><h3>Como funciona a revisão espaçada</h3><p>Toque para entender o método</p></div></summary>
    <p>A memória apaga depressa o que acabou de aprender. Rever uma frase <b>pouco antes de esquecê-la</b> fixa muito mais do que repetir várias vezes no mesmo dia.</p>
    <p>Por isso cada frase tem a sua própria data de revisão. A cada acerto, o intervalo até a próxima fica maior:</p>
    <div class="ladder">${steps}</div>
    <p><b>Errou?</b> A frase volta para 1 dia e passa a crescer mais devagar, porque ficou marcada como difícil.</p>
    <p>Na prática: entre aqui todo dia e revise só o que o app mostrar. São poucos minutos, e as frases antigas aparecem cada vez menos.</p></details>`;
}

function todayCard() {
  const ids = todayIds();
  if (ids.length) {
    const size = Math.min(ids.length, game.REVIEW_SIZE);
    return `<div class="card today"><p class="section-title">Para hoje</p><h2>${ids.length} ${ids.length === 1 ? "frase" : "frases"}</h2>
      <p>Revisar não gasta vidas, e cada sessão concluída devolve 1 ❤️.</p>
      <button class="btn ok" data-act="review">Revisar ${size} ${size === 1 ? "frase" : "frases"}</button></div>`;
  }
  const learned = Object.keys(app.state.items).filter((id) => byId.has(id)).length;
  return `<div class="card today"><p class="section-title">Para hoje</p><h2>${learned ? "Tudo em dia ✓" : "Nada ainda"}</h2>
    <p>${learned ? "Nenhuma frase vence hoje. Volte amanhã, ou cadastre frases novas abaixo." : "Conclua uma lição na trilha ou cadastre uma frase abaixo. Ela entra na revisão no mesmo dia."}</p></div>`;
}

function forecastCard() {
  const known = Object.fromEntries(Object.entries(app.state.items).filter(([id]) => byId.has(id)));
  const counts = srs.forecast(known, Date.now(), 7);
  counts[0] += freshCustom().length;
  if (!counts.some(Boolean)) return "";
  const peak = Math.max(...counts);
  const names = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const today = srs.dayStart();
  const bars = counts
    .map((n, i) => `<div><span>${n}</span><i style="height:${Math.round((n / peak) * 64)}px"></i><span>${i === 0 ? "hoje" : names[new Date(srs.addDays(today, i)).getDay()]}</span></div>`)
    .join("");
  return `<div class="card"><h3>Próximos 7 dias</h3><p>Quantas frases vencem em cada dia.</p><div class="forecast">${bars}</div></div>`;
}

function customCard() {
  const list = app.state.custom;
  const rows = list
    .map(
      (s) => `<div class="mine"><div><b lang="en">${h(s.en)}</b><span>${h(s.pt)}</span><small>${strengthDots(s.id)} próxima revisão: ${dueLabel(s.id)}</small></div>
        <button class="link danger" data-act="delete-custom" data-id="${h(s.id)}" aria-label="Excluir">✕</button></div>`,
    )
    .join("");
  return `<p class="section-title">Minhas frases</p>
    <div class="card"><p>Ouviu uma frase em uma série ou em uma reunião? Cadastre aqui e ela entra na sua revisão.</p>
      <label class="field"><span>Em inglês</span><input id="new-en" type="text" lang="en" placeholder="I'll be right back." autocapitalize="sentences" autocomplete="off" /></label>
      <label class="field"><span>Em português</span><input id="new-pt" type="text" placeholder="Eu já volto." autocomplete="off" /></label>
      <button class="btn" data-act="add-custom">Adicionar frase</button></div>
    ${list.length ? `<div class="card list">${rows}</div>` : ""}`;
}

function showReview() {
  show(`${titleBar("Revisão", "Repetição espaçada")}<div class="scroll">${todayCard()}${explainer()}${forecastCard()}${customCard()}</div>`);
}

function startReview() {
  const sentences = allSentences();
  const plan = todayIds()
    .slice(0, game.REVIEW_SIZE)
    .map((id) => {
      const s = byId.get(id);
      const item = app.state.items[id];
      // Frase vista pela primeira vez começa pelo exercício mais fácil.
      const type = srs.isNew(item) ? (sentences.length >= 4 ? "choice" : "build") : ex.typeForStrength(srs.strength(item), { listen: canListen(s) });
      return { s, type };
    });
  startSession({ kind: "review", title: "Revisão", plan: ex.shuffle(plan), back: () => openTab("review") });
}

function addCustom() {
  const clean = (value) => value.trim().replace(/\s+/g, " ");
  const en = clean($("#new-en").value);
  const pt = clean($("#new-pt").value);
  if (!en || !pt) return toast("Preencha a frase em inglês e a tradução.");
  if (!/[a-z]/i.test(en)) return toast("A frase em inglês precisa ter letras.");
  if (ex.tokenize(en).length > MAX_WORDS) return toast(`Use frases de até ${MAX_WORDS} palavras; as maiores não cabem no exercício.`);
  if (allSentences().some((s) => ex.canon(s.en) === ex.canon(en))) return toast("Essa frase já está no app.");
  app.state.custom.push({ id: `c${Date.now()}`, en, pt });
  save();
  indexContent();
  toast("Frase adicionada. Ela já está na revisão de hoje.");
  showReview();
}

function deleteCustom(id) {
  const s = app.state.custom.find((c) => c.id === id);
  if (!s || !confirm(`Excluir "${s.en}" e o progresso dela?`)) return;
  app.state.custom = app.state.custom.filter((c) => c.id !== id);
  delete app.state.items[id];
  save();
  indexContent();
  showReview();
}

Object.assign(actions, {
  review: startReview,
  "add-custom": addCustom,
  "delete-custom": (el) => deleteCustom(el.dataset.id),
});

tabViews.review = showReview;
