from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from firebase_config import db  # ✅ Centralizzato

router = APIRouter()

# ✅ Modello feedback
class FeedbackPayload(BaseModel):
    user_id: str
    action_id: str
    rating: str  # 'up' | 'down'
    comment: Optional[str] = None

# ✅ POST - Registra feedback su azione IA
@router.post("/agent/feedback")
async def submit_feedback(payload: FeedbackPayload):
    try:
        feedback_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("feedback").document(payload.action_id)
        feedback_ref.set({
            "actionId": payload.action_id,
            "rating": payload.rating,
            "comment": payload.comment,
            "timestamp": datetime.utcnow()
        })
        return {"message": "✅ Feedback registrato"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore feedback: {str(e)}")
