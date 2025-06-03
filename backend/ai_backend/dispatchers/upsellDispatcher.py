from datetime import datetime
from uuid import uuid4
from firebase_config import db
from dispatchers.logUtils import log_info, log_error  # ✅ Logging uniforme

# ✅ Mappa suggerimenti up-sell standard
UPSERVICES_SUGGESTIONS = {
    "Deluxe": "Upgrade alla camera Deluxe con colazione inclusa.",
    "Suite": "Upgrade alla Suite con vista panoramica.",
    "Spa": "Accesso gratuito alla Spa per 2 persone.",
    "Parcheggio": "Parcheggio riservato incluso.",
    "Colazione": "Colazione in camera inclusa.",
    "Shuttle": "Servizio navetta gratuito verso aeroporto o stazione.",
    "Cena": "Cena romantica in struttura a prezzo scontato.",
    "Wine tasting": "Degustazione vini locali inclusa.",
    "Early check-in": "Early check-in senza costi aggiuntivi.",
    "Late check-out": "Late check-out garantito gratuito."
}

# ✅ Funzione principale dell'agente upsell
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        # 🎯 Estrai dettagli booking
        guest_name = context.get("guest_name", "Valued Guest")
        booking_id = context.get("booking_id", "N/A")
        checkin_date = context.get("checkin_date", "N/A")
        room_type = context.get("room_type", "Standard")

        # 📦 Recupera profilo struttura
        profile_doc = db.collection("ai_agent_hub").document(user_id).collection("properties").document("main").get()
        profile_data = profile_doc.to_dict() if profile_doc.exists else {}

        # 🔎 Servizi disponibili effettivi
        available_services = profile_data.get("services", []) + profile_data.get("extraServices", [])
        available_services_lower = [s.lower() for s in available_services]

        # 🔍 Crea suggerimenti coerenti
        suggestions = []
        for keyword, message in UPSERVICES_SUGGESTIONS.items():
            if keyword.lower() in available_services_lower:
                suggestions.append(message)

        if not suggestions:
            suggestions.append("🎯 Nessun servizio extra disponibile per l'up-sell al momento.")

        # 💾 Salva azione IA
        action_data = {
            "actionId": action_id,
            "type": "upsell",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "suggestions": suggestions,
                "guest_name": guest_name,
                "booking_id": booking_id,
                "checkin_date": checkin_date
            }
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)
        log_info(user_id, "upsellDispatcher", "upsell_suggestions", context, action_data["output"])

        return {
            "status": "completed",
            "actionId": action_id,
            "suggestions": suggestions,
            "message": "✅ Suggerimenti up-sell generati correttamente."
        }

    except Exception as e:
        log_error(user_id, "upsellDispatcher", "upsell_suggestions", e, context)
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "status": "error",
            "startedAt": now,
            "completedAt": datetime.utcnow(),
            "context": context,
            "error": str(e)
        })
        return {
            "status": "error",
            "message": "❌ Errore generazione suggerimenti up-sell.",
            "error": str(e)
        }
