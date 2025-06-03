from datetime import datetime
from uuid import uuid4
from firebase_config import db
from dispatchers.logUtils import log_info, log_error  # ✅ Logging standard

# ✅ Funzione principale dell'agente Security
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        # 🔍 Estrai parametri dal context
        event_type = context.get("type", "unknown_event")
        details = context.get("details", "Nessun dettaglio fornito.")
        severity = context.get("severity", "low").lower()
        source = context.get("source", "sconosciuto")

        if severity not in ["low", "medium", "high"]:
            severity = "low"

        # 🤖 Genera raccomandazione in base alla gravità
        if severity == "high":
            recommendation = "🔴 Allerta immediata: blocca accesso e avvisa l'amministratore."
        elif severity == "medium":
            recommendation = "🟠 Monitorare l'attività e considerare il blocco IP temporaneo."
        else:
            recommendation = "🟢 Nessuna azione richiesta. Log salvato per tracciabilità."

        # 💾 Salva azione IA
        action_data = {
            "actionId": action_id,
            "type": "security",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "event_type": event_type,
                "severity": severity,
                "source": source,
                "recommendation": recommendation,
                "logged": True
            }
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)

        # 📝 Salva anche come documento log
        db.collection("ai_agent_hub").document(user_id).collection("documents").document(action_id).set({
            "documentId": action_id,
            "type": "security_log",
            "generatedAt": now,
            "content": f"[{severity.upper()}] {event_type} – {details}",
            "source_agent": "securityDispatcher",
            "tags": ["security", "log", severity]
        })

        # 🆙 Aggiorna stato utente
        db.collection("ai_agent_hub").document(user_id).set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        log_info(user_id, "securityDispatcher", "security_event", context, action_data["output"])
        return {
            "status": "completed",
            "recommendation": recommendation,
            "actionId": action_id,
            "logged": True
        }

    except Exception as e:
        log_error(user_id, "securityDispatcher", "security_event", e, context)
        return {
            "status": "error",
            "message": "❌ Errore SecurityAgent",
            "error": str(e)
        }
