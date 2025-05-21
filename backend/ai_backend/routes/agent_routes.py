from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from typing import Optional, List
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

# 🔄 DELETE - Elimina una azione IA
@router.delete("/agent/actions/{user_id}/{action_id}")
async def delete_agent_action(user_id: str, action_id: str):
    try:
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).delete()
        return {"message": "✅ Azione eliminata"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore eliminazione azione: {str(e)}")

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

# 🔄 GET - Recupera documenti generati IA
@router.get("/agent/documents/{user_id}")
async def get_generated_documents(user_id: str):
    try:
        docs_ref = db.collection("ai_agent_hub").document(user_id).collection("documents")
        docs = docs_ref.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero documenti: {str(e)}")

# 🔄 GET - Recupera configurazione agente (autonomia, automazioni, piano)
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

# ✅ POST - Upload report da contesto IA (usato da agent/chat)
@router.post("/agent/upload-report")
async def generate_report_from_chat(context: dict):
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

# ✅ MODELLO PROFILO STRUTTURA
class Geo(BaseModel):
    lat: float
    lng: float

class StructureProfile(BaseModel):
    user_id: str
    name: str
    structureType: str
    style: Optional[str]
    description: Optional[str]
    address: str
    city: str
    country: str
    geo: Optional[Geo]
    checkin: Optional[str]
    checkout: Optional[str]
    rules: Optional[List[str]]
    services: Optional[List[str]]
    extraServices: Optional[List[str]]
    animalsAllowed: Optional[bool]
    languages: Optional[List[str]]
    maxGuests: Optional[int]
    rooms: Optional[int]
    preferredContact: Optional[str]
    phoneNumber: Optional[str]
    conventions: Optional[List[str]]
    transports: Optional[List[str]]
    shuttleService: Optional[bool]
    accessibility: Optional[str]
    notes: Optional[str]

# ✅ POST - Salva profilo struttura
@router.post("/agent/profile")
async def save_structure_profile(profile: StructureProfile):
    try:
        doc_ref = db.collection("ai_agent_hub").document(profile.user_id).collection("properties").document("main")
        doc_ref.set(profile.dict(exclude={"user_id"}), merge=True)
        return {"message": "✅ Profilo struttura salvato correttamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore salvataggio profilo: {str(e)}")

# ✅ GET - Recupera profilo struttura
@router.get("/agent/profile/{user_id}")
async def get_structure_profile(user_id: str):
    try:
        doc_ref = db.collection("ai_agent_hub").document(user_id).collection("properties").document("main")
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Profilo struttura non trovato")
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero profilo: {str(e)}")