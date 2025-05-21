from datetime import datetime
from uuid import uuid4
from firebase_config import db

def handle(context: dict) -> dict:
    try:
        user_id = context.get("user_id", "unknown")
        booking_id = context.get("booking_id", "unknown")
        guest_name = context.get("guest_name", "Valued Guest")
        room_type = context.get("room_type", "standard")
        checkin_date = context.get("checkin_date", "unknown")
        now = datetime.utcnow()
        action_id = str(uuid4())

        # Genera suggerimenti di up-sell basati sul tipo di camera
        upsell_options = []
        if room_type == "standard":
            upsell_options.append("Upgrade a camera deluxe con vista mare")
            upsell_options.append("Accesso esclusivo alla lounge VIP")
        elif room_type == "deluxe":
            upsell_options.append("Servizio di spa gratuito per due")
            upsell_options.append("Cena gourmet inclusa")

        # Salva i suggerimenti nel database Firestore
        hub_ref = db.collection("ai_agent_hub").document(user_id)
        actions_ref = hub_ref.collection("actions").document(action_id)

        actions_ref.set({
            "actionId": action_id,
            "type": "upsell",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "suggestions": upsell_options
            }
        })

        return {
            "status": "completed",
            "message": "Suggerimenti di up-sell generati con successo.",
            "suggestions": upsell_options,
            "actionId": action_id
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Errore nella generazione dei suggerimenti di up-sell."
        }
