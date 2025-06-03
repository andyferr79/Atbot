from fastapi import APIRouter, HTTPException, Path
from firebase_config import db
from firebase_admin import firestore

router = APIRouter()

# ✅ Recupera tutte le azioni IA per un utente
@router.get("/agent/actions/{user_id}")
async def get_agent_actions(user_id: str):
    try:
        actions_ref = (
            db.collection("ai_agent_hub")
            .document(user_id)
            .collection("actions")
            .order_by("startedAt", direction=firestore.Query.DESCENDING)
        )
        actions = [doc.to_dict() | {"id": doc.id} for doc in actions_ref.stream()]
        return actions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero azioni IA: {str(e)}")

# ✅ PATCH - Aggiorna stato/output di un'azione esistente
@router.patch("/agent/actions/{user_id}/{action_id}")
async def update_action(user_id: str = Path(...), action_id: str = Path(...), payload: dict = None):
    try:
        if not payload:
            raise HTTPException(status_code=400, detail="❌ Payload mancante.")
        doc_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        doc_ref.update(payload)
        return {"message": "✅ Azione aggiornata con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore aggiornamento azione: {str(e)}")
