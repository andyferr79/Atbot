from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from firebase_config import db
from datetime import datetime
import uuid

router = APIRouter()

# ✅ Modello dati ospite
class Guest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    roomType: Optional[str] = None

# ✅ GET - Recupera ospiti
@router.get("/guests/{user_id}")
async def get_guests(user_id: str):
    try:
        guests_ref = db.collection("ai_agent_hub").document(user_id).collection("guests")
        guests = [doc.to_dict() | {"id": doc.id} for doc in guests_ref.stream()]
        return guests
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero ospiti: {str(e)}")

# ✅ POST - Aggiungi nuovo ospite
@router.post("/guests/{user_id}")
async def add_guest(user_id: str, guest: Guest):
    try:
        guest_id = f"guest-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow()

        guest_data = guest.dict()
        guest_data["createdAt"] = now
        guest_data["updatedAt"] = now

        db.collection("ai_agent_hub").document(user_id).collection("guests").document(guest_id).set(guest_data)

        return {
            "message": "✅ Ospite aggiunto correttamente",
            "guestId": guest_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore salvataggio ospite: {str(e)}")
