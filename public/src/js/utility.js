// db name posts-store , table name=posts , if condition bcs create table only if it is not present
// 1 denotes version number, keyPath is the primary key that we want to use
var dbPromise = idb.open("posts-store", 1, function (db) {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }

  // For synchronization task
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeData(st, data) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.put(data);

    return tx.complete;
  });
}

function readAllData(st) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readonly");
    var store = tx.objectStore(st);

    return store.getAll();
  });
}

function clearAllData(st) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.clear();

    return tx.complete;
  });
}

// Delete 1 item from db
function deleteFromData(st, id) {
  return dbPromise.then((db) => {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.delete(id);

    return tx.complete;
  });
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}