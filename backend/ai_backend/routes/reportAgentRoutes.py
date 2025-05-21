from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime
from typing import Dict
from firebase_config import db  # ✅ Centralizzato

router = APIRouter()

# ✅ POST - Genera e salva un report da contesto IA
@router.post("/agent/upload-report")
async def generate_report_from_chat(context: Dict):
    try:
        user_id = context.get("user_id", "unknown")
        session_id = context.get("session_id", "unknown")

        report_content = f"📊 Report generato per l’utente {user_id} – Sessione: {session_id}"
        timestamp = datetime.utcnow()
        doc_id = str(uuid4())

        doc_ref = db.collection("ai_agent_hub").document(user_id).collection("documents").document(doc_id)
        doc_ref.set({
            "documentId": doc_id,
            "type": "report",
            "content": report_content,
            "generatedAt": timestamp,
            "linkedSession": session_id,
        })

        return {
            "status": "completed",
            "message": "📎 Report generato con successo!",
            "documentId": doc_id,
            "content": report_content,
            "generatedAt": timestamp.isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
