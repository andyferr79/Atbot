from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from uuid import uuid4
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
import httpx

router = APIRouter()

# ✅ Inizializza Firebase Admin se non già attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Modello della richiesta
class DispatchRequest(BaseModel):
    user_id: str
    intent: str  # es: "pricing", "checkin", "report"
    context: Dict

@router.post("/agent/dispatch")
async def dispatch_master_agent(request: DispatchRequest):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔹 Traccia l’azione nel Firestore
        doc_ref = db.collection("ai_agent_hub").document(request.user_id)
        actions_ref = doc_ref.collection("actions").document(action_id)

        actions_ref.set({
            "actionId": action_id,
            "type": request.intent,
            "status": "pending",
            "startedAt": now,
            "context": request.context,
            "output": {},
        })

        doc_ref.set({
            "userId": request.user_id,
            "lastActive": now,
            "lastCompletedAction": None,
            "pendingActions": firestore.ArrayUnion([action_id])
        }, merge=True)

                # 🔁 Dispatch dinamico
        async with httpx.AsyncClient() as client:
            print(f"📤 Dispatching intent: {request.intent}")
            print(f"📦 Payload inviato: {request.context}")  # 👈 DEBUG STAMPA

            if request.intent == "pricing":
                payload = {
                    "user_id": request.user_id,
                    **request.context
                }
                response = await client.post(
                    "http://127.0.0.1:8000/agent/pricing", json=payload
                )
            elif request.intent == "checkin":
                response = await client.post(
                    "http://127.0.0.1:8000/agent/checkin/send-welcome", json=request.context
                )
            elif request.intent == "report":
                response = await client.post(
                    "http://127.0.0.1:8000/agent/upload-report", json=request.context
                )
            else:
                raise HTTPException(status_code=400, detail="Intent non supportato")


        output = response.json()

        # ✅ Aggiorna l’azione come completata
        actions_ref.update({
            "status": "completed",
            "completedAt": datetime.utcnow(),
            "output": output
        })

        doc_ref.update({
            "lastCompletedAction": action_id,
            "pendingActions": firestore.ArrayRemove([action_id])
        })

        return {
            "message": f"✅ Azione '{request.intent}' completata",
            "output": output,
            "actionId": action_id
        }

    except Exception as e:
        actions_ref.update({
            "status": "error",
            "error": str(e),
            "completedAt": datetime.utcnow(),
        })
        raise HTTPException(status_code=500, detail=f"Errore dispatch: {str(e)}")
