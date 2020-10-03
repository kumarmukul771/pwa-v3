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

var url = "https://httpbin.org/get";
// Cache then network strategy
self.addEventListener("fetch", (event) => {
  if (event.request.url.indexOf(url) > -1) {
    // Cache then network strategy
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
        return fetch(event.request).then((res) => {
          console.log("Caching");
        //   trimCache(CACHE_DYNAMIC_NAME, 3);
          cache.put(event.request, res.clone());
          return res;
        });
      })
    );
  } else {
    // Cache then network fallback strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // Another way without using regex(regex may give error in some cases)
        //  is using helper function isInArray
        else if (isInArray(event.request.url, STATIC_FILES)) {
          event.respondWith(caches.match(event.request));
        }
        // else if (
        //   new RegExp("\\b" + STATIC_FILES.join("\\b|\\b") + "\\b").test(
        //     event.request.url
        //   )
        // ) {
        // Cache only strategy for static files as they are not gonna change
        //   event.respondWith(caches.match(event.request));
        // }
        else {
          return fetch(event.request)
            .then((res) => {
              return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch((err) => {
              return caches.open(CACHE_STATIC_NAME).then((cache) => {
                //   Making if block more flexible
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
                // if (event.request.url.indexOf("/help")) {
                //   return cache.match("/offline.html");
                // }
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
