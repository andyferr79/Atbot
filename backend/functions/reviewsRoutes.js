const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware verifica token Firebase
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// Middleware rate limiting Firestore
const checkRateLimit = async (req, res, windowMs = 10 * 60 * 1000) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown_ip";
  const now = Date.now();
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();

  if (rateDoc.exists && now - rateDoc.data().lastRequest < windowMs) {
    res.status(429).json({ error: "❌ Troppe richieste. Riprova più tardi." });
    return false;
  }

  await rateDocRef.set({ lastRequest: now });
  return true;
};

// 📌 Recupera tutte le recensioni
exports.getReviews = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  try {
    const reviewsSnapshot = await db.collection("Reviews").get();
    let totalRating = 0;

    const reviews = reviewsSnapshot.docs.map((doc) => {
      const review = doc.data();
      totalRating += review.rating || 0;
      return {
        id: doc.id,
        guestName: review.guestName || "Anonimo",
        rating: review.rating || 0,
        comment: review.comment || "",
        date: review.date?.toDate().toISOString() || "N/A",
        source: review.source || "Diretto",
      };
    });

    const averageRating = reviews.length
      ? (totalRating / reviews.length).toFixed(2)
      : 0;
    res.json({ reviews, averageRating });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero delle recensioni:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Aggiunge una nuova recensione
exports.addReview = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;
  if (!(await checkRateLimit(req, res))) return;

  const { guestName, rating, comment, source } = req.body;

  if (!rating || isNaN(rating) || rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ error: "❌ Il punteggio deve essere tra 0 e 5." });
  }

  if (comment && comment.length > 500) {
    return res.status(400).json({ error: "❌ Il commento max 500 caratteri." });
  }

  const newReview = {
    guestName: guestName || "Anonimo",
    rating: parseFloat(rating),
    comment: comment || "",
    date: new Date(),
    source: source || "Diretto",
  };

  try {
    const docRef = await db.collection("Reviews").add(newReview);
    res.json({
      message: "✅ Recensione aggiunta con successo",
      id: docRef.id,
      date: newReview.date.toISOString(),
    });
  } catch (error) {
    functions.logger.error("❌ Errore nell'aggiunta della recensione:", error);
    res.status(500).json({ error: error.message });
  }
});
