from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from firebase_config import db  # ✅ Import centralizzato

router = APIRouter()

# ✅ Modelli
class CurrentGuest(BaseModel):
    name: Optional[str]
    language: Optional[str]
    tags: Optional[List[str]] = []

class ContextPayload(BaseModel):
    user_id: str
    occupancy_rate: Optional[int] = 0
    season: Optional[str] = "media"
    current_guest: Optional[CurrentGuest] = None
    pending_tasks: Optional[List[str]] = []
    last_action: Optional[str] = None
    ai_mode: Optional[str] = "assist"

# ✅ POST - Aggiorna il context IA per l’utente
@router.post("/agent/update-context")
async def update_context(payload: ContextPayload):
    try:
        context_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("context").document("state")

        context_data = {
            "occupancy_rate": payload.occupancy_rate,
            "season": payload.season,
            "pending_tasks": payload.pending_tasks,
            "last_action": payload.last_action,
            "ai_mode": payload.ai_mode,
            "updatedAt": datetime.utcnow()
        }

        if payload.current_guest:
            context_data["current_guest"] = payload.current_guest.dict()

        context_ref.set(context_data, merge=True)

        return {"message": "✅ Context aggiornato correttamente."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore aggiornamento context: {str(e)}")

# ✅ GET - Recupera context IA per l’utente
@router.get("/agent/get-context/{user_id}")
async def get_context(user_id: str):
    try:
        context_ref = db.collection("ai_agent_hub").document(user_id).collection("context").document("state")
        doc = context_ref.get()

        if not doc.exists:
            default_context = {
                "occupancy_rate": 0,
                "season": "media",
                "current_guest": {
                    "name": None,
                    "language": "it",
                    "tags": []
                },
                "pending_tasks": [],
                "last_action": None,
                "ai_mode": "assist",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            context_ref.set(default_context)
            return default_context

        return doc.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore lettura context: {str(e)}")
