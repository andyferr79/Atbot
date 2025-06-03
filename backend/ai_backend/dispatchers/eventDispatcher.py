from datetime import datetime
from uuid import uuid4
from firebase_config import db
import httpx
from dispatchers.logUtils import log_info, log_error  # ✅ Logging
from dispatchers.memoryUtils import get_memory_context  # ✅ (futura integrazione)

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    event_id = str(uuid4())

    try:
        log_info(user_id, "eventDispatcher", "process_event", context)

        # 🔍 Estrai parametri richiesti
        trigger = context.get("trigger")
        next_agent = context.get("next_agent")  # es: "upsell", "checkin"
        params = context.get("params", {})

        if not trigger or not next_agent:
            raise ValueError("❌ Parametri insufficienti per evento IA")

        # 🔹 Salva l'evento su Firestore
        event_ref = db.collection("ai_agent_hub").document(user_id).collection("events").document(event_id)
        event_ref.set({
            "eventId": event_id,
            "trigger": trigger,
            "next_agent": next_agent,
            "params": params,
            "status": "dispatched",
            "createdAt": now
        })

        # 🔁 Chiama il dispatcher master via API interna
        async with httpx.AsyncClient() as client:
            dispatch_response = await client.post(
                "http://127.0.0.1:8000/agent/dispatch",
                json={
                    "user_id": user_id,
                    "intent": next_agent,
                    "context": params
                }
            )

        # 📦 Risposta ricevuta
        output = dispatch_response.json()
        linked_action_id = output.get("actionId")

        # 🔄 Aggiorna evento con ID azione collegata
        event_ref.update({
            "linked_action_id": linked_action_id,
            "dispatchedAt": datetime.utcnow(),
            "output_summary": output.get("output", {})
        })

        response = {
            "status": "completed",
            "message": f"📨 Evento '{trigger}' processato e inoltrato a {next_agent}",
            "linked_action_id": linked_action_id
        }

        log_info(user_id, "eventDispatcher", "process_event", context, response)
        return response

    except Exception as e:
        log_error(user_id, "eventDispatcher", "process_event", e, context)
        return {
            "status": "error",
            "message": f"❌ Errore evento IA: {str(e)}"
        }
