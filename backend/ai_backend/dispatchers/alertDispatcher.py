from firebase_config import db
from datetime import datetime
from uuid import uuid4
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import get_memory  # ✅ Import memoria

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    alert_id = str(uuid4())

    # 🔍 Estrai dati dal context
    title = context.get("title", "Anomalia rilevata")
    description = context.get("description", "")
    severity = context.get("severity", "medium")  # low, medium, high, critical
    related_agent = context.get("source", "unknown")

    try:
        # 🧠 Recupera memoria GPT
        memory = await get_memory(user_id)
        context["memory"] = memory

        log_info(user_id, "alertDispatcher", f"register_alert_{severity}", context)

        # 🔥 Scrivi l’alert nella collezione dedicata
        alert_ref = db.collection("ai_agent_hub").document(user_id).collection("alerts").document(alert_id)
        alert_ref.set({
            "alertId": alert_id,
            "title": title,
            "description": description,
            "severity": severity,
            "source": related_agent,
            "timestamp": now
        })

        # 🔔 Crea una notifica IA per l’utente (collegata all’alert)
        db.collection("notifications").add({
            "userId": user_id,
            "type": "alert",
            "title": f"⚠️ {title}",
            "message": description,
            "severity": severity,
            "read": False,
            "createdAt": now
        })

        output = {
            "status": "completed",
            "message": f"🔔 Alert '{title}' registrato con priorità '{severity}'.",
            "alertId": alert_id,
            "severity": severity
        }

        log_info(user_id, "alertDispatcher", f"register_alert_{severity}", context, output)
        return output

    except Exception as e:
        log_error(user_id, "alertDispatcher", f"register_alert_{severity}", e, context)
        return {
            "status": "error",
            "message": "❌ Errore durante la registrazione dell’alert.",
            "error": str(e)
        }
