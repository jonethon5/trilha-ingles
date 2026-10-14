// Baralhos importados do Anki e seus áudios, guardados no IndexedDB.
// (O progresso fica no localStorage; aqui ficam só o conteúdo e os arquivos, que são grandes demais para ele.)

const DB_NAME = "trilha-ingles";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("decks", { keyPath: "id" });
      req.result.createObjectStore("media", { keyPath: "name" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function request(store, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const result = action(tx.objectStore(store));
        tx.oncomplete = () => resolve(result?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Transação abortada"));
      }),
  );
}

export const loadDecks = () => request("decks", "readonly", (os) => os.getAll());

export const saveDeck = (deck) => request("decks", "readwrite", (os) => os.put(deck));

export const getMedia = (name) => request("media", "readonly", (os) => os.get(name));

export function saveMedia(files) {
  return request("media", "readwrite", (os) => {
    for (const file of files) os.put(file);
  });
}

// Apaga o baralho e os áudios que só ele usava.
export async function deleteDeck(deck, otherDecks) {
  const stillUsed = new Set();
  for (const other of otherDecks) for (const s of other.sentences) if (s.audio) stillUsed.add(s.audio);
  const orphans = deck.sentences.map((s) => s.audio).filter((name) => name && !stillUsed.has(name));
  await request("media", "readwrite", (os) => {
    for (const name of orphans) os.delete(name);
  });
  await request("decks", "readwrite", (os) => os.delete(deck.id));
}

export async function clearAll() {
  await request("decks", "readwrite", (os) => os.clear());
  await request("media", "readwrite", (os) => os.clear());
}
