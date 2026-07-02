/* Service Worker — Grenzraum entdecken · Stempelpass (Demo-Prototyp)
 * Cacht AUSSCHLIESSLICH die Stempelpass-App-Dateien (cache-first),
 * alle anderen Requests laufen unverändert ans Netz (Passthrough) —
 * die übrigen Demo-Seiten werden bewusst NICHT gecacht. */
'use strict';

var CACHE = 'grzr-stempelpass-v1';
var ASSETS = ['./stempelpass.html', './manifest.json', './icon-192.png', './icon-512.png'];

/* Pfade relativ zum SW-Scope auflösen (funktioniert auch im GitHub-Pages-Unterpfad) */
var ASSET_PATHS = ASSETS.map(function (a) {
  return new URL(a, self.location.href).pathname;
});

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return; /* Passthrough */
  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;            /* Fremd-Origin: Passthrough (CDNs, Fonts …) */
  if (ASSET_PATHS.indexOf(url.pathname) === -1) return;       /* andere Demo-Seiten: Passthrough, kein Caching */

  /* cache-first, nur für die vier Stempelpass-Dateien; Query (?stamp=…) wird ignoriert */
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(url.pathname).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (resp) {
          if (resp && resp.ok) cache.put(url.pathname, resp.clone());
          return resp;
        });
      });
    })
  );
});
