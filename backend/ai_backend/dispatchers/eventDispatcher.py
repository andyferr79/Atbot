# ✅ FILE: dispatchers/eventDispatcher.py

from datetime import datetime
from uuid import uuid4
from firebase_config import db
import httpx

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        event_id = str(uuid4())

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

        return {
            "status": "completed",
            "message": f"📨 Evento '{trigger}' processato e inoltrato a {next_agent}",
            "linked_action_id": linked_action_id
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Errore evento IA: {str(e)}"
        }
