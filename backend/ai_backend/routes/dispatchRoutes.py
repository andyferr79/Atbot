# ✅ FILE: E:/ATBot/backend/ai_backend/routes/dispatchRoutes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from uuid import uuid4
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
import importlib
import httpx

router = APIRouter()

# ✅ Inizializza Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Dispatcher Map corretta (usa cartella 'dispatchers')
DISPATCHER_MAP = {
    "pricing": "dispatchers.pricingDispatcher",
    "checkin": "dispatchers.checkinDispatcher",
    "report": "dispatchers.reportDispatcher",
    "cleaning": "dispatchers.cleaningDispatcher",
    "context": "dispatchers.contextDispatcher",
    "faq": "dispatchers.faqDispatcher",
    "upsell": "dispatchers.upsellDispatcher",
    "security": "dispatchers.securityDispatcher",
    "alert": "dispatchers.alertDispatcher",
    "event": "dispatchers.eventDispatcher",
    "feedback": "dispatchers.feedbackDispatcher",
    "insight": "dispatchers.insightDispatcher",
    "conversion": "dispatchers.conversionDispatcher",
    "revenue": "dispatchers.revenueDispatcher",
    "bookingfix": "dispatchers.bookingFixDispatcher",
    "autopilot": "dispatchers.autopilotDispatcher",
    "crm": "dispatchers.crmDispatcher",
    "marketing": "dispatchers.marketingDispatcher",
    "support": "dispatchers.supportDispatcher",
    "followup": "dispatchers.followupDispatcher"
}

# ✅ Modello della richiesta
class DispatchRequest(BaseModel):
    user_id: str
    intent: str
    context: Dict

# ✅ Endpoint master dispatcher
@router.post("/agent/dispatch")
async def dispatch_master_agent(request: DispatchRequest):
    now = datetime.utcnow()
    action_id = str(uuid4())
    doc_ref = db.collection("ai_agent_hub").document(request.user_id)
    actions_ref = doc_ref.collection("actions").document(action_id)

    try:
        # 🔹 Traccia l’azione inizialmente
        actions_ref.set({
            "actionId": action_id,
            "type": request.intent,
            "status": "pending",
            "startedAt": now,
            "context": request.context,
            "output": {}
        })

        doc_ref.set({
            "userId": request.user_id,
            "lastActive": now,
            "lastCompletedAction": None,
            "pendingActions": firestore.ArrayUnion([action_id])
        }, merge=True)

        # 🔁 Import dinamico del dispatcher corrispondente
        if request.intent not in DISPATCHER_MAP:
            raise HTTPException(status_code=400, detail=f"Intent non supportato: {request.intent}")

        module_path = DISPATCHER_MAP[request.intent]
        dispatcher = importlib.import_module(module_path)

        # 🚀 Esegui la logica dell’agente specifico
        output = await dispatcher.handle(request.user_id, request.context)

        # ✅ Aggiorna come completata
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
        # ❌ In caso di errore, aggiorna stato a 'error'
        actions_ref.update({
            "status": "error",
            "error": str(e),
            "completedAt": datetime.utcnow()
        })
        raise HTTPException(status_code=500, detail=f"Errore dispatch: {str(e)}")
