// Os tipos de exercício: como cada um é montado e como a resposta é conferida.
//   pairs:  ligar cada palavra em inglês à tradução (usa o vocabulário da lição)
//   choice: ver a frase em inglês e escolher a tradução entre quatro opções
//   build:  ver a frase em português e montar a frase em inglês com um banco de palavras
//   listen: ouvir a frase e montar o que ouviu
//   type:   ver a frase em português e digitar a frase em inglês

export const TYPES = ["pairs", "choice", "build", "listen", "type"];

// A primeira palavra perde a maiúscula para não entregar o começo da frase, exceto "I" e nomes próprios.
const KEEP_CAPITAL = /^(I(['’].*)?|English|Brazil|London|Ana|Monday|Friday|TV)$/;

export function tokenize(sentence) {
  const words = sentence
    .replace(/[.,!?;:"“”()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length && !KEEP_CAPITAL.test(words[0])) {
    words[0] = words[0][0].toLowerCase() + words[0].slice(1);
  }
  return words;
}

const PRONOUN_IS = /\b(he|she|it|that|what|there|where|who|here|how)'s\b/g;

// Forma canônica para comparar respostas: ignora maiúsculas e pontuação e desfaz contrações,
// de modo que "I'm fine." e "i am fine" sejam a mesma resposta.
export function canon(text) {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\bcan't\b|\bcannot\b/g, "can not")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\blet's\b/g, "let us")
    .replace(/n't\b/g, " not")
    .replace(/'m\b/g, " am")
    .replace(/'re\b/g, " are")
    .replace(/'ll\b/g, " will")
    .replace(/'ve\b/g, " have")
    .replace(/'d\b/g, " would")
    .replace(PRONOUN_IS, "$1 is")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// `response` é um texto (type), uma lista de palavras (build, listen) ou a opção escolhida (choice).
export function check(type, response, sentence) {
  if (type === "choice") return response === sentence.pt;
  const given = canon(Array.isArray(response) ? response.join(" ") : response);
  if (!given) return false;
  return [sentence.en, ...(sentence.alts || [])].some((option) => canon(option) === given);
}

export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample(list, count, random = Math.random) {
  return shuffle(list, random).slice(0, count);
}

// Palavras de um grupo de frases, sem repetição, para servirem de palavras erradas.
export function wordPool(sentences) {
  const pool = new Map();
  for (const s of sentences) for (const w of tokenize(s.en)) pool.set(w.toLowerCase(), w);
  return [...pool.values()];
}

// Banco de palavras: as da frase mais `extra` palavras erradas, tudo embaralhado.
export function buildWordBank(sentence, pool, extra = 3, random = Math.random) {
  const answer = tokenize(sentence.en);
  const used = new Set(answer.map((w) => w.toLowerCase()));
  for (const alt of sentence.alts || []) for (const w of tokenize(alt)) used.add(w.toLowerCase());
  const distractors = sample(pool.filter((w) => !used.has(w.toLowerCase())), extra, random);
  let words = shuffle([...answer, ...distractors], random);
  // Evita o caso raro de o embaralhamento já sair na ordem da resposta.
  if (answer.length > 1 && words.slice(0, answer.length).join(" ") === answer.join(" ")) {
    words = [...words.slice(1), words[0]];
  }
  return { answer, bank: words.map((text, id) => ({ id, text })) };
}

// Quatro traduções: a certa e três tiradas de outras frases do mesmo grupo.
export function buildChoices(sentence, others, random = Math.random) {
  const wrong = [];
  const seen = new Set([sentence.pt]);
  for (const other of shuffle(others, random)) {
    if (seen.has(other.pt)) continue;
    seen.add(other.pt);
    wrong.push(other.pt);
    if (wrong.length === 3) break;
  }
  return { options: shuffle([sentence.pt, ...wrong], random) };
}

// Duas colunas embaralhadas para o exercício de ligar pares. O id é o índice do par.
export function buildPairs(pairs, random = Math.random) {
  const side = (index) => shuffle(pairs.map((pair, id) => ({ id, text: pair[index] })), random);
  return { left: side(0), right: side(1) };
}

const wordCount = (s) => tokenize(s.en).length;

// Lição nova, do mais fácil para o mais difícil: ligar o vocabulário, reconhecer e montar cada frase,
// ouvir três delas e, por fim, digitar a mais curta.
export function lessonPlan(lesson, { listen = true } = {}, random = Math.random) {
  const { sentences, vocab = [] } = lesson;
  const plan = [];
  if (vocab.length >= 2) plan.push({ type: "pairs", pairs: vocab.slice(0, 5) });
  sentences.forEach((s, i) => plan.push({ s, type: i % 2 === 0 ? "choice" : "build" }));
  for (const s of sample(sentences, Math.min(3, sentences.length), random)) {
    plan.push({ s, type: listen ? "listen" : "build" });
  }
  if (sentences.length) {
    const shortest = [...sentences].sort((a, b) => wordCount(a) - wordCount(b))[0];
    plan.push({ s: shortest, type: "type" });
  }
  return plan;
}

// Revisão de unidade: dez frases da unidade, alternando os exercícios mais difíceis.
export function unitReviewPlan(sentences, { listen = true } = {}, random = Math.random) {
  const cycle = listen ? ["build", "listen", "type", "listen"] : ["build", "type"];
  return sample(sentences, Math.min(10, sentences.length), random).map((s, i) => ({ s, type: cycle[i % cycle.length] }));
}

// Revisão espaçada: quanto mais firme a frase está na memória (força 0 a 4), mais difícil o exercício.
export function typeForStrength(strength, { listen = true } = {}, random = Math.random) {
  let options;
  if (strength <= 1) options = ["build", "listen", "choice"];
  else if (strength === 2) options = ["build", "listen", "type"];
  else options = ["type", "listen"];
  if (!listen) options = options.filter((t) => t !== "listen");
  return options[Math.floor(random() * options.length)];
}