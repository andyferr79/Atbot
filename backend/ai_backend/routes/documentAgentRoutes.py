from fastapi import APIRouter, HTTPException
from firebase_config import db  # ✅ Inizializzazione centralizzata

router = APIRouter()

# ✅ GET - Recupera documenti generati IA
@router.get("/agent/documents/{user_id}")
async def get_generated_documents(user_id: str):
    try:
        docs_ref = db.collection("ai_agent_hub").document(user_id).collection("documents")
        docs = docs_ref.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero documenti: {str(e)}")
