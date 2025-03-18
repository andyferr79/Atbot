const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const AI_BACKEND_URL = "http://127.0.0.1:8000";

// ✅ Middleware autenticazione
async function authenticate(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw { status: 403, message: "❌ Token mancante" };
  try {
    return await admin.auth().verifyIdToken(token);
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

// 📌 GET - Generare la pianificazione ottimizzata delle pulizie
exports.generateHousekeepingSchedule = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "❌ Usa GET." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 30, 10 * 60 * 1000);

      const bookingsSnapshot = await db.collection("Bookings").get();
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        checkInDate: doc.data().checkInDate?.toDate().toISOString(),
        checkOutDate: doc.data().checkOutDate?.toDate().toISOString(),
      }));

      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/housekeeping/optimize`,
        { bookingsData }
      );

      if (aiResponse.status !== 200 || !aiResponse.data.schedule) {
        throw new Error("Risposta non valida dal backend AI.");
      }

      await db.collection("HousekeepingSchedules").doc("latest").set({
        schedule: aiResponse.data.schedule,
        generatedAt: new Date(),
      });

      return res.json({
        message: "✅ Pianificazione pulizie generata con successo!",
        schedule: aiResponse.data.schedule,
      });
    } catch (error) {
      functions.logger.error("❌ Errore pianificazione pulizie:", error);
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);

// 📌 POST - Richiedere aggiornamento manuale pianificazione pulizie
exports.updateHousekeepingSchedule = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "❌ Usa POST." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 20, 10 * 60 * 1000);

      const bookingsSnapshot = await db.collection("Bookings").get();
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        checkInDate: doc.data().checkInDate?.toDate().toISOString(),
        checkOutDate: doc.data().checkOutDate?.toDate().toISOString(),
      }));

      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/housekeeping/optimize`,
        { bookingsData }
      );

      if (aiResponse.status !== 200 || !aiResponse.data.schedule) {
        throw new Error("Risposta non valida dal backend AI.");
      }

      await db.collection("HousekeepingSchedules").doc("latest").set({
        schedule: aiResponse.data.schedule,
        generatedAt: new Date(),
      });

      res.json({
        message: "✅ Pianificazione pulizie aggiornata manualmente!",
        schedule: aiResponse.data.schedule,
      });
    } catch (error) {
      functions.logger.error("❌ Errore aggiornamento manuale pulizie:", error);
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);

// 📌 GET - Recuperare l'ultima pianificazione salvata
exports.getLatestHousekeepingSchedule = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "❌ Usa GET." });
    }

    try {
      await authenticate(req);
      const ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown_ip";
      await checkRateLimit(ip, 50, 10 * 60 * 1000);

      const scheduleDoc = await db
        .collection("HousekeepingSchedules")
        .doc("latest")
        .get();

      if (!scheduleDoc.exists) {
        return res.json({
          message: "⚠️ Nessuna pianificazione trovata.",
          schedule: null,
        });
      }

      const data = scheduleDoc.data();
      return res.json({
        schedule: data.schedule,
        generatedAt: data.generatedAt.toDate().toISOString(),
      });
    } catch (error) {
      functions.logger.error(
        "❌ Errore recupero pianificazione pulizie:",
        error
      );
      return res
        .status(error.status || 500)
        .json({ error: error.message || "Errore interno" });
    }
  }
);
