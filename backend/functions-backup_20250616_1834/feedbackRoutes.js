// 📁 functions/feedbackRoutes.js
const express = require("express");
const { admin } = require("../firebase");
const { verifyToken } = require("../middlewares/verifyToken");
const withRateLimit = require("../middlewares/withRateLimit");

const router = express.Router();
const db = admin.firestore();

// 📥 Log richieste
router.use((req, res, next) => {
  console.log(`[🗣️ Feedback] ${req.method} ${req.originalUrl}`);
  next();
});

// 🔐 Middleware globale
router.use(verifyToken);
router.use(withRateLimit(30, 5 * 60 * 1000)); // 30 richieste ogni 5 min

// 📌 POST /feedback → Invia un nuovo feedback
router.post("/", async (req, res) => {
  try {
    const { message, category = "generale", metadata = {} } = req.body;

    if (!message || message.length < 5) {
      return res.status(400).json({ error: "❌ Messaggio troppo corto." });
    }

    const newFeedback = {
      userId: req.userId,
      message,
      category,
      metadata,
      createdAt: new Date(),
    };

    const docRef = await db.collection("Feedback").add(newFeedback);
    res.status(201).json({ id: docRef.id, ...newFeedback });
  } catch (error) {
    console.error("❌ Errore POST feedback:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 GET /feedback → Recupera tutti i feedback (solo admin)
router.get("/", async (req, res) => {
  try {
    const role = req.user.role || "base";
    if (role !== "admin" && role !== "owner") {
      return res.status(403).json({ error: "❌ Accesso negato" });
    }

    const snapshot = await db
      .collection("Feedback")
      .orderBy("createdAt", "desc")
      .get();

    const feedback = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    res.json({ feedback });
  } catch (error) {
    console.error("❌ Errore GET feedback:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 DELETE /feedback/:id → Elimina un feedback (solo admin)
router.delete("/:id", async (req, res) => {
  try {
    const role = req.user.role || "base";
    if (role !== "admin" && role !== "owner") {
      return res.status(403).json({ error: "❌ Accesso negato" });
    }

    const docId = req.params.id;
    if (!docId) {
      return res.status(400).json({ error: "❌ ID feedback richiesto." });
    }

    await db.collection("Feedback").doc(docId).delete();
    res.json({ message: "✅ Feedback eliminato." });
  } catch (error) {
    console.error("❌ Errore DELETE feedback:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

module.exports = router;
