from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import firebase_admin
from firebase_admin import credentials, firestore
import openai
import os
import httpx
from typing import Optional, List, Dict, Any
from utils.intentClassifier import classify_intent_from_message

router = APIRouter()

if not firebase_admin._apps:
    cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("⚠️ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)

# MODELLI
class ChatRequest(BaseModel):
    user_message: str
    session_id: str
    user_id: str

class StartSessionRequest(BaseModel):
    user_id: str
    title: str = "Nuova Chat"
    summary: str = ""
    status: str = "active"

class Attachment(BaseModel):
    type: str
    url: str

class SaveMessageRequest(BaseModel):
    session_id: str
    user_id: str
    text: str
    is_user: bool
    timestamp: str
    type: Optional[str] = "normal"
    status: Optional[str] = "completed"
    action_id: Optional[str] = None
    feedback: Optional[str] = None
    attachment: Optional[Attachment] = None

class UnderstandRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

# ENDPOINT PRINCIPALI

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        if not request.user_message.strip():
            raise HTTPException(status_code=400, detail="❌ Messaggio vuoto.")

        from routes.dispatchRoutes import dispatch_master_agent, DispatchRequest
        intent = await classify_intent_from_message(request.user_message, request.user_id)

        # 🔍 Tracciamento intent
        db.collection("intent_history").document(request.user_id).collection("logs").add({
            "message": request.user_message,
            "intent": intent,
            "timestamp": datetime.utcnow()
        })

        now = datetime.utcnow()
        session_ref = db.collection("chat_sessions").document(request.session_id)
        messages_ref = session_ref.collection("messages")

        # ❌ Intent non chiaro
        if intent == "unknown":
            response = "❌ Non ho capito bene cosa intendi. Puoi riformularlo?"
            messages_ref.add({"isUser": True, "text": request.user_message, "timestamp": now})
            messages_ref.add({"isUser": False, "text": response, "timestamp": now})
            session_ref.set({"userId": request.user_id, "lastUpdated": now}, merge=True)
            return {"response": response}

        # ✅ Se è un intent automatico → dispatch diretto
        if intent in NO_CONFIRM_REQUIRED:
            dispatch_payload = DispatchRequest(
                user_id=request.user_id,
                intent=intent,
                context={
                    "session_id": request.session_id,
                    "auto_triggered_by": "user_message",
                    "original_message": request.user_message
                }
            )
            try:
                result = await dispatch_master_agent(dispatch_payload)
                ai_reply = f"✅ Azione '{intent}' eseguita automaticamente."
                messages_ref.add({"isUser": True, "text": request.user_message, "timestamp": now})
                messages_ref.add({"isUser": False, "text": ai_reply, "timestamp": now})
                session_ref.set({"userId": request.user_id, "lastUpdated": now}, merge=True)
                return {"response": ai_reply, "result": result}
            except Exception as err:
                error_text = f"⚠️ Errore durante l’esecuzione dell’agente '{intent}': {str(err)}"
                messages_ref.add({"isUser": True, "text": request.user_message, "timestamp": now})
                messages_ref.add({"isUser": False, "text": error_text, "timestamp": now})
                return {"response": error_text}

        # 🔄 Se serve conferma → salva proposta e pending
        pending_id = f"{intent}-{uuid4().hex[:8]}"
        suggestion_text = f"Vuoi che attivo l’azione IA: **{intent}**?"
        pending_data = {
            "intent": intent,
            "context": {
                "session_id": request.session_id,
                "auto_triggered_by": "user_message",
                "original_message": request.user_message
            },
            "status": "waiting",
            "suggestion_text": suggestion_text,
            "createdAt": now
        }

        db.collection("ai_agent_hub").document(request.user_id).collection("pending_actions").document(pending_id).set(pending_data)
        messages_ref.add({"isUser": True, "text": request.user_message, "timestamp": now})
        messages_ref.add({
            "text": suggestion_text,
            "isUser": False,
            "type": "proposal",
            "status": "pending",
            "timestamp": now,
            "action_id": pending_id
        })
        session_ref.set({"userId": request.user_id, "lastUpdated": now}, merge=True)

        return {"intent": intent, "pending_action_id": pending_id, "response": suggestion_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore IA: {str(e)}")

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
        return {"sessionId": session_id, "createdAt": now, "status": request.status, "message": "✅ Sessione creata con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore creazione sessione: {str(e)}")
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

@router.delete("/chat_sessions/{session_id}")
async def delete_chat_session(session_id: str = Path(...)):
    try:
        session_ref = db.collection("chat_sessions").document(session_id)
        if not session_ref.get().exists:
            raise HTTPException(status_code=404, detail="Sessione non trovata")
        for msg in session_ref.collection("messages").stream():
            msg.reference.delete()
        session_ref.delete()
        return {"message": "🗑️ Sessione eliminata con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore eliminazione: {str(e)}")
@router.get("/chat_sessions/{session_id}/actions")
async def get_chat_session_actions(session_id: str = Path(...)):
    try:
        query = db.collection_group("actions").where("context.session_id", "==", session_id)
        return [doc.to_dict() for doc in query.stream()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero azioni: {str(e)}")

@router.get("/chat_sessions/{user_id}")
async def get_chat_sessions_by_user(user_id: str):
    try:
        sessions_ref = db.collection("chat_sessions") \
            .where("userId", "==", user_id) \
            .order_by("lastUpdated", direction=firestore.Query.DESCENDING)
        return [doc.to_dict() | {"sessionId": doc.id} for doc in sessions_ref.stream()]
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
            cursor_ts = datetime.fromisoformat(start_after.replace("Z", "+00:00"))
            query = query.start_after({"timestamp": cursor_ts})

        query = query.limit(limit)
        exclude_types = ["loader", "debug"]
        messages, last_ts = [], None

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
@router.post("/chat/saveMessage")
async def save_message(request: SaveMessageRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="❌ Messaggio vuoto.")

        ts = datetime.fromisoformat(request.timestamp.replace("Z", "+00:00"))
        messages_ref = db.collection("chat_sessions").document(request.session_id).collection("messages")

        last_query = messages_ref.where("isUser", "==", request.is_user) \
                                 .order_by("timestamp", direction=firestore.Query.DESCENDING) \
                                 .limit(1).stream()
        last_msg = next(last_query, None)
        if last_msg and last_msg.to_dict().get("text", "").strip() == request.text.strip():
            raise HTTPException(status_code=409, detail="❌ Messaggio duplicato.")

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
NO_CONFIRM_REQUIRED = {"report", "security", "alert", "insight", "event"}

@router.post("/chat/understand")
async def understand_and_propose(request: UnderstandRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="❌ Messaggio vuoto.")

        # 🎯 Classificazione intent
        intent = await classify_intent_from_message(request.message, request.user_id)

        # 📥 Tracciamento intent
        db.collection("intent_history").document(request.user_id).collection("logs").add({
            "message": request.message,
            "intent": intent,
            "timestamp": datetime.utcnow()
        })

        if intent == "unknown":
            return {"response": "❌ Non ho capito bene cosa intendi. Puoi riformularlo?"}

        if intent in NO_CONFIRM_REQUIRED:
            from routes.dispatchRoutes import dispatch_master_agent, DispatchRequest
            dispatch_payload = DispatchRequest(
                user_id=request.user_id,
                intent=intent,
                context={
                    "session_id": request.session_id,
                    "auto_triggered_by": "user_message",
                    "original_message": request.message
                }
            )
            try:
                result = await dispatch_master_agent(dispatch_payload)
                return {"response": f"✅ Azione '{intent}' eseguita automaticamente", "result": result}
            except Exception as dispatch_error:
                return {"response": f"⚠️ Errore durante l’esecuzione dell’agente '{intent}'", "error": str(dispatch_error)}

        # 🔄 Proposta in attesa conferma
        pending_id = f"{intent}-{uuid4().hex[:8]}"
        now = datetime.utcnow()
        suggestion_text = f"Vuoi che attivo l’azione IA: **{intent}**?"

        pending_data = {
            "intent": intent,
            "context": {
                "session_id": request.session_id,
                "auto_triggered_by": "user_message",
                "original_message": request.message
            },
            "status": "waiting",
            "suggestion_text": suggestion_text,
            "createdAt": now
        }

        db.collection("ai_agent_hub").document(request.user_id).collection("pending_actions").document(pending_id).set(pending_data)
        db.collection("chat_sessions").document(request.session_id).collection("messages").add({
            "text": suggestion_text,
            "isUser": False,
            "type": "proposal",
            "status": "pending",
            "timestamp": now,
            "action_id": pending_id
        })

        return {"intent": intent, "pending_action_id": pending_id, "response": suggestion_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore comprendendo l’intento: {str(e)}")
@router.post("/agent/accept-action/{user_id}/{pending_id}")
async def accept_action(user_id: str, pending_id: str):
    try:
        now = datetime.utcnow()
        pending_ref = db.collection("ai_agent_hub").document(user_id).collection("pending_actions").document(pending_id)
        pending_doc = pending_ref.get()

        if not pending_doc.exists:
            raise HTTPException(status_code=404, detail="❌ Azione non trovata")

        pending_data = pending_doc.to_dict()
        if pending_data.get("status") != "waiting":
            raise HTTPException(status_code=400, detail="⚠️ Azione già gestita")

        pending_ref.update({"status": "accepted", "handledAt": now})

        session_id = pending_data["context"]["session_id"]
        messages_ref = db.collection("chat_sessions").document(session_id).collection("messages")
        query = messages_ref.where("action_id", "==", pending_id).limit(1).stream()
        for msg in query:
            msg.reference.update({"status": "accepted"})

        from routes.dispatchRoutes import dispatch_master_agent, DispatchRequest
        dispatch_payload = DispatchRequest(
            user_id=user_id,
            intent=pending_data["intent"],
            context=pending_data["context"]
        )
        result = await dispatch_master_agent(dispatch_payload)
        return {
            "message": "✅ Azione accettata ed eseguita.",
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore accettazione azione: {str(e)}")

@router.post("/agent/reject-action/{user_id}/{pending_id}")
async def reject_action(user_id: str, pending_id: str):
    try:
        now = datetime.utcnow()
        pending_ref = db.collection("ai_agent_hub").document(user_id).collection("pending_actions").document(pending_id)
        pending_doc = pending_ref.get()

        if not pending_doc.exists:
            raise HTTPException(status_code=404, detail="❌ Azione non trovata")

        pending_data = pending_doc.to_dict()
        if pending_data.get("status") != "waiting":
            raise HTTPException(status_code=400, detail="⚠️ Azione già gestita")

        pending_ref.update({"status": "rejected", "handledAt": now})

        session_id = pending_data["context"]["session_id"]
        messages_ref = db.collection("chat_sessions").document(session_id).collection("messages")
        query = messages_ref.where("action_id", "==", pending_id).limit(1).stream()
        for msg in query:
            msg.reference.update({"status": "rejected"})

        return {"message": "❌ Azione rifiutata con successo."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore rifiuto azione: {str(e)}")

@router.post("/agent/process-events/{user_id}")
async def process_pending_events(user_id: str):
    try:
        processed = []
        now = datetime.utcnow()

        events_ref = db.collection("ai_agent_hub").document(user_id).collection("events") \
            .where("status", "==", "pending") \
            .order_by("createdAt", direction=firestore.Query.ASCENDING)
        pending_events = events_ref.stream()

        for event_doc in pending_events:
            data = event_doc.to_dict()
            event_id = event_doc.id
            intent = data.get("next_agent")
            context = data.get("params", {})
            context["trigger"] = data.get("trigger")

            try:
                dispatch_response = await dispatch_agent(user_id, intent, context)
                status = "done"
            except Exception as err:
                dispatch_response = {"error": str(err)}
                status = "error"

            db.collection("ai_agent_hub").document(user_id).collection("events").document(event_id).update({
                "status": status,
                "executedAt": now,
                "result": dispatch_response
            })

            processed.append({"event_id": event_id, "status": status})

        return {"processed": processed}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore elaborazione eventi: {str(e)}")
# ✅ Utility per chiamare il dispatcher centralizzato
async def dispatch_agent(user_id: str, intent: str, context: dict):
    url = "http://127.0.0.1:8000/agent/dispatch"
    payload = {
        "user_id": user_id,
        "intent": intent,
        "context": context
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        return response.json()
