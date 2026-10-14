// Converte um pacote do Anki já lido (ver importer.js) em baralhos de frases para o app.

import { addDays, dayStart } from "./srs.js";

const MAX_WORDS = 16; // frases maiores não cabem bem em um banco de palavras no celular

const PT_NAMES = /portug|^l1$|frente|front|pergunta|nativ|meaning|tradu/i;
const EN_NAMES = /engl|ingl|^l2$|verso|back|sentence|resposta|target|frase/i;
const AUDIO_NAMES = /audio|áudio|sound|som/i;

export function cleanText(html) {
  return String(html)
    .replace(/\[sound:[^\]]*\]/g, " ")
    .replace(/\{\{c\d+::([\s\S]*?)(::[\s\S]*?)?\}\}/g, "$1")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function soundName(value) {
  const m = /\[sound:([^\]]+)\]/.exec(String(value || ""));
  return m ? m[1] : null;
}

// Palpite de quais campos são o português, o inglês e o áudio, pelos nomes dos campos.
export function guessMapping(notetype) {
  const names = notetype.fields;
  const find = (re, skip = []) => names.findIndex((n, i) => re.test(n) && !skip.includes(i));
  const audio = find(AUDIO_NAMES);
  let pt = find(PT_NAMES, [audio]);
  let en = find(EN_NAMES, [audio, pt]);
  const free = names.map((_, i) => i).filter((i) => i !== audio);
  if (pt === -1) pt = free.find((i) => i !== en) ?? -1;
  if (en === -1) en = free.find((i) => i !== pt) ?? -1;
  return { pt, en, audio, use: pt !== -1 && en !== -1 };
}

// Agendamento de um cartão do Anki em revisão, no formato do srs.js. Outros estados contam como frase nova.
function scheduleFromCard(card, crt, now) {
  if (card.type !== 2 || card.queue === -1) return null;
  const ankiToday = Math.floor((now / 1000 - crt) / 86400);
  const due = card.odid ? card.odue : card.due;
  return {
    ivl: Math.max(1, card.ivl),
    ease: card.factor ? card.factor / 1000 : 2.5,
    due: addDays(dayStart(now), due - ankiToday),
    reps: Math.max(1, card.reps),
    lapses: card.lapses || 0,
  };
}

/**
 * @param pkg resultado de parseApkg
 * @param mappings Map: id do tipo de nota -> { pt, en, audio, use }
 * @returns baralhos com frases, agendamentos vindos do Anki e os nomes de áudio usados
 */
export function convertPackage(pkg, mappings, { keepProgress = true, now = Date.now() } = {}) {
  const firstCard = new Map();
  for (const card of pkg.cards) if (!firstCard.has(card.noteId)) firstCard.set(card.noteId, card);

  const decks = new Map(pkg.decks.map((d) => [d.id, { id: d.id, name: d.name, sentences: [] }]));
  const items = {};
  const audio = new Set();
  const skipped = { unmapped: 0, empty: 0, long: 0 };

  for (const note of pkg.notes) {
    const map = mappings.get(note.ntid);
    const card = firstCard.get(note.id);
    const deck = card && decks.get(card.deckId);
    if (!map?.use || !deck) {
      skipped.unmapped++;
      continue;
    }
    const pt = cleanText(note.fields[map.pt] || "");
    const en = cleanText(note.fields[map.en] || "");
    if (!pt || !en) {
      skipped.empty++;
      continue;
    }
    if (en.split(" ").length > MAX_WORDS) {
      skipped.long++;
      continue;
    }
    const id = `a${note.id}`;
    const sound = (map.audio >= 0 && soundName(note.fields[map.audio])) || soundName(note.fields[map.en]);
    const sentence = { id, pt, en };
    if (sound) {
      sentence.audio = sound.normalize("NFC");
      audio.add(sound);
    }
    deck.sentences.push(sentence);
    const schedule = keepProgress && scheduleFromCard(card, pkg.crt, now);
    if (schedule) items[id] = schedule;
  }

  return { decks: [...decks.values()].filter((d) => d.sentences.length), items, audio, skipped };
}
