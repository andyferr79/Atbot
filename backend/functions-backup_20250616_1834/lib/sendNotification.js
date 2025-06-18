const admin = require("firebase-admin");

async function sendNotification({ userId, title, description, type = "ai" }) {
  if (!userId || !title || !description) {
    throw new Error("userId, title e description sono obbligatori");
  }

  const db = admin.firestore();
  const now = new Date();
  const notificationRef = db
    .collection("notifications")
    .doc(userId)
    .collection("list")
    .doc();

  const notification = {
    id: notificationRef.id,
    type, // "ai", "admin", "marketing", ecc.
    title,
    description,
    timestamp: now,
    read: false,
  };

  await notificationRef.set(notification);

  return notificationRef.id;
}

module.exports = { sendNotification };
