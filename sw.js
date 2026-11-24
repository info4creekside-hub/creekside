// Creekside app wrapper - keeps the icon/splash/"No signal" page on the phone. The app itself always comes live
// from Google (never cached here). Bump VERSION when you change any wrapper file.
var VERSION = 'creekside-v1';
var SHELL = ['./', 'index.html', 'offline.html', 'manifest.json', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // Google traffic: untouched
  if (req.mode === 'navigate') {   // network first, so a new EXEC_URL is picked up; offline -> "No signal" page
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put('./', copy); }); return r;
    }).catch(function () { return caches.match('offline.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
