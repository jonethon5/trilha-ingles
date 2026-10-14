// Progresso do usuário, guardado no localStorage do aparelho como um único JSON.

import { MAX_HEARTS, newDaily } from "./game.js";

const KEY = "trilha-ingles-v1";
const FORMAT = "trilha-ingles-backup";
const VERSION = 3;

export function defaultState() {
  return {
    version: VERSION,
    xp: 0,
    gems: 0,
    hearts: { count: MAX_HEARTS, since: 0 },
    freezes: 0, // bloqueios de sequência comprados na loja
    goal: 20, // meta diária de XP
    daily: newDaily(0), // contadores do dia, usados pela meta e pelas missões
    streak: { count: 0, best: 0, lastDay: 0 },
    lessonsDone: {}, // id da lição ou da revisão de unidade -> true
    chests: {}, // id da unidade -> true quando o baú foi aberto
    items: {}, // id da frase -> agendamento (ver srs.js)
    // Cartões criados pelo usuário ou salvos das histórias: { id, en, pt, front, audio }.
    // "front" diz qual língua fica na frente (padrão "pt"); "audio" é o arquivo gravado, se houver.
    custom: [],
    speak: { level: "a1", goal: 3, history: {} }, // history: id da frase -> [{ t, score }]
    // Respostas da primeira abertura e o plano que saiu delas.
    profile: { onboarded: false, reason: null, skill: "a1", minutes: 10, wordsPerDay: 2, startUnit: 0 },
    words: {}, // id da palavra -> dia em que ela foi começada, para limitar as palavras novas por dia
    tour: {}, // aba -> true depois que a coruja já explicou
    stories: {}, // id da história -> { done: partes lidas, day: dia da última leitura }
    sounds: {}, // símbolo -> true depois de ouvido na aba Sons
    settings: { sound: true, effects: true },
  };
}

// Completa com os valores padrão o que faltar, para dados de versões antigas continuarem válidos.
function merge(saved) {
  const base = defaultState();
  const items = { ...saved.items };
  // A versão 1 importava baralhos do Anki; essas frases não existem mais no app.
  for (const id of Object.keys(items)) if (/^a\d+$/.test(id)) delete items[id];
  return {
    ...base,
    ...saved,
    version: VERSION,
    hearts: { ...base.hearts, ...saved.hearts },
    daily: { ...base.daily, ...saved.daily, claimed: [...(saved.daily?.claimed || [])] },
    streak: { ...base.streak, ...saved.streak },
    settings: { ...base.settings, ...saved.settings },
    speak: { ...base.speak, ...saved.speak, history: { ...saved.speak?.history } },
    profile: { ...base.profile, ...saved.profile },
    words: { ...saved.words },
    tour: { ...saved.tour },
    stories: { ...saved.stories },
    sounds: { ...saved.sounds },
    lessonsDone: { ...saved.lessonsDone },
    chests: { ...saved.chests },
    custom: [...(saved.custom || [])],
    items,
  };
}

export function load(storage = localStorage) {
  try {
    const raw = storage.getItem(KEY);
    return raw ? merge(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function save(state, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify(state));
}

export function exportJson(state) {
  return JSON.stringify({ format: FORMAT, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não é um backup válido.");
  }
  if (data?.format !== FORMAT || typeof data.state !== "object" || data.state === null) {
    throw new Error("O arquivo não é um backup deste app.");
  }
  if (!(data.state.version <= VERSION)) throw new Error("Backup de uma versão mais nova do app.");
  return merge(data.state);
}
