// Testes sem navegador: node test/run.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { unzipSync, zipSync, strToU8 } from "../vendor/fflate.js";
import { decompress as zstdDecompress } from "../vendor/fzstd.js";
import { COURSE, flatLessons } from "../js/course.js";
import * as srs from "../js/srs.js";
import * as game from "../js/game.js";
import * as ex from "../js/exercise.js";
import * as store from "../js/store.js";
import { parseApkg } from "../js/importer.js";
import { guessMapping, convertPackage, cleanText, soundName } from "../js/anki.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const SQL = await require("../vendor/sql-wasm.js")({ locateFile: (f) => join(root, "vendor", f) });

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

// ---------- Repetição espaçada ----------

test("frase nova volta amanhã; errar de primeira reduz a facilidade", () => {
  const right = srs.review(srs.newItem(), true, NOW);
  assert.equal(right.ivl, 1);
  assert.equal(right.ease, 2.5);
  assert.equal(right.due, srs.addDays(TODAY, 1));
  const wrong = srs.review(srs.newItem(), false, NOW);
  assert.equal(wrong.ivl, 1);
  assert.equal(wrong.ease, 2.3);
  assert.equal(wrong.lapses, 0);
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

test("erro em revisão volta para 1 dia e a facilidade nunca passa do mínimo", () => {
  let item = { ivl: 20, ease: 2.5, due: TODAY, reps: 4, lapses: 0 };
  item = srs.review(item, false, NOW);
  assert.equal(item.ivl, 1);
  assert.equal(item.lapses, 1);
  assert.equal(item.ease, 2.3);
  for (let i = 0; i < 10; i++) item = srs.review({ ...item, due: TODAY }, false, NOW);
  assert.equal(item.ease, 1.3);
});

test("revisão atrasada ganha bônus no intervalo", () => {
  const onTime = srs.review({ ivl: 10, ease: 2.5, due: TODAY, reps: 3, lapses: 0 }, true, NOW);
  const late = srs.review({ ivl: 10, ease: 2.5, due: srs.addDays(TODAY, -10), reps: 3, lapses: 0 }, true, NOW);
  assert.equal(onTime.ivl, 25);
  assert.equal(late.ivl, 38);
});

test("vencidas, força e previsão", () => {
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

// ---------- Jogo ----------

test("níveis: 100 XP para o 2, 300 para o 3, 600 para o 4", () => {
  assert.deepEqual(game.levelInfo(0), { level: 1, into: 0, span: 100 });
  assert.deepEqual(game.levelInfo(99), { level: 1, into: 99, span: 100 });
  assert.deepEqual(game.levelInfo(100), { level: 2, into: 0, span: 200 });
  assert.deepEqual(game.levelInfo(650), { level: 4, into: 50, span: 400 });
  assert.equal(game.sessionXp("lesson", 0), 15);
  assert.equal(game.sessionXp("lesson", 2), 10);
  assert.equal(game.sessionXp("practice", 1), 5);
});

test("sequência: continua no dia seguinte, não conta duas vezes, zera após um dia sem estudar", () => {
  let streak = { count: 0, best: 0, lastDay: 0 };
  streak = game.streakAfter(streak, TODAY);
  assert.equal(streak.count, 1);
  assert.equal(game.streakAfter(streak, TODAY), streak);
  streak = game.streakAfter(streak, srs.addDays(TODAY, 1));
  assert.equal(streak.count, 2);
  assert.equal(game.currentStreak(streak, srs.addDays(TODAY, 2)), 2);
  assert.equal(game.currentStreak(streak, srs.addDays(TODAY, 3)), 0);
  streak = game.streakAfter(streak, srs.addDays(TODAY, 5));
  assert.deepEqual({ count: streak.count, best: streak.best }, { count: 1, best: 2 });
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
  const fine = { pt: "Eu estou bem.", en: "I'm fine, thank you.", alts: [] };
  assert.ok(ex.check("type", "I am fine thank you", fine));
  const alt = { pt: "x", en: "I was at home yesterday.", alts: ["Yesterday I was at home."] };
  assert.ok(ex.check("build", ["yesterday", "I", "was", "at", "home"], alt));
  assert.ok(ex.check("choice", "x", alt));
  assert.ok(!ex.check("choice", "y", alt));
});

test("banco de palavras contém a resposta, as palavras erradas e sai embaralhado", () => {
  const pool = ex.wordPool(all);
  for (const s of all) {
    const { answer, bank } = ex.buildWordBank(s, pool, 3, seeded(s.id.length + s.en.length));
    assert.equal(bank.length, answer.length + 3, s.en);
    const texts = bank.map((w) => w.text);
    for (const w of answer) assert.ok(texts.includes(w), s.en);
    if (answer.length > 1) assert.notEqual(texts.slice(0, answer.length).join(" "), answer.join(" "), s.en);
    const extras = texts.filter((t) => !answer.includes(t));
    assert.ok(extras.every((t) => !answer.map((a) => a.toLowerCase()).includes(t.toLowerCase())));
    assert.ok(ex.check("build", answer, s));
  }
});

test("múltipla escolha tem quatro opções diferentes, com a certa entre elas", () => {
  for (const s of all.slice(0, 40)) {
    const { options } = ex.buildChoices(s, all, seeded(7));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.ok(options.includes(s.pt));
  }
});

test("plano da lição e dificuldade crescente na revisão", () => {
  const plan = ex.lessonPlan(lessons[0].sentences, { listen: true }, seeded(3));
  assert.equal(plan.length, 12);
  assert.deepEqual(plan.slice(0, 4).map((p) => p.type), ["choice", "build", "choice", "build"]);
  assert.ok(plan.slice(8).every((p) => p.type === "listen"));
  assert.ok(ex.lessonPlan(lessons[0].sentences, { listen: false }, seeded(3)).every((p) => p.type !== "listen"));
  const random = seeded(11);
  for (let i = 0; i < 50; i++) {
    assert.ok(["build", "listen", "choice"].includes(ex.typeForStrength(1, {}, random)));
    assert.ok(["type", "listen"].includes(ex.typeForStrength(4, {}, random)));
    assert.equal(ex.typeForStrength(4, { listen: false }, random), "type");
  }
});

// ---------- Curso ----------

test("curso íntegro: 8 unidades, 24 lições, 192 frases com ids únicos", () => {
  assert.equal(COURSE.units.length, 8);
  assert.equal(lessons.length, 24);
  assert.equal(all.length, 192);
  assert.equal(new Set(all.map((s) => s.id)).size, 192);
  assert.equal(new Set(all.map((s) => s.pt)).size, 192, "traduções repetidas quebrariam a múltipla escolha");
  for (const lesson of lessons) {
    assert.equal(lesson.sentences.length, 8, lesson.title);
    assert.ok(lesson.vocab.length >= 3, lesson.title);
    for (const s of lesson.sentences) {
      assert.ok(s.pt && s.en, lesson.title);
      assert.ok(ex.tokenize(s.en).length <= 12, s.en);
      for (const alt of s.alts) assert.notEqual(ex.canon(alt), ex.canon(s.en), alt);
    }
  }
});

// ---------- Armazenamento ----------

test("progresso: salva, carrega, completa campos novos e valida backup", () => {
  const memory = new Map();
  const storage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  assert.equal(store.load(storage).xp, 0);
  const state = store.defaultState();
  state.xp = 120;
  state.items.x = { ivl: 3, ease: 2.5, due: 1, reps: 2, lapses: 0 };
  store.save(state, storage);
  assert.deepEqual(store.load(storage), state);
  memory.set("trilha-ingles-v1", JSON.stringify({ version: 1, xp: 5 }));
  assert.equal(store.load(storage).settings.sound, true);
  memory.set("trilha-ingles-v1", "{quebrado");
  assert.equal(store.load(storage).xp, 0);
  assert.deepEqual(store.importJson(store.exportJson(state)), state);
  assert.throws(() => store.importJson("não é json"), /não é um backup válido/);
  assert.throws(() => store.importJson('{"format":"outro"}'), /não é um backup deste app/);
});

// ---------- Importação do Anki ----------

test("limpa campos do Anki e acha o áudio", () => {
  assert.equal(cleanText("<div>I <b>like</b>&nbsp;{{c1::pizza::food}}</div>[sound:a.mp3]"), "I like pizza");
  assert.equal(soundName("x [sound:frase 01.mp3] y"), "frase 01.mp3");
  assert.equal(soundName("sem áudio"), null);
});

test("palpite de campos pelos nomes", () => {
  assert.deepEqual(guessMapping({ fields: ["Portuguese", "English", "Audio"] }), { pt: 0, en: 1, audio: 2, use: true });
  assert.deepEqual(guessMapping({ fields: ["L1", "L2", "Audio"] }), { pt: 0, en: 1, audio: 2, use: true });
  assert.deepEqual(guessMapping({ fields: ["Sentence", "Hint", "Audio", "Extra"] }), { pt: 1, en: 0, audio: 2, use: true });
  assert.deepEqual(guessMapping({ fields: ["Frente", "Verso"] }), { pt: 0, en: 1, audio: -1, use: true });
  assert.equal(guessMapping({ fields: ["Só um"] }).use, false);
});

test("pacote do Anki vira baralho de frases, com áudio e progresso", () => {
  const crt = Math.floor(new Date(2026, 0, 1, 4).getTime() / 1000);
  const todayIdx = Math.floor((NOW / 1000 - crt) / 86400);
  const db = new SQL.Database();
  db.run("CREATE TABLE col (crt integer, models text, decks text)");
  db.run("CREATE TABLE notes (id integer primary key, mid integer, tags text, flds text)");
  db.run("CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer, type integer, queue integer, due integer, ivl integer, factor integer, reps integer, lapses integer, odue integer, odid integer)");
  const models = { 1500: { id: 1500, name: "Frases", type: 0, css: "", flds: [{ name: "Portuguese", ord: 0 }, { name: "English", ord: 1 }, { name: "Audio", ord: 2 }], tmpls: [{ name: "c", ord: 0, qfmt: "", afmt: "" }] } };
  db.run("INSERT INTO col VALUES (?, ?, ?)", [crt, JSON.stringify(models), JSON.stringify({ 77: { id: 77, name: "Viagem" } })]);
  const long = Array.from({ length: 20 }, (_, i) => `w${i}`).join(" ");
  const notes = [
    [10, "Eu gosto de café.\x1f<b>I like coffee.</b>\x1f[sound:a.mp3]"],
    [11, "Onde fica o hotel?\x1fWhere is the hotel?\x1f"],
    [12, "\x1fEmpty portuguese\x1f"],
    [13, `Longa\x1f${long}\x1f`],
  ];
  for (const [id, flds] of notes) db.run("INSERT INTO notes VALUES (?, 1500, '', ?)", [id, flds]);
  db.run("INSERT INTO cards VALUES (20, 10, 77, 0, 2, 2, ?, 12, 2300, 4, 1, 0, 0)", [todayIdx + 3]);
  db.run("INSERT INTO cards VALUES (21, 11, 77, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0)");
  db.run("INSERT INTO cards VALUES (22, 12, 77, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0)");
  db.run("INSERT INTO cards VALUES (23, 13, 77, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0)");
  const apkg = zipSync({ "collection.anki2": db.export(), media: strToU8(JSON.stringify({ 0: "a.mp3", 1: "unused.jpg" })), 0: new Uint8Array([1, 2, 3]), 1: new Uint8Array([9]) });
  db.close();

  const pkg = parseApkg(apkg, { SQL, unzipSync, zstdDecompress });
  const mappings = new Map(pkg.notetypes.map((nt) => [nt.id, guessMapping(nt)]));
  const result = convertPackage(pkg, mappings, { now: NOW });
  assert.equal(result.decks.length, 1);
  assert.deepEqual(result.decks[0].sentences, [
    { id: "a10", pt: "Eu gosto de café.", en: "I like coffee.", audio: "a.mp3" },
    { id: "a11", pt: "Onde fica o hotel?", en: "Where is the hotel?" },
  ]);
  assert.deepEqual(result.skipped, { unmapped: 0, empty: 1, long: 1 });
  assert.deepEqual(result.items, { a10: { ivl: 12, ease: 2.3, due: srs.addDays(TODAY, 3), reps: 4, lapses: 1 } });
  assert.deepEqual([...result.audio], ["a.mp3"]);
  const wanted = pkg.media.filter((m) => result.audio.has(m.name));
  assert.deepEqual(pkg.extractMedia(wanted).map((m) => [m.name, m.type, m.data.byteLength]), [["a.mp3", "audio/mpeg", 3]]);
  assert.deepEqual(convertPackage(pkg, mappings, { keepProgress: false, now: NOW }).items, {});
});

console.log(`\n${passed} testes passaram`);
