// Testes sem navegador: node test/run.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COURSE, flatLessons } from "../js/course.js";
import { LEVELS, flatSpeaking, words } from "../js/speaking.js";
import * as srs from "../js/srs.js";
import * as game from "../js/game.js";
import * as ex from "../js/exercise.js";
import * as store from "../js/store.js";
import * as P from "../js/pronounce.js";
import { contextFile, sentenceFile, speakingFile, storyFile, vocabFile, wordFile } from "../js/audio-paths.js";
import { WORDS, highlight, CONTEXTS_PER_WORD } from "../js/words.js";
import { SOUND_GROUPS, STRESS_MARKS, MINIMAL_PAIRS, extras, guideWords } from "../js/ipa.js";
import { owl } from "../js/owl.js";
import { STORIES, GLOSSARY, pieces } from "../js/stories.js";
import { character, castFor, CAST_IDS } from "../js/characters.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// Gerador pseudoaleatório fixo, para os testes darem sempre o mesmo resultado.
function seeded(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

const NOW = new Date(2026, 9, 13, 15, 0, 0).getTime();
const TODAY = srs.dayStart(NOW);
const lessons = flatLessons(COURSE);
const all = lessons.flatMap((l) => l.sentences);
const speaking = flatSpeaking();

// ---------- Repetição espaçada ----------

test("frase nova volta amanhã; errar de primeira reduz a facilidade", () => {
  const right = srs.review(srs.newItem(), true, NOW);
  assert.deepEqual([right.ivl, right.ease, right.due], [1, 2.5, srs.addDays(TODAY, 1)]);
  const wrong = srs.review(srs.newItem(), false, NOW);
  assert.deepEqual([wrong.ivl, wrong.ease, wrong.lapses], [1, 2.3, 0]);
});

test("acertos seguidos espaçam: 1, 3, 8, 20 dias", () => {
  let item = srs.review(srs.newItem(), true, NOW);
  const seen = [item.ivl];
  for (let i = 0; i < 3; i++) {
    item = srs.review(item, true, item.due + 12 * 3600 * 1000);
    seen.push(item.ivl);
  }
  assert.deepEqual(seen, [1, 3, 8, 20]);
});

test("erro em revisão volta para 1 dia; atraso dá bônus; facilidade tem piso", () => {
  let item = srs.review({ ivl: 20, ease: 2.5, due: TODAY, reps: 4, lapses: 0 }, false, NOW);
  assert.deepEqual([item.ivl, item.lapses, item.ease], [1, 1, 2.3]);
  for (let i = 0; i < 10; i++) item = srs.review({ ...item, due: TODAY }, false, NOW);
  assert.equal(item.ease, 1.3);
  assert.equal(srs.review({ ivl: 10, ease: 2.5, due: TODAY, reps: 3, lapses: 0 }, true, NOW).ivl, 25);
  assert.equal(srs.review({ ivl: 10, ease: 2.5, due: srs.addDays(TODAY, -10), reps: 3, lapses: 0 }, true, NOW).ivl, 38);
});

test("vencidas, força, previsão e virada do dia às 4h", () => {
  const items = {
    a: { ivl: 1, ease: 2.5, due: TODAY, reps: 1, lapses: 0 },
    b: { ivl: 5, ease: 2.5, due: srs.addDays(TODAY, -3), reps: 2, lapses: 0 },
    c: { ivl: 30, ease: 2.5, due: srs.addDays(TODAY, 2), reps: 5, lapses: 0 },
    d: srs.newItem(),
  };
  assert.deepEqual(srs.dueIds(items, NOW), ["b", "a"]);
  assert.deepEqual([items.a, items.b, items.c, items.d].map(srs.strength), [1, 2, 4, 0]);
  assert.deepEqual(srs.forecast(items, NOW, 4), [2, 0, 1, 0]);
  assert.equal(srs.dayStart(new Date(2026, 9, 13, 5).getTime()) - srs.dayStart(new Date(2026, 9, 13, 3).getTime()), srs.DAY);
});

test("flashcard: os quatro botões dão intervalos crescentes e ajustam a facilidade", () => {
  const fresh = [srs.AGAIN, srs.HARD, srs.GOOD, srs.EASY].map((r) => srs.rate(srs.newItem(), r, NOW));
  assert.deepEqual(fresh.map((i) => i.ivl), [1, 1, 1, 3]);
  assert.deepEqual(fresh.map((i) => i.ease), [2.3, 2.35, 2.5, 2.65]);
  const card = { ivl: 10, ease: 2.5, due: TODAY, reps: 3, lapses: 0 };
  const [again, hard, good, easy] = [srs.AGAIN, srs.HARD, srs.GOOD, srs.EASY].map((r) => srs.rate(card, r, NOW));
  assert.deepEqual([again.ivl, hard.ivl, good.ivl, easy.ivl], [1, 12, 25, 33]);
  assert.deepEqual([again.ease, hard.ease, good.ease, easy.ease], [2.3, 2.35, 2.5, 2.65]);
  assert.deepEqual([again.lapses, hard.lapses], [1, 0]);
  assert.equal(easy.due, srs.addDays(TODAY, 33));
  // Mesmo com a facilidade no piso, "Bom" nunca empata com "Difícil".
  const stiff = { ivl: 2, ease: 1.3, due: TODAY, reps: 5, lapses: 4 };
  assert.ok(srs.rate(stiff, srs.GOOD, NOW).ivl > srs.rate(stiff, srs.HARD, NOW).ivl);
  assert.deepEqual(srs.review(card, true, NOW), good);
  assert.deepEqual(srs.review(card, false, NOW), again);
  assert.equal(srs.intervalLabel(undefined, srs.EASY, NOW), "3 d");
  assert.equal(srs.intervalLabel(card, srs.GOOD, NOW), "25 d");
  assert.equal(srs.intervalLabel({ ...card, ivl: 30 }, srs.GOOD, NOW), "2,5 mês");
});

// ---------- Jogo ----------

test("plano de estudo sai do tempo disponível e do nível declarado", () => {
  assert.deepEqual(game.planFor(5, "a1"), { goal: 10, wordsPerDay: 1, speakGoal: 1, startUnit: 0, speakLevel: "a1" });
  assert.deepEqual(game.planFor(20, "b1"), { goal: 50, wordsPerDay: 4, speakGoal: 5, startUnit: 4, speakLevel: "b1" });
  assert.deepEqual(game.planFor(999, "nada"), game.planFor(10, "a1"));
  assert.ok(game.SKILLS.every((s) => s.startUnit < COURSE.units.length));
  assert.equal(game.customUnlocked(19, "a1"), false);
  assert.equal(game.customUnlocked(20, "a1"), true);
  assert.equal(game.customUnlocked(0, "a2"), false);
  assert.equal(game.customUnlocked(0, "b1"), true);
});

test("níveis e XP por sessão", () => {
  assert.deepEqual(game.levelInfo(0), { level: 1, into: 0, span: 100 });
  assert.deepEqual(game.levelInfo(100), { level: 2, into: 0, span: 200 });
  assert.deepEqual(game.levelInfo(650), { level: 4, into: 50, span: 400 });
  assert.equal(game.sessionXp("lesson", 0), 15);
  assert.equal(game.sessionXp("unit", 3), 20);
  assert.equal(game.sessionXp("practice", 1), 5);
});

test("vidas: perde ao errar, volta uma a cada 4 horas, não passa de 5", () => {
  let hearts = { count: 5, since: 0 };
  hearts = game.loseHeart(hearts, NOW);
  assert.deepEqual(hearts, { count: 4, since: NOW });
  hearts = game.loseHeart(hearts, NOW + 1000);
  assert.deepEqual(hearts, { count: 3, since: NOW });
  assert.equal(game.heartsNow(hearts, NOW + game.HEART_REGEN - 1).count, 3);
  const later = game.heartsNow(hearts, NOW + game.HEART_REGEN + 60000);
  assert.equal(later.count, 4);
  assert.equal(later.nextIn, game.HEART_REGEN - 60000);
  assert.equal(game.heartsNow(hearts, NOW + 10 * game.HEART_REGEN).count, 5);
  assert.equal(game.gainHearts(hearts, 9, NOW).count, 5);
  let empty = hearts;
  for (let i = 0; i < 9; i++) empty = game.loseHeart(empty, NOW);
  assert.equal(empty.count, 0);
  assert.equal(game.formatWait(game.HEART_REGEN), "4 h 00 min");
  assert.equal(game.formatWait(25 * 60000), "25 min");
});

test("sequência: continua, não conta em dobro, zera, e o bloqueio cobre um dia", () => {
  let streak = { count: 0, best: 0, lastDay: 0 };
  streak = game.streakAfter(streak, TODAY).streak;
  assert.equal(streak.count, 1);
  assert.equal(game.streakAfter(streak, TODAY).streak, streak);
  streak = game.streakAfter(streak, srs.addDays(TODAY, 1)).streak;
  assert.equal(streak.count, 2);
  const day4 = srs.addDays(TODAY, 3); // faltou um dia
  assert.equal(game.currentStreak(streak, srs.addDays(TODAY, 2)), 2);
  assert.equal(game.currentStreak(streak, day4), 0);
  assert.equal(game.currentStreak(streak, day4, 1), 2);
  assert.deepEqual(game.streakAfter(streak, day4, 0), { streak: { count: 1, best: 2, lastDay: day4 }, usedFreeze: false });
  assert.deepEqual(game.streakAfter(streak, day4, 1), { streak: { count: 3, best: 3, lastDay: day4 }, usedFreeze: true });
  assert.equal(game.streakAfter(streak, srs.addDays(TODAY, 5), 2).streak.count, 1);
  const dots = game.weekDots({ count: 2, best: 2, lastDay: TODAY }, TODAY);
  assert.equal(dots.length, 7);
  assert.equal(dots.filter((d) => d.done).length, 2);
  assert.equal(dots.find((d) => d.today).done, true);
});

test("missões: três por dia, iguais no mesmo dia, com progresso e coleta", () => {
  const quests = game.dailyQuests(TODAY);
  assert.equal(quests.length, 3);
  assert.equal(quests[0].key, "xp");
  assert.equal(new Set(quests.map((q) => q.key)).size, 3);
  assert.deepEqual(game.dailyQuests(TODAY), quests);
  const seenKeys = new Set();
  for (let i = 0; i < 60; i++) for (const q of game.dailyQuests(srs.addDays(TODAY, i))) seenKeys.add(q.key);
  assert.equal(seenKeys.size, 7);
  const daily = game.newDaily(TODAY);
  assert.deepEqual(game.questStatus(quests[0], daily), { value: 0, done: false, claimed: false });
  daily.xp = 999;
  daily.claimed.push("xp");
  assert.deepEqual(game.questStatus(quests[0], daily), { value: quests[0].target, done: true, claimed: true });
});

test("conquistas sobem de nível conforme os números", () => {
  const list = game.achievements({ streak: 7, xp: 120, lessons: 0, mastered: 0, spoken: 0, custom: 0 });
  const get = (key) => list.find((a) => a.key === key);
  assert.deepEqual([get("streak").tier, get("streak").target], [2, 30]);
  assert.deepEqual([get("xp").tier, get("xp").target, get("xp").value], [1, 500, 120]);
  assert.equal(get("lessons").tier, 0);
  assert.equal(game.achievements({ lessons: 99 }).find((a) => a.key === "lessons").tier, 3);
});

// ---------- Exercícios ----------

test("separa palavras sem pontuação e só mantém maiúscula quando deve", () => {
  assert.deepEqual(ex.tokenize("Hello, good morning."), ["hello", "good", "morning"]);
  assert.deepEqual(ex.tokenize("I'm from Brazil."), ["I'm", "from", "Brazil"]);
  assert.deepEqual(ex.tokenize("I wake up at seven o'clock."), ["I", "wake", "up", "at", "seven", "o'clock"]);
});

test("conferência aceita maiúsculas, pontuação e contrações diferentes", () => {
  const s = { pt: "Eu não sei dirigir.", en: "I can't drive.", alts: [] };
  assert.ok(ex.check("type", "i cannot drive", s));
  assert.ok(ex.check("type", "I can’t drive!", s));
  assert.ok(ex.check("build", ["I", "can't", "drive"], s));
  assert.ok(!ex.check("type", "I can drive", s));
  assert.ok(!ex.check("type", "   ", s));
  assert.ok(ex.check("type", "I am fine thank you", { pt: "x", en: "I'm fine, thank you.", alts: [] }));
  const alt = { pt: "x", en: "I was at home yesterday.", alts: ["Yesterday I was at home."] };
  assert.ok(ex.check("build", ["yesterday", "I", "was", "at", "home"], alt));
  assert.ok(ex.check("choice", "x", alt));
  assert.ok(!ex.check("choice", "y", alt));
});

test("banco de palavras contém a resposta, as erradas e sai embaralhado", () => {
  const pool = ex.wordPool(all);
  for (const s of all) {
    const { answer, bank } = ex.buildWordBank(s, pool, 3, seeded(s.id.length + s.en.length));
    const texts = bank.map((w) => w.text);
    assert.equal(bank.length, answer.length + 3, s.en);
    for (const w of answer) assert.ok(texts.includes(w), s.en);
    if (answer.length > 1) assert.notEqual(texts.slice(0, answer.length).join(" "), answer.join(" "), s.en);
    assert.ok(ex.check("build", answer, s));
  }
});

test("múltipla escolha e pares", () => {
  for (const s of all.slice(0, 40)) {
    const { options } = ex.buildChoices(s, all, seeded(7));
    assert.equal(new Set(options).size, 4);
    assert.ok(options.includes(s.pt));
  }
  const pairs = ex.buildPairs(lessons[0].vocab, seeded(5));
  assert.deepEqual(pairs.left.map((p) => p.id).sort(), [0, 1, 2, 3]);
  assert.deepEqual(pairs.right.map((p) => p.id).sort(), [0, 1, 2, 3]);
  for (const item of pairs.left) assert.equal(item.text, lessons[0].vocab[item.id][0]);
  for (const item of pairs.right) assert.equal(item.text, lessons[0].vocab[item.id][1]);
});

test("planos: lição começa fácil e termina digitando; revisão fica mais difícil", () => {
  const plan = ex.lessonPlan(lessons[0], { listen: true }, seeded(3));
  assert.deepEqual(plan.map((p) => p.type), ["pairs", "choice", "build", "choice", "build", "choice", "build", "choice", "build", "listen", "listen", "listen", "type"]);
  const fewest = Math.min(...lessons[0].sentences.map((s) => ex.tokenize(s.en).length));
  assert.equal(ex.tokenize(plan.at(-1).s.en).length, fewest);
  assert.equal(plan[0].pairs.length, 4);
  assert.ok(ex.lessonPlan(lessons[0], { listen: false }, seeded(3)).every((p) => p.type !== "listen"));
  const unit = ex.unitReviewPlan(all.slice(0, 24), { listen: true }, seeded(2));
  assert.equal(unit.length, 10);
  assert.equal(new Set(unit.map((p) => p.s.id)).size, 10);
  assert.ok(unit.every((p) => ["build", "listen", "type"].includes(p.type)));
  const random = seeded(11);
  for (let i = 0; i < 50; i++) {
    assert.ok(["build", "listen", "choice"].includes(ex.typeForStrength(1, {}, random)));
    assert.ok(["type", "listen"].includes(ex.typeForStrength(4, {}, random)));
    assert.equal(ex.typeForStrength(4, { listen: false }, random), "type");
  }
});

// ---------- Conteúdo ----------

test("curso íntegro: 8 unidades, 24 lições, 192 frases", () => {
  assert.deepEqual([COURSE.units.length, lessons.length, all.length], [8, 24, 192]);
  assert.equal(new Set(all.map((s) => s.id)).size, 192);
  assert.equal(new Set(all.map((s) => s.pt)).size, 192, "traduções repetidas quebrariam a múltipla escolha");
  for (const lesson of lessons) {
    assert.equal(lesson.sentences.length, 8, lesson.title);
    assert.ok(lesson.vocab.length >= 3, lesson.title);
    for (const s of lesson.sentences) {
      assert.ok(ex.tokenize(s.en).length <= 12, s.en);
      for (const alt of s.alts) assert.notEqual(ex.canon(alt), ex.canon(s.en), alt);
    }
  }
});

test("treino de fala: 4 níveis, 12 frases cada, uma transcrição IPA por palavra", () => {
  assert.deepEqual(LEVELS.map((l) => l.id), ["a1", "a2", "b1", "b2"]);
  assert.equal(speaking.length, 48);
  assert.equal(new Set(speaking.map((s) => s.id)).size, 48);
  for (const s of speaking) {
    assert.equal(s.ipa.length, words(s.en).length, s.en);
    assert.ok(s.ipa.every((t) => t && !/[A-Z0-9.,!?]/.test(t)), s.en);
    assert.ok(s.pt);
  }
});

test("baralho de palavras: 50 palavras, 5 frases cada, com a palavra dentro da frase", () => {
  assert.equal(WORDS.length, 50);
  assert.equal(new Set(WORDS.map((w) => w.id)).size, 50);
  const cards = WORDS.flatMap((w) => w.cards);
  assert.equal(cards.length, 250);
  assert.equal(new Set(cards.map((c) => c.id)).size, 250);
  for (const word of WORDS) {
    assert.equal(word.cards.length, CONTEXTS_PER_WORD, word.id);
    assert.ok(word.forms.includes(word.word), word.id);
    for (const card of word.cards) {
      assert.ok(card.pt && card.en, card.id);
      assert.ok(highlight(word, card.en).some((p) => p.hit), `"${card.en}" não contém ${word.word}`);
      assert.equal(highlight(word, card.en).map((p) => p.text).join(""), card.en);
      assert.ok(ex.tokenize(card.en).length <= 9, card.en);
    }
  }
  // Nenhuma frase repetida entre o baralho e o curso: cada cartão é um conteúdo novo.
  const seen = new Set(all.map((s) => ex.canon(s.en)));
  for (const card of cards) {
    assert.ok(!seen.has(ex.canon(card.en)), `repetida: ${card.en}`);
    seen.add(ex.canon(card.en));
  }
  assert.deepEqual(highlight(WORDS.find((w) => w.id === "let"), "Let's go home."), [{ text: "Let's", hit: true }, { text: " go home.", hit: false }]);
});

test("aba Sons: vogais e consoantes cobrem todos os símbolos usados nas transcrições", () => {
  assert.deepEqual(SOUND_GROUPS.map((g) => g.id), ["vowels", "consonants"]);
  const sounds = SOUND_GROUPS.flatMap((g) => g.sounds);
  const symbols = sounds.map(([symbol]) => symbol);
  assert.equal(new Set(symbols).size, symbols.length);
  assert.equal(new Set(sounds.map(([, word]) => word)).size, sounds.length, "cada som tem a sua própria palavra de exemplo");
  const explained = new Set([...symbols, ...STRESS_MARKS.map(([symbol]) => symbol)].join(""));
  for (const s of speaking) for (const ch of s.ipa.join("")) assert.ok(explained.has(ch), `símbolo sem explicação: ${ch} em "${s.en}"`);
  for (const sound of sounds) {
    const [symbol, word, ipa, tip] = sound;
    assert.ok(word && tip && extras(sound).length === 2, symbol);
    // A transcrição da palavra de exemplo precisa conter o som que ela ilustra.
    assert.ok(ipa.includes(symbol), `${word} /${ipa}/ não contém ${symbol}`);
  }
  for (const [a, b, what] of MINIMAL_PAIRS) assert.ok(a !== b && what);
  // Nenhuma palavra se repete entre os pares, para o treino de ouvido não ficar previsível.
  assert.equal(new Set(MINIMAL_PAIRS.flatMap(([a, b]) => [a, b])).size, MINIMAL_PAIRS.length * 2);
});

test("histórias: 3 contos, 5 partes de 6 frases, e toda palavra tem significado", () => {
  assert.deepEqual(STORIES.map((s) => s.id), ["goldilocks", "tortoise", "pigs"]);
  const sentences = STORIES.flatMap((s) => s.parts.flatMap((p) => p.sentences));
  assert.equal(sentences.length, 90);
  assert.equal(new Set(sentences.map((s) => s.id)).size, 90);
  assert.equal(new Set(sentences.map((s) => s.pt)).size, 90, "traduções repetidas confundiriam as perguntas");
  for (const story of STORIES) {
    assert.equal(story.parts.length, 5, story.id);
    for (const part of story.parts) assert.equal(part.sentences.length, 6, `${story.id} parte ${part.index + 1}`);
  }
  const missing = new Set();
  for (const s of sentences) {
    assert.equal(pieces(s.en).map((p) => p.text).join(""), s.en);
    for (const piece of pieces(s.en)) if (piece.word && !GLOSSARY[piece.word]) missing.add(piece.word);
  }
  assert.deepEqual([...missing], [], "palavras sem significado no glossário");
  assert.deepEqual(pieces("\"Let's go!\" she said.").filter((p) => p.word).map((p) => p.word), ["let's", "go", "she", "said"]);
});

test("personagens e coruja: cada um tem o seu desenho e as três expressões", () => {
  assert.equal(CAST_IDS.length, 5);
  assert.equal(new Set(CAST_IDS.map((id) => character(id))).size, 5);
  for (const id of CAST_IDS) {
    const moods = ["normal", "happy", "sad"].map((mood) => character(id, { mood }));
    assert.equal(new Set(moods).size, 3, id);
    assert.ok(moods.every((svg) => svg.includes("mouth-talk") && svg.includes('class="eye"') && svg.includes("arm-r")), id);
  }
  assert.ok(character("bia", { height: 99, cls: "cheer" }).includes('height="99"'));
  assert.equal(castFor("u1-l1"), castFor("u1-l1"));
  assert.ok(CAST_IDS.includes(castFor("qualquer coisa")));
  assert.ok(new Set(lessons.map((l) => castFor(l.title))).size >= 4, "as lições usam personagens variados");
  assert.ok(owl("happy", 50).includes('width="50"') && owl("sad") !== owl("normal") && owl().includes('class="eye"'));
});

test("todo texto falado tem o seu arquivo de áudio", () => {
  const index = new Set(JSON.parse(readFileSync(join(root, "audio/index.json"), "utf8")));
  const need = [];
  for (const lesson of lessons) {
    for (const s of lesson.sentences) {
      need.push(sentenceFile(s.id));
      for (const w of ex.tokenize(s.en)) need.push(wordFile(w));
    }
    lesson.vocab.forEach((_, i) => need.push(vocabFile(lesson.id, i)));
  }
  for (const s of speaking) {
    need.push(speakingFile(s.id));
    for (const w of ex.tokenize(s.en)) need.push(wordFile(w));
  }
  for (const word of WORDS) {
    need.push(wordFile(word.word));
    for (const card of word.cards) need.push(contextFile(card.id));
  }
  for (const word of guideWords()) need.push(wordFile(word));
  for (const story of STORIES) {
    for (const part of story.parts) {
      for (const s of part.sentences) {
        need.push(storyFile(s.id));
        for (const piece of pieces(s.en)) if (piece.word) need.push(wordFile(piece.word));
      }
    }
  }
  assert.equal(storyFile("pigs-2-3"), "t/pigs-2-3.mp3");
  assert.equal(contextFile("w-get-3"), "c/get-3.mp3");
  assert.equal(wordFile("I'm"), "w/i_m.mp3");
  assert.equal(new Set(need).size, index.size);
  for (const file of need) {
    assert.ok(index.has(file), file);
    assert.ok(existsSync(join(root, "audio", file)), file);
  }
});

// ---------- Armazenamento ----------

test("progresso: salva, carrega, migra dados antigos e valida backup", () => {
  const memory = new Map();
  const storage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  assert.equal(store.load(storage).hearts.count, 5);
  const state = store.defaultState();
  state.xp = 120;
  state.items.x = { ivl: 3, ease: 2.5, due: 1, reps: 2, lapses: 0 };
  state.custom.push({ id: "c1", en: "Hi.", pt: "Oi." });
  store.save(state, storage);
  assert.deepEqual(store.load(storage), state);
  // Dados da primeira versão: sem vidas nem gemas, e com frases de baralhos do Anki.
  memory.set("trilha-ingles-v1", JSON.stringify({ version: 1, xp: 35, lessonsDone: { "u1-l1": true }, items: { "u1-l1-s1": { ivl: 1 }, a1700000000000: { ivl: 9 } }, settings: { sound: false } }));
  const migrated = store.load(storage);
  assert.deepEqual([migrated.version, migrated.xp, migrated.gems, migrated.hearts.count, migrated.settings.sound, migrated.settings.effects], [3, 35, 0, 5, false, true]);
  // Quem já usava o app também passa pelas perguntas iniciais, sem perder o progresso.
  assert.deepEqual(migrated.profile, { onboarded: false, reason: null, skill: "a1", minutes: 10, wordsPerDay: 2, startUnit: 0 });
  assert.deepEqual([migrated.words, migrated.tour], [{}, {}]);
  assert.deepEqual(Object.keys(migrated.items), ["u1-l1-s1"]);
  assert.deepEqual(migrated.daily.claimed, []);
  memory.set("trilha-ingles-v1", "{quebrado");
  assert.equal(store.load(storage).xp, 0);
  assert.deepEqual(store.importJson(store.exportJson(state)), state);
  assert.throws(() => store.importJson("não é json"), /não é um backup válido/);
  assert.throws(() => store.importJson('{"format":"outro"}'), /não é um backup deste app/);
  assert.throws(() => store.importJson(JSON.stringify({ format: "trilha-ingles-backup", state: { version: 99 } })), /versão mais nova/);
});

// ---------- Comparação de pronúncia ----------

// Sinal sintético parecido com fala: "sílabas" com frequências e durações dadas.
function fakeSpeech(syllables, rate = 16000, seed = 1) {
  const random = seeded(seed);
  const out = [];
  for (let i = 0; i < rate * 0.2; i++) out.push((random() - 0.5) * 0.001);
  for (const [freq, seconds] of syllables) {
    const count = Math.floor(seconds * rate);
    for (let i = 0; i < count; i++) {
      const env = Math.sin((Math.PI * i) / count);
      out.push(env * 0.4 * (Math.sin((2 * Math.PI * freq * i) / rate) + 0.5 * Math.sin((2 * Math.PI * freq * 2.7 * i) / rate)) + (random() - 0.5) * 0.01);
    }
    for (let i = 0; i < rate * 0.04; i++) out.push((random() - 0.5) * 0.001);
  }
  for (let i = 0; i < rate * 0.2; i++) out.push((random() - 0.5) * 0.001);
  return { samples: Float32Array.from(out), rate };
}

test("comparação: igual dá 100, parecido dá nota alta, diferente dá nota baixa", () => {
  const phrase = [[300, 0.18], [900, 0.12], [500, 0.2], [1400, 0.15], [700, 0.22]];
  const model = fakeSpeech(phrase);
  assert.equal(P.compare(model, model).score, 100);
  // A mesma "frase" dita mais devagar, com outro ruído e em outra taxa de amostragem.
  const slower = fakeSpeech(phrase.map(([f, s]) => [f * 1.03, s * 1.3]), 44100, 9);
  const other = fakeSpeech([[1500, 0.2], [250, 0.25], [1100, 0.1], [400, 0.3], [2000, 0.12]], 16000, 4);
  const same = P.compare(model, slower);
  const different = P.compare(model, other);
  assert.ok(same.score >= 70, `mesma frase: ${same.score}`);
  // Tons sintéticos não são fala: aqui vale a ordem das notas. Os limites reais vêm de vozes
  // de verdade, medidos em tools/calibrate.mjs.
  assert.ok(same.score - different.score >= 20, `mesma ${same.score}, diferente ${different.score}`);
  assert.equal(same.modelEnvelope.length, 96);
  assert.ok(Math.abs(same.modelSeconds - 1.1) < 0.2, String(same.modelSeconds));
});

test("comparação: silêncio, gravação curta e gravação longa são apontados", () => {
  const phrase = [[300, 0.2], [900, 0.2], [500, 0.2], [1400, 0.2], [700, 0.2]];
  const model = fakeSpeech(phrase);
  const silence = { samples: new Float32Array(16000), rate: 16000 };
  assert.deepEqual([P.compare(model, silence).score, P.compare(model, silence).problem], [0, "silent"]);
  const short = P.compare(model, fakeSpeech(phrase.slice(0, 2)));
  assert.equal(short.problem, "short");
  assert.ok(short.score <= 30);
  const long = P.compare(model, fakeSpeech([...phrase, ...phrase, ...phrase]));
  assert.equal(long.problem, "long");
  assert.ok(long.score <= 40);
  assert.equal(P.resample(new Float32Array(44100), 44100).length, 16000);
  assert.equal(P.distanceToScore(P.CALIBRATION.same), 88);
  assert.equal(P.distanceToScore(P.CALIBRATION.different), 25);
  assert.equal(P.label(85), "Muito parecido com o modelo");
});

console.log(`\n${passed} testes passaram`);
