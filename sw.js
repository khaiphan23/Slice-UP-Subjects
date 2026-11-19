const scope = self.registration.scope;
const cachePrefix = `slice-up:${scope}:`;
const cacheName = `${cachePrefix}slice-up-v3`;
const shell = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(shell.map(path => new Request(new URL(path, scope), { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const outdated = keys.filter(key => key !== cacheName &&
      (key.startsWith(cachePrefix) || key === 'slice-up-v2' || key === 'slice-up-v3'));
    await Promise.all(outdated.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function serve(request) {
  const cache = await caches.open(cacheName);
  const navigation = request.mode === 'navigate';
  if (!navigation) {
    const cached = await cache.match(request);
    if (cached) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return await cache.match(request) ||
      (navigation && await cache.match(new URL('./index.html', scope))) ||
      Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') event.respondWith(serve(event.request));
});
