from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from firebase_config import db  # ✅ Usa inizializzazione centralizzata
import openai
import os

router = APIRouter()

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("⚠️ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Modello richiesta chat
class ChatRequest(BaseModel):
    user_message: str
    session_id: str
    user_id: str

# ✅ Endpoint per inviare messaggio alla IA
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
