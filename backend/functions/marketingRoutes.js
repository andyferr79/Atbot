const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendNotification } = require("./lib/sendNotification");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Middleware Autenticazione
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

// ==============================
// 📌 POST SOCIAL MEDIA
// ==============================

exports.getSocialMediaPosts = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("SocialPosts").get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.json(posts);
  } catch (error) {
    functions.logger.error("❌ Errore recupero post social:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

exports.createSocialPost = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { platform, content, scheduledDate } = req.body;
    if (!platform || !content) {
      return res.status(400).json({ error: "❌ Campi obbligatori mancanti." });
    }

    const newPost = {
      platform,
      content,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdAt: new Date(),
    };

    const docRef = await db.collection("SocialPosts").add(newPost);
    return res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    functions.logger.error("❌ Errore creazione post:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

exports.deleteSocialPost = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Usa DELETE." });
  }

  try {
    await authenticate(req);
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: "❌ postId richiesto." });
    }

    await db.collection("SocialPosts").doc(postId).delete();
    return res.json({ message: "✅ Post eliminato." });
  } catch (error) {
    functions.logger.error("❌ Errore eliminazione post:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// ==============================
// 📌 CAMPAGNE MARKETING
// ==============================

exports.getMarketingCampaigns = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const snapshot = await db.collection("MarketingCampaigns").get();
    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    res.json(campaigns);
  } catch (error) {
    functions.logger.error("❌ Errore recupero campagne marketing:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Errore interno" });
  }
});

// 📌 POST - Email marketing IA
exports.generateEmailCampaign = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Usa POST." });
  }

  try {
    await authenticate(req);
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown_ip";
    await checkRateLimit(ip, 50, 10 * 60 * 1000);

    const { userId, structureName = "La tua struttura" } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId richiesto" });
    }

    const now = new Date();

    const subject = `Offerta esclusiva da ${structureName}`;
    const content = `
Ciao 👋

Abbiamo pensato a qualcosa di speciale per te! 🎁

Prenota ora da ${structureName} e ottieni:
✅ 10% di sconto
✅ Colazione inclusa
✅ Check-out esteso gratuito

📅 Offerta valida solo per pochi giorni!

👉 Prenota adesso e approfitta di questa occasione.

Grazie per aver scelto ${structureName}! 💙
`;

    const actionRef = db
      .collection("ai_agent_hub")
      .doc(userId)
      .collection("actions")
      .doc();

    await actionRef.set({
      actionId: actionRef.id,
      type: "email_marketing",
      status: "completed",
      startedAt: now,
      context: { structureName },
      output: { subject, content },
      priority: "normal",
    });

    await sendNotification({
      userId,
      title: "Email Marketing Generata",
      description: `È stata generata un’email marketing per ${structureName}.`,
      type: "ai",
    });

    return res.status(200).json({
      message: "✅ Email marketing generata",
      actionId: actionRef.id,
      subject,
      content,
    });
  } catch (err) {
    functions.logger.error("❌ Errore generateEmailCampaign:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Errore generazione email IA" });
  }
});
