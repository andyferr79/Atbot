from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import firebase_admin
from firebase_admin import credentials, firestore
import openai
import os

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
