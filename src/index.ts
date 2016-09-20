let firebase = require("firebase");
let assert = require("assert");
var settings = require('../serviceAccountCredentials.json');
var FCM = require('fcm-node');

let lockerRoomName = "locker-room"
let lockerRoomPath = "/topics/" + lockerRoomName
let lockerRoomTitle = "Locker room"


var serverKey = process.env.FIREBASE_SERVER_KEY;
assert(serverKey, 'Must have a FIREBASE_SERVER_KEY set');
var databaseURL = process.env.FIREBASE_DATABASE_URL;
assert(databaseURL, 'Must have a FIREBASE_DATABASE_URL set');
var firebaseConfigString = process.env.FIREBASE_CONFIG;
assert(firebaseConfigString, 'Must have a FIREBASE_CONFIG set');
var firebaseConfig = JSON.parse(firebaseConfigString);

interface ILockerRoomMessage {
    creator: String,
    text: String,
    notified: Boolean,
}

interface IDataSnapshot{
    val: () => ILockerRoomMessage
    key: () => String
}

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
    serviceAccount: firebaseConfig,
    databaseURL: databaseURL,
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database();
var lockerRoom = db.ref(lockerRoomName);
var fcm = new FCM(serverKey);

lockerRoom.on("child_added", function(snapshot: IDataSnapshot) {
    let lockerMessage = snapshot.val();
    let lockerMessageKey = snapshot.key;
    if (!lockerMessage.notified) {
         var message = {
            to: lockerRoomPath, 
            "collapse_key": lockerRoomName,
            "notification": {
                "title": lockerRoomTitle,
                "body": lockerMessage.creator + ": " + lockerMessage.text
            },
            "priority": "high",
            "dry_run": false
        };

        fcm.send(message, function(err, response){
            if (err) {
                console.log("Something has gone wrong!");
                console.error(err);
            } else {
                console.log("Successfully sent with response: ", response);
                console.dir(response);
                var toBepdated = lockerRoom.child(lockerMessageKey);
                toBepdated.update({'notified': true});
            }
        });
    }
});




