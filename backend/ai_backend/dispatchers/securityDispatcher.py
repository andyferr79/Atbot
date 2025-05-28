# ✅ FILE: dispatchers/securityDispatcher.py

from datetime import datetime
from uuid import uuid4
from firebase_config import db

# ✅ Funzione principale dell'agente Security
async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔍 Estrai parametri dal context
        event_type = context.get("type", "unknown_event")
        details = context.get("details", "Nessun dettaglio fornito.")
        severity = context.get("severity", "low")
        source = context.get("source", "sconosciuto")

        # 🤖 Genera raccomandazione in base alla gravità
        if severity == "high":
            recommendation = "🔴 Allerta immediata: blocca accesso e avvisa l'amministratore."
        elif severity == "medium":
            recommendation = "🟠 Monitorare l'attività e considerare il blocco IP temporaneo."
        else:
            recommendation = "🟢 Nessuna azione richiesta. Log salvato per tracciabilità."

        # 🧠 Salva nel Firestore
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        actions_ref.set({
            "actionId": action_id,
            "type": "security",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "recommendation": recommendation,
                "logged": True
            }
        })

        # 🆙 Aggiorna stato utente
        db.collection("ai_agent_hub").document(user_id).set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        return {
            "status": "completed",
            "recommendation": recommendation,
            "actionId": action_id,
            "logged": True
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "❌ Errore SecurityAgent"
        }
