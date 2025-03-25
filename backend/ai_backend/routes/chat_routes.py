from fastapi import APIRouter, HTTPException
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

        # 🔥 Salvataggio messaggi in sottocollezione /chat_sessions/{sessionId}/messages
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

        # 🔁 Aggiorna la sessione
        session_ref.set({
            "userId": request.user_id,
            "lastUpdated": now
        }, merge=True)

        return {"response": ai_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore IA: {str(e)}")

# ✅ Endpoint per creare nuova sessione chat
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
