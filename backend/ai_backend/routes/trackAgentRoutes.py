# 📁 trackAgentRoutes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from firebase_config import db  # Inizializzazione centralizzata

router = APIRouter()

# ✅ Modello dati
class TrackActionRequest(BaseModel):
    user_id: str
    type: str
    context: dict

# ✅ POST - Traccia azione IA generica
@router.post("/agent/track-action")
async def track_action(request: TrackActionRequest):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔥 Salva nel Firestore
        hub_ref = db.collection("ai_agent_hub").document(request.user_id)
        action_ref = hub_ref.collection("actions").document(action_id)

        action_ref.set({
            "actionId": action_id,
            "type": request.type,
            "status": "in_progress",
            "startedAt": now,
            "context": request.context
        })

        hub_ref.set({
            "lastActive": now,
            "lastTrackedAction": action_id
        }, merge=True)

        return {
            "message": "✅ Azione IA tracciata correttamente",
            "actionId": action_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore tracking azione: {str(e)}")
