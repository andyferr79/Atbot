# ✅ FILE: checkinDispatcher.py
from firebase_config import db
from datetime import datetime
import httpx

async def handle(user_id: str, context: dict) -> dict:
    try:
        guest_name = context.get("guest_name", "Ospite")
        guest_email = context.get("guest_email")
        reservation_id = context.get("reservation_id")
        property_id = context.get("property_id", "unknown")

        # ✅ Messaggio di cortesia
        welcome_msg = f"Caro {guest_name}, benvenuto! Il tuo check-in è confermato. Trovi i dettagli della prenotazione nella tua email."

        # ✅ Invia Email (mock, da sostituire con API reale)
        async with httpx.AsyncClient() as client:
            email_payload = {
                "to": guest_email,
                "subject": "📩 Check-in confermato",
                "body": welcome_msg,
                "attachments": context.get("attachments", [])
            }
            await client.post("http://127.0.0.1:8000/send-email", json=email_payload)

        # ✅ Registra documento IA
        now = datetime.utcnow()
        doc_ref = db.collection("ai_agent_hub").document(user_id).collection("documents").document()
        doc_ref.set({
            "documentId": doc_ref.id,
            "type": "checkin_confirmation",
            "content": welcome_msg,
            "generatedAt": now,
            "linkedReservation": reservation_id,
            "linkedProperty": property_id
        })

        return {
            "status": "completed",
            "message": f"✉️ Email inviata a {guest_email}",
            "summary": f"Check-in confermato per {guest_name}",
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Errore invio email: {str(e)}"
        }
