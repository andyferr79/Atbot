# ✅ FILE: dispatchers/upsellDispatcher.py

from datetime import datetime
from uuid import uuid4
from firebase_config import db

# ✅ Funzione principale: accetta user_id e context
async def handle(user_id: str, context: dict) -> dict:
    try:
        booking_id = context.get("booking_id", "unknown")
        guest_name = context.get("guest_name", "Valued Guest")
        room_type = context.get("room_type", "standard")
        checkin_date = context.get("checkin_date", "unknown")
        available_upgrades = context.get("available_upgrades", [])
        extra_services = context.get("extra_services", [])
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔎 Genera suggerimenti di up-sell
        upsell_options = []

        if "Deluxe" in available_upgrades:
            upsell_options.append("Upgrade alla camera Deluxe con colazione inclusa.")
        if "Suite" in available_upgrades:
            upsell_options.append("Upgrade alla Suite con vista panoramica.")

        if "Spa" in extra_services:
            upsell_options.append("Accesso gratuito alla Spa per 2 persone.")
        if "Parcheggio" in extra_services:
            upsell_options.append("Parcheggio riservato incluso.")
        if "Colazione" in extra_services:
            upsell_options.append("Colazione in camera inclusa.")

        # 🔥 Salva azione in Firestore
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
            "message": "✅ Suggerimenti di up-sell generati con successo.",
            "suggestions": upsell_options,
            "actionId": action_id
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "❌ Errore nella generazione dei suggerimenti di up-sell."
        }
