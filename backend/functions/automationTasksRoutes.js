const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { Timestamp, FieldValue } = admin.firestore; // ✅ Importazione corretta

// ✅ Middleware verifica token utente
const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(403).json({ error: "❌ Token mancante" });
    return false;
  }
  try {
    req.user = await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    functions.logger.error("❌ Token non valido:", error);
    res.status(401).json({ error: "❌ Token non valido" });
    return false;
  }
};

// ✅ API per creare un task automatico
exports.createAutomationTask = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "❌ Usa POST." });
  if (!(await verifyToken(req, res))) return;

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

    res.json({ message: "✅ Task creato con successo!", id: taskRef.id });
  } catch (error) {
    functions.logger.error("❌ Errore nella creazione del task:", error);
    res.status(500).json({ error: "Errore nella creazione del task" });
  }
});

// ✅ API per ottenere tutti i task
exports.getAutomationTasks = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;

  try {
    const snapshot = await db.collection("AutomationTasks").get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || "N/A",
    }));

    res.json({ tasks });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero dei task:", error);
    res.status(500).json({ error: "Errore nel recupero dei task" });
  }
});

// ✅ API per ottenere un singolo task per ID
exports.getAutomationTaskById = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "❌ Usa GET." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "❌ ID del task mancante" });

    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists)
      return res.status(404).json({ error: "❌ Task non trovato" });

    res.json({ id: taskDoc.id, ...taskDoc.data() });
  } catch (error) {
    functions.logger.error("❌ Errore nel recupero del task:", error);
    res.status(500).json({ error: "Errore nel recupero del task" });
  }
});

// ✅ API per aggiornare un task
exports.updateAutomationTask = functions.https.onRequest(async (req, res) => {
  if (req.method !== "PUT")
    return res.status(405).json({ error: "❌ Usa PUT." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    const { taskType, assignedTo, dueDate } = req.body;

    if (!id) return res.status(400).json({ error: "❌ ID del task mancante" });
    if (!taskType && !assignedTo && !dueDate) {
      return res
        .status(400)
        .json({ error: "❌ Nessun campo fornito per l'aggiornamento" });
    }

    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists)
      return res.status(404).json({ error: "❌ Task non trovato" });

    const updateData = {};
    if (taskType) updateData.taskType = taskType;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (dueDate) updateData.dueDate = Timestamp.fromDate(new Date(dueDate));

    await taskRef.update(updateData);

    res.json({ message: "✅ Task aggiornato con successo!" });
  } catch (error) {
    functions.logger.error("❌ Errore nell'aggiornamento del task:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento del task" });
  }
});

// ✅ API per eliminare un task
exports.deleteAutomationTask = functions.https.onRequest(async (req, res) => {
  if (req.method !== "DELETE")
    return res.status(405).json({ error: "❌ Usa DELETE." });
  if (!(await verifyToken(req, res))) return;

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "❌ ID del task mancante" });

    const taskRef = db.collection("AutomationTasks").doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists)
      return res.status(404).json({ error: "❌ Task non trovato" });

    await taskRef.delete();

    res.json({ message: "✅ Task eliminato con successo" });
  } catch (error) {
    functions.logger.error("❌ Errore nell'eliminazione del task:", error);
    res.status(500).json({ error: "Errore nell'eliminazione del task" });
  }
});
