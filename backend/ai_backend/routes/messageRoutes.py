# ✅ FILE: E:/ATBot/backend/ai_backend/routes/messageRoutes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from datetime import datetime
import firebase_admin
from firebase_admin import firestore

router = APIRouter()

# ✅ Inizializza Firebase se non attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Modello del messaggio
class ChatMessage(BaseModel):
    session_id: str
    sender: Literal["user", "agent"]
    message: str
    timestamp: datetime

# ✅ Salva un messaggio in una sessione
@router.post("/chat/saveMessage")
async def save_chat_message(msg: ChatMessage):
    try:
        msg_ref = (
            db.collection("chat_sessions")
            .document(msg.session_id)
            .collection("messages")
        )

        msg_ref.add({
            "sender": msg.sender,
            "message": msg.message,
            "timestamp": msg.timestamp,
        })

        return {"message": "✅ Messaggio salvato con successo"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore salvataggio messaggio: {str(e)}")

# ✅ Recupera tutti i messaggi di una sessione
@router.get("/chat/loadMessages/{session_id}")
async def load_chat_messages(session_id: str):
    try:
        messages_ref = (
            db.collection("chat_sessions")
            .document(session_id)
            .collection("messages")
            .order_by("timestamp")
        )
        messages = [doc.to_dict() for doc in messages_ref.stream()]
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore caricamento messaggi: {str(e)}")
