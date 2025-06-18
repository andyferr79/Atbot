// 📁 functions/automationTasksRoutes.js – Gen 2 + Sicurezza + Logging

const express = require("express");
const admin = require("firebase-admin");
const { verifyToken } = require("../middlewares/verifyToken");
const { Timestamp, FieldValue } = admin.firestore;

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const router = express.Router();

// 🔐 Middleware globale
router.use(verifyToken);

// 📊 Logging richieste
router.use((req, res, next) => {
  console.log(
    `[📅 AutomationTasks] ${req.method} ${req.originalUrl} – UID: ${req.user?.uid}`
  );
  next();
});

// ✅ POST /automation/create
router.post("/create", async (req, res) => {
  try {
    const { taskType, assignedTo, dueDate } = req.body;
    if (!taskType || !assignedTo || !dueDate) {
      return res
        .status(400)
        .json({ error: "❌ Tutti i campi sono obbligatori." });
    }

    const taskRef = await db.collection("AutomationTasks").add({
      taskType,
      assignedTo,
      dueDate: Timestamp.fromDate(new Date(dueDate)),
      createdBy: req.user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: "✅ Task creato con successo!",
      id: taskRef.id,
    });
  } catch (error) {
    console.error("❌ Errore nella creazione del task:", error);
    return res.status(500).json({ error: "Errore nella creazione del task" });
  }
});

// ✅ GET /automation
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("AutomationTasks").get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("❌ Errore nel recupero dei task:", error);
    return res.status(500).json({ error: "Errore nel recupero dei task" });
  }
});

// ✅ GET /automation/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "❌ Task non trovato" });
    }

    return res.status(200).json({ id: taskDoc.id, ...taskDoc.data() });
  } catch (error) {
    console.error("❌ Errore nel recupero del task:", error);
    return res.status(500).json({ error: "Errore nel recupero del task" });
  }
});

// ✅ PUT /automation/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { taskType, assignedTo, dueDate } = req.body;

  try {
    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "❌ Task non trovato" });
    }

    const updateData = {};
    if (taskType) updateData.taskType = taskType;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (dueDate) updateData.dueDate = Timestamp.fromDate(new Date(dueDate));

    await taskRef.update(updateData);

    return res
      .status(200)
      .json({ message: "✅ Task aggiornato con successo!" });
  } catch (error) {
    console.error("❌ Errore aggiornamento task:", error);
    return res.status(500).json({ error: "Errore aggiornamento task" });
  }
});

// ✅ DELETE /automation/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "❌ Task non trovato" });
    }

    await taskRef.delete();

    return res.status(200).json({ message: "✅ Task eliminato con successo" });
  } catch (error) {
    console.error("❌ Errore eliminazione task:", error);
    return res.status(500).json({ error: "Errore eliminazione task" });
  }
});

module.exports = router;
