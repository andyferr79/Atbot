from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from typing import Optional
import firebase_admin
from firebase_admin import firestore

router = APIRouter()

# ✅ Inizializza Firebase se non attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Modelli
class AgentActionRequest(BaseModel):
    user_id: str
    type: str  # es: "report", "pricing", "email", "automation"
    context: dict

class AgentActionUpdate(BaseModel):
    status: Optional[str] = None
    output: Optional[dict] = None

class UploadReportRequest(BaseModel):
    user_id: str
    title: str
    content: str
    tags: Optional[list] = []

class CheckInMessageRequest(BaseModel):
    user_id: str
    booking_id: str
    guest_name: str
    email: str
    phone: Optional[str] = None
    checkin_date: str
    services_included: list
    services_extra: Optional[list] = []

# ✅ TRACK - Tracciamento nuova azione
@router.post("/agent/track-action")
async def track_agent_action(request: AgentActionRequest):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        doc_ref = db.collection("ai_agent_hub").document(request.user_id)
        actions_ref = doc_ref.collection("actions").document(action_id)

        actions_ref.set({
            "actionId": action_id,
            "type": request.type,
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

        return {"message": "✅ Azione IA tracciata", "actionId": action_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore tracciamento azione: {str(e)}")

# 🔄 GET - Recupera tutte le azioni per un utente
@router.get("/agent/actions/{user_id}")
async def get_user_actions(user_id: str):
    try:
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions")
        docs = actions_ref.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero azioni: {str(e)}")

# 🔄 PATCH - Aggiorna una singola azione
@router.patch("/agent/actions/{user_id}/{action_id}")
async def update_agent_action(user_id: str, action_id: str, update: AgentActionUpdate):
    try:
        ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        updates = {}
        if update.status:
            updates["status"] = update.status
            if update.status == "completed":
                db.collection("ai_agent_hub").document(user_id).update({
                    "lastCompletedAction": action_id,
                    "pendingActions": firestore.ArrayRemove([action_id])
                })
        if update.output:
            updates["output"] = update.output
        ref.update(updates)
        return {"message": "✅ Azione aggiornata"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore aggiornamento azione: {str(e)}")

# 🔄 POST - Salva un documento generato dall’agente
@router.post("/agent/upload-report")
async def upload_agent_report(request: UploadReportRequest):
    try:
        now = datetime.utcnow()
        report_id = str(uuid4())
        db.collection("ai_agent_hub").document(request.user_id).collection("documents").document(report_id).set({
            "reportId": report_id,
            "title": request.title,
            "content": request.content,
            "tags": request.tags,
            "createdAt": now
        })
        return {"message": "✅ Documento salvato", "reportId": report_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore salvataggio documento: {str(e)}")

# 🔄 GET - Recupera stato HUB IA
@router.get("/agent/hub-status/{user_id}")
async def get_agent_hub_status(user_id: str):
    try:
        doc = db.collection("ai_agent_hub").document(user_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Utente non trovato")
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero stato HUB: {str(e)}")

# 🔄 DELETE - Elimina una azione IA
@router.delete("/agent/actions/{user_id}/{action_id}")
async def delete_agent_action(user_id: str, action_id: str):
    try:
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).delete()
        return {"message": "✅ Azione eliminata"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore eliminazione azione: {str(e)}")

# ✅ POST - Invio messaggio di benvenuto check-in
@router.post("/agent/checkin/send-welcome")
async def send_checkin_welcome(request: CheckInMessageRequest):
    try:
        now = datetime.utcnow()
        message = f"""
Ciao {request.guest_name},

Benvenuto nella nostra struttura! 🎉
Ecco i dettagli della tua prenotazione:
- Check-in previsto: {request.checkin_date}
- Servizi inclusi: {', '.join(request.services_included)}
"""
        if request.services_extra:
            message += f"- Servizi extra disponibili: {', '.join(request.services_extra)}\n"

        message += "\n📩 Riceverai un'email o un messaggio WhatsApp con tutte le istruzioni utili.\nGrazie per aver scelto la nostra struttura!"

        action_id = str(uuid4())
        action_ref = db.collection("ai_agent_hub").document(request.user_id).collection("actions").document(action_id)
        action_ref.set({
            "actionId": action_id,
            "type": "checkin_welcome",
            "status": "completed",
            "startedAt": now,
            "context": {
                "bookingId": request.booking_id,
                "guestName": request.guest_name,
                "checkinDate": request.checkin_date,
                "servicesIncluded": request.services_included,
                "servicesExtra": request.services_extra
            },
            "output": {
                "message": message,
                "deliveredVia": "simulated"
            }
        })

        return {"message": "✅ Messaggio di benvenuto generato e salvato", "preview": message}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore invio messaggio di benvenuto: {str(e)}")
