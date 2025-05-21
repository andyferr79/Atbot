from fastapi import APIRouter, HTTPException
from firebase_config import db  # ✅ Inizializzazione centralizzata

router = APIRouter()

# ✅ Recupera configurazione agente (autonomia, automazioni, piano)
@router.get("/agent/config/{user_id}")
async def get_agent_config(user_id: str):
    try:
        doc_ref = db.collection("ai_agent_hub").document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            return {
                "autonomyLevel": "base",
                "enabledAutomations": {},
                "plan": "BASE"
            }
        data = doc.to_dict()
        return {
            "autonomyLevel": data.get("autonomyLevel", "base"),
            "enabledAutomations": data.get("enabledAutomations", {}),
            "plan": data.get("plan", "BASE")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero config: {str(e)}")
