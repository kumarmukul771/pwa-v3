importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");
const CACHE_STATIC_NAME = "static-v26";
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



// This event will be executed whenever the sw beleives it re-established connectivity
// or if connection was always there as soon as the new sync task was triggered
self.addEventListener("sync", function (event) {
  console.log("[Service worker] Background Syncing", event);

  if (event.tag === "sync-new-posts") {
    console.log("[Service worker] Syncing new posts");
    event.waitUntil(
      // Get data from indexedDB
      readAllData("sync-posts").then(function (data) {
        console.log(data);
        for (var dt of data) {
          // Try sending each data one by one to server(to custom endpoint)
          fetch(
            " https://us-central1-pwagram-c7f7e.cloudfunctions.net/storePostData",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image:
                  "https://c4.wallpaperflare.com/wallpaper/598/699/634/disha-patani-women-actress-model-bollywood-actresses-hd-wallpaper-preview.jpg",
              }),
            }
          )
            .then((res) => {
              console.log("Sent data in serviceWorker", res);
              if (res.ok) {
                res.json().then((resData) => {
                  deleteFromData("sync-posts", resData.id);
                });
              }
            })
            .catch((err) => {
              console.log("Error sending data");
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  var notification = event.notification;
  var action = event.action;
  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was clicked");
    notification.close();
  } else {
    console.log(action);

    event.waitUntil(
      // clients refers to all windows or all browser tasks related to this serviceWorker
      clients.matchAll().then((clis) => {
        // Now here we want to find windows managed by this serviceWorker which are visible,
        // so open windows where our application runs
        var client = clis.find((c) => {
          return c.visibilityState === "visible";
        });

        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
      })
    );

    // event.waitUntil(
    //     clients.matchAll()
    //       .then(function(clis) {
    //         var client = clis.find(function(c) {
    //           return c.visibilityState === 'visible';
    //         });
  
    //         if (client !== undefined) {
    //           client.navigate(notification.data.url);
    //           client.focus();
    //         } else {
    //           clients.openWindow(notification.data.url);
    //         }
    //         notification.close();
    //       })
    //   );
    notification.close();
  }
});

// When we swipe notification
self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed.", event);
});

// Listening to push messages
self.addEventListener("push", (event) => {
  console.log("Push notification received!", event);

  var data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/",
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
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
