// Creekside app wrapper - keeps the icon/splash/"No signal" page on the phone. The app itself always comes live
// from Google (never cached here). Bump VERSION when you change any wrapper file.
// v3 (24/11/2026, SPEED): this wrapper page opens straight from the phone (cache first) instead of waiting for
// GitHub on every launch; a fresh copy is fetched in the background for next time.
var VERSION = 'creekside-v3';
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
  if (req.mode === 'navigate') {   // cache first (instant splash), refresh the copy in the background; nothing kept + no signal -> "No signal" page
    var fresh = fetch(req).then(function (r) {
      if (r && r.ok) { var copy = r.clone(); return caches.open(VERSION).then(function (c) { return c.put(req, copy); }).then(function () { return r; }); }
      return r;
    });
    e.waitUntil(fresh.catch(function () {}));
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(function (hit) { return hit || fresh; })
      .catch(function () { return caches.match('offline.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
