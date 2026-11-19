const V='slice-up-v2',SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n&&(n.ok||n.type==='opaque'))caches.open(V).then(c=>c.put(e.request,n.clone()));return n}).catch(()=>r)))});
