from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
import openai
import os

router = APIRouter()

# ✅ Inizializza Firebase se non già attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ Chiave API OpenAI mancante")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Modello della richiesta
class CheckinRequest(BaseModel):
    user_id: str
    booking_id: str
    guest_name: str
    email: str
    checkin_date: str
    property_id: str

@router.post("/agent/checkin/send-welcome")
async def send_checkin_message(request: CheckinRequest):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔹 Simulazione messaggio di benvenuto AI
        prompt = f"""
        Sei un assistente virtuale per hotel di lusso.
        Scrivi un messaggio di benvenuto per l’ospite {request.guest_name},
        che ha una prenotazione per il {request.checkin_date}.
        Includi tono cortese, ringraziamenti, orari check-in/out e possibilità di upgrade.
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un assistente cortese e professionale per hotel."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )

        ai_message = response.choices[0].message.content.strip()

        # 🔥 Salva nel Firestore
        hub_ref = db.collection("ai_agent_hub").document(request.user_id)
        actions_ref = hub_ref.collection("actions").document(action_id)

        actions_ref.set({
            "actionId": action_id,
            "type": "checkin",
            "status": "completed",
            "startedAt": now,
            "context": request.dict(),
            "output": {
                "message_sent": ai_message,
                "status": "sent"
            }
        })

        hub_ref.set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        return {
            "status": "completed",
            "message": "✉️ Messaggio di check-in generato e salvato",
            "output": {
                "message": ai_message
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore check-in: {str(e)}")
