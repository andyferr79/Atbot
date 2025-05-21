from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from firebase_config import db  # ✅ Inizializzazione centralizzata
from firebase_admin import firestore

router = APIRouter()

# ✅ Modello evento
class EventPayload(BaseModel):
    user_id: str
    trigger: str  # es: 'checkin_completed'
    next_agent: str  # es: 'UpsellAgent'
    params: Optional[Dict[str, Any]] = {}
    status: Optional[str] = "pending"

# ✅ POST - Registra un nuovo evento IA
@router.post("/agent/trigger-event")
async def trigger_event(payload: EventPayload):
    try:
        event_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("events").document()
        event_data = {
            "trigger": payload.trigger,
            "next_agent": payload.next_agent,
            "params": payload.params or {},
            "status": payload.status or "pending",
            "createdAt": datetime.utcnow()
        }
        event_ref.set(event_data)
        return {"message": "✅ Evento IA creato con successo."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore creazione evento: {str(e)}")

# ✅ GET - Recupera eventi IA pendenti per utente
@router.get("/agent/pending-events/{user_id}")
async def get_pending_events(user_id: str):
    try:
        events_ref = db.collection("ai_agent_hub").document(user_id).collection("events")\
            .where("status", "==", "pending").order_by("createdAt", direction=firestore.Query.ASCENDING)
        events = [doc.to_dict() | {"event_id": doc.id} for doc in events_ref.stream()]
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore recupero eventi IA: {str(e)}")
