// Progresso do usuário, guardado no localStorage do aparelho como um único JSON.

const KEY = "trilha-ingles-v1";
const FORMAT = "trilha-ingles-backup";

export function defaultState() {
  return {
    version: 1,
    xp: 0,
    goal: 20, // meta diária de XP
    daily: { day: 0, xp: 0 },
    streak: { count: 0, best: 0, lastDay: 0 },
    lessonsDone: {}, // id da lição -> true
    items: {}, // id da frase -> agendamento (ver srs.js)
    settings: { sound: true },
  };
}

// Completa com os valores padrão o que faltar, para dados antigos continuarem válidos.
function merge(saved) {
  const base = defaultState();
  return {
    ...base,
    ...saved,
    daily: { ...base.daily, ...saved.daily },
    streak: { ...base.streak, ...saved.streak },
    settings: { ...base.settings, ...saved.settings },
    lessonsDone: { ...saved.lessonsDone },
    items: { ...saved.items },
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
  if (data.state.version !== 1) throw new Error("Backup de uma versão mais nova do app.");
  return merge(data.state);
}
