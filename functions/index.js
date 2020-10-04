const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webPush = require("web-push");

var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-c7f7e.firebaseio.com/",
});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        webPush.setVapidDetails(
          "mailto:kumarmukul771@gmail.com",
          "BMo_Wyr-qB6XKqfdUdiP52qpK7C0LEuoZesEn48jorn-CnMrwT5lCwshuN3UGJCP9n9HiXelo-EqGjb1OZ8q324",
          "oNxyyvOcuL6efBY_oz5btvfLNvnMbh5gstbM48YitGo"
        );

        return admin.database().ref("subscriptions").once("value");
      })
      .then((subscription) => {
        subscription.forEach((sub) => {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          webPush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added",
                openUrl: "/help",
              })
            )
            .catch((err) => console.log(err));
        });

        return response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (err) {
        return response.status(500).json({ error: err });
      });
  });
});
