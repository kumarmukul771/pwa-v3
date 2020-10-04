var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");

function openCreatePostModal() {
  createPostArea.style.display = "block";
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }

  // Unregistering ServiceWorker
  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(function (resgistrations) {
  //     for (var i = 0; i < resgistrations.length; i++) {
  //       resgistrations[i].unregister();
  //     }
  //   });
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function onSavedClicked(event) {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then((cache) => {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSavedButton = document.createElement('button');
  // cardSavedButton.textContent = 'Save';
  // cardSavedButton.addEventListener('click', onSavedClicked)
  // cardSupportingText.appendChild(cardSavedButton)
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var receivedDataFromNetwork = false;

fetch("https://pwagram-c7f7e.firebaseio.com/posts.json")
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    console.log("From web", data);
    receivedDataFromNetwork = true;

    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  readAllData("posts").then((data) => {
    if (!receivedDataFromNetwork) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

function sendData() {
  fetch("https://us-central1-pwagram-c7f7e.cloudfunctions.net/storePostData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image:
        "https://akm-img-a-in.tosshub.com/indiatoday/disha-story_647_123017053947.jpg?Uml3NfA9j.kDm_HaRjimZpOdAc32nvKb",
    }),
  }).then((res) => {
    console.log("Sent data", res);
    updateUI();
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Please enter valid data");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
    .then((sw) => {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value.trim(),
        location: locationInput.value.trim(),
      };

      // writeData to indexedDB
      writeData("sync-posts", post)
        .then(function () {
          // Register method allows us to register asynchronization task with serviceWorker.
          //  first argument is id can be any string.We'll later use this id in serviceWorker
          // to react to re-established connectivity and check outstanding tasks we have
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  // Else part for browser that does not support syncmanager and sw.
  else {
    sendData();
  }
});


// if ("caches" in window) {
//   caches
//     .match(url)
//     .then((response) => {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then((data) => {
//       console.log("From cache", data);
//       if (!receivedDataFromNetwork) {
//         var dataArray = [];
//         for (var key in data) {
//           dataArray.push(data[key]);
//         }
//         updateUI(dataArray);
//       }
//     });
// }
