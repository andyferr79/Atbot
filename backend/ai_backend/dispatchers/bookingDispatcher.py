from firebase_config import db
from datetime import datetime, timedelta
import uuid
from dispatchers.logUtils import log_info, log_error

# ✅ Crea e salva prenotazione
def run(user_id: str, context: dict) -> dict:
    now = datetime.utcnow()
    try:
        log_info(user_id, "bookingDispatcher", "new_booking", context)

        booking_id = f"booking-{uuid.uuid4().hex[:6]}"
        data = {
            "guest_name": context.get("guest_name"),
            "checkin_date": context.get("checkin_date"),
            "checkout_date": context.get("checkout_date"),
            "room_type": context.get("room_type"),
            "num_guests": context.get("num_guests"),
            "price_total": context.get("price_total"),
            "source": context.get("source"),
            "notes": context.get("notes", ""),
            "createdAt": now
        }

        db.collection("ai_agent_hub").document(user_id).collection("bookings").document(booking_id).set(data)

        # 🧠 Tracciamento azione IA
        action_id = f"booking-{uuid.uuid4().hex[:6]}"
        action = {
            "type": "booking_created",
            "status": "completed",
            "context": context,
            "output": f"📌 Prenotazione per {data['guest_name']} salvata con successo.",
            "startedAt": now,
            "completedAt": now
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action)

        output = {
            "status": "completed",
            "bookingId": booking_id,
            "output": action["output"]
        }

        log_info(user_id, "bookingDispatcher", "new_booking", context, output)
        return output

    except Exception as e:
        log_error(user_id, "bookingDispatcher", "new_booking", e, context)
        return { "status": "error", "message": f"❌ Errore booking: {str(e)}" }

# ✅ Analisi prenotazioni in arrivo (usabile in futuro)
async def handle_booking_request(user_id: str, context: dict):
    try:
        today = datetime.utcnow().date()
        tomorrow = today + timedelta(days=1)

        docs = db.collection("ai_agent_hub").document(user_id).collection("bookings").stream()
        bookings = [
            b.to_dict() for b in docs
            if "checkin_date" in b.to_dict()
            and datetime.strptime(b.to_dict()["checkin_date"], "%Y-%m-%d").date() == tomorrow
        ]

        if not bookings:
            return { "status": "completed", "output": "🔍 Nessuna prenotazione prevista per domani." }

        lines = [f"📅 Prenotazioni per domani: {len(bookings)}"]
        lines += [f"- {b.get('guest_name', 'Ospite')} ({b['checkin_date']} → {b.get('checkout_date', '?')})" for b in bookings]

        return { "status": "completed", "output": "\n".join(lines) }

    except Exception as e:
        return { "status": "error", "output": f"❌ Errore analisi prenotazioni: {str(e)}" }

# ✅ Entry point del dispatcher master
async def handle(user_id: str, context: dict):
    return run(user_id, context)
