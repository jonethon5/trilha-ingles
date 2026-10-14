// Service worker: guarda o app no aparelho para funcionar sem internet.
// Ao mudar qualquer arquivo do app, aumente a versão para os aparelhos baixarem de novo.
const VERSION = "v5";
const CACHE = `trilha-${VERSION}`;
// Os áudios ficam em um cache próprio, que sobrevive às atualizações do app.
// Mude o número quando os áudios forem gerados de novo com vozes diferentes: os caminhos são os mesmos.
const AUDIO_CACHE = "trilha-audio-v2";

const FILES = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "js/app.js",
  "js/core.js",
  "js/course.js",
  "js/speaking.js",
  "js/words.js",
  "js/ipa.js",
  "js/owl.js",
  "js/characters.js",
  "js/voices.js",
  "js/stories.js",
  "js/fx.js",
  "js/srs.js",
  "js/game.js",
  "js/exercise.js",
  "js/store.js",
  "js/audio.js",
  "js/audio-paths.js",
  "js/recorder.js",
  "js/pronounce.js",
  "js/ui/session.js",
  "js/ui/learn.js",
  "js/ui/review.js",
  "js/ui/speak.js",
  "js/ui/quests.js",
  "js/ui/profile.js",
  "js/ui/cards.js",
  "js/ui/tour.js",
  "js/ui/onboard.js",
  "js/ui/sounds.js",
  "js/ui/stories.js",
  "audio/index.json",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE, AUDIO_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("trilha-") && !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Primeiro o cache; só vai à rede o que ainda não foi guardado (e guarda na volta).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const isAudio = url.pathname.endsWith(".mp3");
  event.respondWith(
    caches.open(isAudio ? AUDIO_CACHE : CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});
