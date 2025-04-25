// 📁 functions/triggers/onUserCreated.js
const { auth } = require("firebase-functions/v1"); // ← namespace v1
const admin = require("firebase-admin");

exports.addDefaultRole = auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
});
