from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from firebase_config import db  # ✅ Centralizzato
from firebase_admin import firestore

router = APIRouter()

@router.get("/agent/summary/{user_id}")
async def get_agent_summary(user_id: str):
    try:
        today = datetime.now(timezone.utc).date()

        # ✅ Azioni completate oggi
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions")
        actions_today = [
            doc.to_dict() for doc in actions_ref.where("status", "==", "completed").stream()
            if doc.to_dict().get("startedAt") and doc.to_dict()["startedAt"].date() == today
        ]

        # ✅ Documenti generati oggi
        documents_ref = db.collection("ai_agent_hub").document(user_id).collection("documents")
        documents_today = [
            doc.to_dict() for doc in documents_ref.stream()
            if doc.to_dict().get("generatedAt") and doc.to_dict()["generatedAt"].date() == today
        ]

        # ✅ Notifiche IA non lette
        notifications_ref = db.collection("notifications").where("userId", "==", user_id).where("read", "==", False)
        unread_notifications = [doc for doc in notifications_ref.stream()]

        # ✅ Ultimo modello IA usato
        last_model = None
        last_action_doc = next(actions_ref.order_by("startedAt", direction=firestore.Query.DESCENDING).limit(1).stream(), None)
        if last_action_doc:
            last_action = last_action_doc.to_dict()
            last_model = last_action.get("context", {}).get("model")

        return {
            "actions_completed_today": len(actions_today),
            "documents_generated_today": len(documents_today),
            "unread_notifications": len(unread_notifications),
            "last_model_used": last_model or "unknown"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore riepilogo IA: {str(e)}")
