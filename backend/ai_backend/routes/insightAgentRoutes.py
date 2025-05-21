from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from firebase_config import db  # ✅ Centralizzazione Firebase
from firebase_admin import firestore

router = APIRouter()

# ✅ Modello per insight
class InsightPayload(BaseModel):
    user_id: str
    source_agent: str
    target: Optional[str] = None
    comment: str
    severity: Optional[str] = "low"  # low, medium, high

# ✅ POST - Registra un nuovo insight da un agente
@router.post("/agent/submit-insight")
async def submit_insight(payload: InsightPayload):
    try:
        insight_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("insights_from_agents").document()
        insight_data = {
            "source_agent": payload.source_agent,
            "target": payload.target,
            "comment": payload.comment,
            "severity": payload.severity,
            "timestamp": datetime.utcnow()
        }
        insight_ref.set(insight_data)
        return {"message": "✅ Insight registrato con successo."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore registrazione insight: {str(e)}")

# ✅ GET - Recupera tutti gli insight per un utente
@router.get("/agent/insights-log/{user_id}")
async def get_insights(user_id: str):
    try:
        insights_ref = db.collection("ai_agent_hub").document(user_id).collection("insights_from_agents")\
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
        insights = [doc.to_dict() | {"id": doc.id} for doc in insights_ref.stream()]
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore recupero insights: {str(e)}")
