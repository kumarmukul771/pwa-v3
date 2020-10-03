importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");
const CACHE_STATIC_NAME = "static-v17";
const CACHE_DYNAMIC_NAME = "dynamic-v2";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/src/js/app.js",
  "/offline.html",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/idb.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

function isInArray(string, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }

  return false;
}

// Cache trimmimg
// function trimCache(cacheName, maxlimit) {
//   caches.open(cacheName).then(function (cache) {
//     return cache.keys().then(function (keys) {
//       if (keys.length > maxlimit) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxlimit));
//       }
//     });
//   });
// }

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing service worker...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log("[Service worker] Precaching app shell", cache);
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating service worker...", event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("[Service worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Cache then network strategy
self.addEventListener("fetch", function (event) {
  var url = "https://pwagram-c7f7e.firebaseio.com/posts.json";
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        var clonedRes = res.clone();
        clearAllData("posts")
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData("posts", data[key]);
            }
          });

        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

// Cache then network fall strategy
// self.addEventListener('fetch', event => {
//     event.respondWith(
//         caches.match(event.request)
//             .then(response => {
//                 if (response) {
//                     return response;
//                 } else {
//                     return fetch(event.request)
//                         .then(res => {
//                             return caches.open(CACHE_DYNAMIC_NAME)
//                                 .then(cache => {
//                                     cache.put(event.request.url, res.clone());
//                                     return res;
//                                 })
//                         })
//                         .catch(err => {
//                             return caches.open(CACHE_STATIC_NAME)
//                                 .then(cache => {
//                                     return cache.match('/offline.html')
//                                 })
//                         });
//                 }
//             })
//     );
// })

// Cache only strategy
// self.addEventListener('fetch', event => {
//     event.respondWith(
//         caches.match(event.request)
//     );
// })

// Network only strategy
// self.addEventListener('fetch', event => {
//     event.respondWith(
//         fetch(event.request)
//     );
// })

// Network first then cache strategy
// self.addEventListener('fetch', event => {
//     event.respondWith(
//         fetch(event.request)
//             .catch(err => {
//                 return caches.match(event.request)
//             })
//     );
// })
