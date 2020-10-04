var deferredPrompt;

var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function () {
      console.log("Service worker registered!");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  var options = {
    body: "You successfully subscribed to our notification.",
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boat.jpg",
    dir: "ltr",
    lang: "en-US", //BCP 47
    vibrate: [100, 50, 200],
    badge: "/src/images/icons/app-icon-96x96.png",
    actions: [
      {
        action: "confirm",
        title: "Okay",
        icon: "/src/images/icons/app-icon-96x96.png",
      },
      {
        action: "cancel",
        title: "Cancel",
        icon: "/src/images/icons/app-icon-96x96.png",
      },
    ],
  };
  // new Notification("Successfully subscribed!", options);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((swreg) => {
      swreg.showNotification("Successfully subscribed!", options);
    });
  }
}

// Subscribe to push notification
function configurePushSub() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  var reg;
  navigator.serviceWorker.ready
    .then((swreg) => {
      reg = swreg;
      // getSubscription is a method that will return any existing subscription
      return swreg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub == null) {
        // Create a new subscription
        var vapidPublicKey =
          "BMo_Wyr-qB6XKqfdUdiP52qpK7C0LEuoZesEn48jorn-CnMrwT5lCwshuN3UGJCP9n9HiXelo-EqGjb1OZ8q324";
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        // We have a subscription
      }
    })
    .then(newSub=>{
      // Passing this newSub to our back-end server in this firebase
      return fetch("https://pwagram-c7f7e.firebaseio.com/subscriptions.json",{
        method:"POST",
        headers:{
          'Content-Type':'application/json',
          'Accept':'application/json'
        },
        body:JSON.stringify(newSub)
      })
    })
    .then(res=>{
      if(res.ok){
        displayConfirmNotification();
      }
    })
    .catch(err=>console.log(err));
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    console.log("User selected ", result);

    if (result !== "granted") {
      console.log("No notification permission granted");
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  });
}

if ("Notification" in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
