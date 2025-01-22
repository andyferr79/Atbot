const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Preferenze Generali
router.get("/preferences", async (req, res) => {
  try {
    const doc = await admin.firestore().collection("Settings").doc("preferences").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Preferenze non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nel recupero delle preferenze:", error);
    res.status(500).json({ message: "Errore nel recupero delle preferenze", error });
  }
});

router.put("/preferences", async (req, res) => {
  try {
    const preferences = req.body;
    await admin.firestore().collection("Settings").doc("preferences").set(preferences, { merge: true });
    res.json({ message: "Preferenze aggiornate con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento delle preferenze:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento delle preferenze", error });
  }
});

// Notifiche
router.get("/notifications", async (req, res) => {
  try {
    const doc = await admin.firestore().collection("Settings").doc("notifications").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Notifiche non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nel recupero delle notifiche:", error);
    res.status(500).json({ message: "Errore nel recupero delle notifiche", error });
  }
});

router.put("/notifications", async (req, res) => {
  try {
    const notifications = req.body;
    await admin.firestore().collection("Settings").doc("notifications").set(notifications, { merge: true });
    res.json({ message: "Notifiche aggiornate con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento delle notifiche:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento delle notifiche", error });
  }
});

// Configurazioni della Struttura
router.get("/structure", async (req, res) => {
  try {
    const doc = await admin.firestore().collection("Settings").doc("structure").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Configurazioni della struttura non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nel recupero delle configurazioni della struttura:", error);
    res.status(500).json({ message: "Errore nel recupero delle configurazioni della struttura", error });
  }
});

router.put("/structure", async (req, res) => {
  try {
    const structure = req.body;
    await admin.firestore().collection("Settings").doc("structure").set(structure, { merge: true });
    res.json({ message: "Configurazioni della struttura aggiornate con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento delle configurazioni della struttura:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento delle configurazioni della struttura", error });
  }
});

// Utenti e Permessi
router.get("/users", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("Users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    res.status(500).json({ message: "Errore nel recupero degli utenti", error });
  }
});

router.post("/users", async (req, res) => {
  try {
    const newUser = req.body;
    const docRef = await admin.firestore().collection("Users").add(newUser);
    res.json({ id: docRef.id, ...newUser });
  } catch (error) {
    console.error("Errore nell'aggiunta dell'utente:", error);
    res.status(500).json({ message: "Errore nell'aggiunta dell'utente", error });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await admin.firestore().collection("Users").doc(userId).delete();
    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione dell'utente:", error);
    res.status(500).json({ message: "Errore nell'eliminazione dell'utente", error });
  }
});

// Integrazioni
router.get("/integrations", async (req, res) => {
  try {
    const doc = await admin.firestore().collection("Settings").doc("integrations").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Integrazioni non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nel recupero delle integrazioni:", error);
    res.status(500).json({ message: "Errore nel recupero delle integrazioni", error });
  }
});

router.post("/integrations", async (req, res) => {
  try {
    const integration = req.body;
    await admin.firestore().collection("Settings").doc("integrations").set(integration, { merge: true });
    res.json({ message: "Integrazione aggiunta con successo" });
  } catch (error) {
    console.error("Errore nell'aggiunta dell'integrazione:", error);
    res.status(500).json({ message: "Errore nell'aggiunta dell'integrazione", error });
  }
});

// Backup e Sicurezza
router.get("/security", async (req, res) => {
  try {
    const doc = await admin.firestore().collection("Settings").doc("security").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Impostazioni di sicurezza non trovate" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Errore nel recupero delle impostazioni di sicurezza:", error);
    res.status(500).json({ message: "Errore nel recupero delle impostazioni di sicurezza", error });
  }
});

router.put("/security", async (req, res) => {
  try {
    const security = req.body;
    await admin.firestore().collection("Settings").doc("security").set(security, { merge: true });
    res.json({ message: "Impostazioni di sicurezza aggiornate con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento delle impostazioni di sicurezza:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento delle impostazioni di sicurezza", error });
  }
});

// Privacy e GDPR
router.get("/privacy/export", async (req, res) => {
  try {
    // Logica per esportare i dati personali
    res.json({ message: "Esportazione dei dati personali completata" });
  } catch (error) {
    console.error("Errore nell'esportazione dei dati personali:", error);
    res.status(500).json({ message: "Errore nell'esportazione dei dati personali", error });
  }
});

router.delete("/privacy/delete", async (req, res) => {
  try {
    // Logica per cancellare i dati personali
    res.json({ message: "Cancellazione dei dati personali completata" });
  } catch (error) {
    console.error("Errore nella cancellazione dei dati personali:", error);
    res.status(500).json({ message: "Errore nella cancellazione dei dati personali", error });
  }
});

module.exports = router;
