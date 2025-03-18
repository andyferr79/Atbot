const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    throw { status: 401, message: "❌ Token non valido" };
  }
}

// ✅ Middleware Rate Limiting
async function checkRateLimit(ip, maxRequests, windowMs) {
  const rateDocRef = db.collection("RateLimits").doc(ip);
  const rateDoc = await rateDocRef.get();
  const now = Date.now();

  let data = rateDoc.exists ? rateDoc.data() : { count: 0, firstRequest: now };

  if (now - data.firstRequest < windowMs) {
    if (data.count >= maxRequests) {
      throw { status: 429, message: "❌ Troppe richieste. Riprova più tardi." };
    }
    data.count++;
  } else {
    data = { count: 1, firstRequest: now };
  }

  await rateDocRef.set(data);
}

// 📌 GET - Recupera tutte le recensioni
exports.getReviews = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const reviewsSnapshot = await db.collection("Reviews").get();
    let totalRating = 0;

    const reviews = reviewsSnapshot.docs.map((doc) => {
      const data = doc.data();
      totalRating += data.rating || 0;
      return {
        id: doc.id,
        guestName: data.guestName || "Anonimo",
        rating: data.rating || 0,
        comment: data.comment || "",
        date: data.date?.toDate().toISOString() || "N/A",
        source: data.source || "Diretto",
      };
    });

    const averageRating = reviews.length
      ? (totalRating / reviews.length).toFixed(2)
      : 0;

    res.json({ averageRating, reviews });
  } catch (error) {
    functions.logger.error("❌ Errore recupero recensioni:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Aggiungi nuova recensione
exports.addReview = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { guestName, rating, comment, source } = req.body;
    if (!rating || isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ error: "❌ Rating non valido (0-5)." });
    }

    const newReview = {
      guestName: guestName || "Anonimo",
      rating: parseFloat(rating),
      comment: comment?.slice(0, 500) || "",
      source: source || "Diretto",
      date: new Date(),
    };

    const docRef = await db.collection("Reviews").add(newReview);
    res.json({ id: docRef.id, ...newReview });
  } catch (error) {
    functions.logger.error("❌ Errore aggiunta recensione:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 PUT - Aggiorna recensione esistente
exports.updateReview = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });

  try {
    await authenticate(req);
    const { reviewId, updates } = req.body;
    if (!reviewId || !updates) {
      return res
        .status(400)
        .json({ error: "❌ reviewId e aggiornamenti richiesti." });
    }

    await db.collection("Reviews").doc(reviewId).update(updates);
    res.json({ message: "✅ Recensione aggiornata." });
  } catch (error) {
    functions.logger.error("❌ Errore aggiornamento recensione:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 DELETE - Eliminare recensione
exports.deleteReview = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });

  try {
    await authenticate(req);
    const { reviewId } = req.query;
    if (!reviewId) {
      return res.status(400).json({ error: "❌ reviewId richiesto." });
    }

    await db.collection("Reviews").doc(reviewId).delete();
    res.json({ message: "✅ Recensione eliminata." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione recensione:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});
