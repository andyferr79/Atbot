// 📁 E:\ATBot\backend\functions\triggers\onUserCreated.js
const { auth } = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.addDefaultRole = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || "";

  console.log(`👤 Nuovo utente registrato: ${uid} (${email})`);

  // 📌 Scrive su Firestore se non già presente
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      uid,
      email,
      role: "user",
      plan: "BASE",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Documento utente creato in Firestore");
  } else {
    console.log("ℹ️ Documento già esistente");
  }

  // 🔐 Custom Claims
  await admin.auth().setCustomUserClaims(uid, {
    role: "user",
    plan: "BASE",
  });
  console.log("✅ Custom claims assegnati");

  return;
});
