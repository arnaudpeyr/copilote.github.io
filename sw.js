// Copilote Mama — service worker : l'app s'ouvre même sans réseau (dernière version vue).
// Stratégie "réseau d'abord" : quand il y a du réseau, on a TOUJOURS la dernière version ; sinon la copie du téléphone.
const CACHE = 'copilote-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isLib = url.hostname === 'cdn.jsdelivr.net';
  if (!sameOrigin && !isLib) return; // Supabase, polices... : jamais interceptés
  e.respondWith(
    fetch(req).then(function(res){
      if (res && (res.ok || res.type === 'opaque')){
        const copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req, { ignoreSearch: true }).then(function(hit){
        return hit || (req.mode === 'navigate' ? caches.match('./', { ignoreSearch: true }) : Response.error());
      });
    })
  );
});
