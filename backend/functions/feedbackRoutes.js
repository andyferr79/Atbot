// 📁 functions/feedbackRoutes.js
const express = require("express");
const { admin } = require("./firebase");
const { verifyToken } = require("./middlewares/verifyToken");
const withRateLimit = require("./middlewares/withRateLimit");

const router = express.Router();
const db = admin.firestore();

router.use(verifyToken);

// 📌 POST /feedback → Invia un nuovo feedback
router.post("/", withRateLimit(10, 60_000), async (req, res) => {
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
router.get("/", withRateLimit(20, 60_000), async (req, res) => {
  try {
    const role = req.user?.role || "base";
    if (role !== "admin" && role !== "owner") {
      return res.status(403).json({ error: "❌ Accesso negato" });
    }

    const snapshot = await db
      .collection("Feedback")
      .orderBy("createdAt", "desc")
      .get();
    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    res.json({ feedback });
  } catch (error) {
    console.error("❌ Errore GET feedback:", error);
    res.status(500).json({ error: "Errore interno" });
  }
});

// 📌 DELETE /feedback/:id → Elimina un feedback (solo admin)
router.delete("/:id", withRateLimit(10, 60_000), async (req, res) => {
  try {
    const role = req.user?.role || "base";
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
