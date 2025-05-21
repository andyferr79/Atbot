from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import firebase_admin
from firebase_admin import credentials, firestore
import openai
import os
from fastapi import Query  # serve per leggere parametri da URL
from typing import Optional, List, Dict, Any



router = APIRouter()

# ✅ Inizializza Firebase se non attivo
if not firebase_admin._apps:
    cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("⚠️ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Modello richiesta messaggio
class ChatRequest(BaseModel):
    user_message: str
    session_id: str
    user_id: str

# ✅ Modello richiesta nuova sessione
class StartSessionRequest(BaseModel):
    user_id: str
    title: str = "Nuova Chat"
    summary: str = ""
    status: str = "active"

# ✅ Endpoint per inviare messaggio alla chat IA
@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        model = "gpt-4" if "analisi avanzata" in request.user_message.lower() else "gpt-3.5-turbo"
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": request.user_message}],
            temperature=0.7
        )
        ai_reply = response.choices[0].message.content
        now = datetime.utcnow()

        session_ref = db.collection("chat_sessions").document(request.session_id)
        messages_ref = session_ref.collection("messages")

        messages_ref.add({
            "isUser": True,
            "text": request.user_message,
            "timestamp": now
        })
        messages_ref.add({
            "isUser": False,
            "text": ai_reply,
            "timestamp": now
        })

        session_ref.set({
            "userId": request.user_id,
            "lastUpdated": now
        }, merge=True)

        return {"response": ai_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore IA: {str(e)}")

# ✅ Crea nuova sessione chat
@router.post("/chat/start-session")
async def start_chat_session(request: StartSessionRequest):
    try:
        session_id = f"session-{request.user_id}-{int(datetime.utcnow().timestamp())}-{uuid4().hex[:6]}"
        now = datetime.utcnow()

        db.collection("chat_sessions").document(session_id).set({
            "userId": request.user_id,
            "title": request.title,
            "summary": request.summary,
            "status": request.status,
            "createdAt": now,
            "lastUpdated": now
        })

        return {
            "sessionId": session_id,
            "createdAt": now,
            "status": request.status,
            "message": "✅ Sessione creata con successo"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore creazione sessione: {str(e)}")

# ✅ Archivia una chat session
@router.post("/chat_sessions/{session_id}/archive")
async def archive_chat_session(session_id: str = Path(...)):
    try:
        session_ref = db.collection("chat_sessions").document(session_id)
        if not session_ref.get().exists:
            raise HTTPException(status_code=404, detail="Sessione non trovata")
        session_ref.update({"status": "archived"})
        return {"message": "✅ Sessione archiviata con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore archiviazione: {str(e)}")

# ✅ Elimina una chat session + messaggi
@router.delete("/chat_sessions/{session_id}")
async def delete_chat_session(session_id: str = Path(...)):
    try:
        session_ref = db.collection("chat_sessions").document(session_id)
        if not session_ref.get().exists:
            raise HTTPException(status_code=404, detail="Sessione non trovata")

        messages = session_ref.collection("messages").stream()
        for msg in messages:
            msg.reference.delete()

        session_ref.delete()
        return {"message": "🗑️ Sessione eliminata con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore eliminazione: {str(e)}")

# ✅ Recupera tutte le azioni associate a una chat session
@router.get("/chat_sessions/{session_id}/actions")
async def get_chat_session_actions(session_id: str = Path(...)):
    try:
        query = db.collection_group("actions").where("context.session_id", "==", session_id)
        actions = [doc.to_dict() for doc in query.stream()]
        return actions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero azioni per sessione: {str(e)}")

# ✅ Recupera tutte le chat di un utente
@router.get("/chat_sessions/{user_id}")
async def get_chat_sessions_by_user(user_id: str):
    try:
        sessions_ref = db.collection("chat_sessions").where("userId", "==", user_id).order_by("lastUpdated", direction=firestore.Query.DESCENDING)
        sessions = [doc.to_dict() | {"sessionId": doc.id} for doc in sessions_ref.stream()]
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero chat: {str(e)}")

@router.get("/chat/loadMessages/{session_id}")
async def load_chat_messages(
    session_id: str,
    limit: Optional[int] = 50,
    start_after: Optional[str] = None,
    include_system: Optional[bool] = False
):
    try:
        messages_ref = db.collection("chat_sessions").document(session_id).collection("messages")
        query = messages_ref.order_by("timestamp")

        if start_after:
            from datetime import datetime
            cursor_ts = datetime.fromisoformat(start_after.replace("Z", "+00:00"))
            query = query.start_after({"timestamp": cursor_ts})

        query = query.limit(limit)
        exclude_types = ["loader", "debug"]
        messages = []
        last_ts = None

        for doc in query.stream():
            msg = doc.to_dict()
            if not include_system and msg.get("type") in exclude_types + ["system"]:
                continue
            messages.append({
                "messageId": doc.id,
                "text": msg.get("text"),
                "isUser": msg.get("isUser"),
                "timestamp": msg.get("timestamp").isoformat() if "timestamp" in msg else None,
                "type": msg.get("type", "normal"),
                "status": msg.get("status", "completed"),
                "action_id": msg.get("action_id"),
                "feedback": msg.get("feedback"),
                "attachment": msg.get("attachment")
            })
            last_ts = msg.get("timestamp")

        return {
            "session_id": session_id,
            "messages": messages,
            "next_cursor": last_ts.isoformat() if last_ts else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore caricamento messaggi: {str(e)}")
    
class Attachment(BaseModel):
    type: str  # es: 'pdf', 'image', 'link'
    url: str

class SaveMessageRequest(BaseModel):
    session_id: str
    user_id: str
    text: str
    is_user: bool
    timestamp: str  # ISO string
    type: Optional[str] = "normal"
    status: Optional[str] = "completed"
    action_id: Optional[str] = None
    feedback: Optional[str] = None
    attachment: Optional[Attachment] = None

@router.post("/chat/saveMessage")
async def save_message(request: SaveMessageRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="❌ Messaggio vuoto.")

        ts = datetime.fromisoformat(request.timestamp.replace("Z", "+00:00"))

        # Prevenzione duplicati (stesso autore, stesso testo)
        messages_ref = db.collection("chat_sessions").document(request.session_id).collection("messages")
        last_query = messages_ref.where("isUser", "==", request.is_user)\
                                 .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                                 .limit(1).stream()
        last_msg = next(last_query, None)
        if last_msg:
            last_data = last_msg.to_dict()
            if last_data.get("text", "").strip() == request.text.strip():
                raise HTTPException(status_code=409, detail="❌ Messaggio duplicato.")

        # Salvataggio messaggio
        msg_data = {
            "text": request.text.strip(),
            "isUser": request.is_user,
            "timestamp": ts,
            "type": request.type or "normal",
            "status": request.status or "completed",
            "feedback": request.feedback,
        }

        if request.action_id:
            msg_data["action_id"] = request.action_id
        if request.attachment:
            msg_data["attachment"] = request.attachment.dict()

        messages_ref.document().set(msg_data)

        return {"message": "✅ Messaggio salvato correttamente."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore salvataggio messaggio: {str(e)}")  
    
class CurrentGuest(BaseModel):
    name: Optional[str]
    language: Optional[str]
    tags: Optional[List[str]] = []

class ContextPayload(BaseModel):
    user_id: str
    occupancy_rate: Optional[int] = 0
    season: Optional[str] = "media"
    current_guest: Optional[CurrentGuest] = None
    pending_tasks: Optional[List[str]] = []
    last_action: Optional[str] = None
    ai_mode: Optional[str] = "assist"
@router.post("/agent/update-context")
async def update_context(payload: ContextPayload):
    try:
        context_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("context").document("state")

        context_data = {
            "occupancy_rate": payload.occupancy_rate,
            "season": payload.season,
            "pending_tasks": payload.pending_tasks,
            "last_action": payload.last_action,
            "ai_mode": payload.ai_mode,
            "updatedAt": datetime.utcnow()
        }

        if payload.current_guest:
            context_data["current_guest"] = payload.current_guest.dict()

        context_ref.set(context_data, merge=True)

        return {"message": "✅ Context aggiornato correttamente."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore aggiornamento context: {str(e)}")
@router.get("/agent/get-context/{user_id}")
async def get_context(user_id: str):
    try:
        context_ref = db.collection("ai_agent_hub").document(user_id).collection("context").document("state")
        doc = context_ref.get()

        if not doc.exists:
            default_context = {
                "occupancy_rate": 0,
                "season": "media",
                "current_guest": {
                    "name": None,
                    "language": "it",
                    "tags": []
                },
                "pending_tasks": [],
                "last_action": None,
                "ai_mode": "assist",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            context_ref.set(default_context)
            return default_context

        return doc.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore lettura context: {str(e)}")
class EventPayload(BaseModel):
    user_id: str
    trigger: str  # es. 'checkin_completed'
    next_agent: str  # es. 'UpsellAgent'
    params: Optional[Dict[str, Any]] = {}
    status: Optional[str] = "pending"

@router.post("/agent/trigger-event")
async def trigger_event(payload: EventPayload):
    try:
        event_ref = db.collection("ai_agent_hub").document(payload.user_id).collection("events").document()
        event_data = {
            "trigger": payload.trigger,
            "next_agent": payload.next_agent,
            "params": payload.params or {},
            "status": payload.status or "pending",
            "createdAt": datetime.utcnow()
        }
        event_ref.set(event_data)
        return {"message": "✅ Evento IA creato con successo."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore creazione evento: {str(e)}")
@router.get("/agent/pending-events/{user_id}")
async def get_pending_events(user_id: str):
    try:
        events_ref = db.collection("ai_agent_hub").document(user_id).collection("events")\
            .where("status", "==", "pending").order_by("createdAt", direction=firestore.Query.ASCENDING)
        events = [doc.to_dict() | {"event_id": doc.id} for doc in events_ref.stream()]
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore recupero eventi IA: {str(e)}")
class InsightPayload(BaseModel):
    user_id: str
    source_agent: str
    target: Optional[str] = None
    comment: str
    severity: Optional[str] = "low"  # low, medium, high

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
@router.get("/agent/insights-log/{user_id}")
async def get_insights(user_id: str):
    try:
        insights_ref = db.collection("ai_agent_hub").document(user_id).collection("insights_from_agents")\
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
        insights = [doc.to_dict() | {"id": doc.id} for doc in insights_ref.stream()]
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore recupero insights: {str(e)}")