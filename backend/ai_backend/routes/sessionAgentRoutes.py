from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
from firebase_config import db  # ✅ Inizializzazione centralizzata
from firebase_admin import firestore

router = APIRouter()

# ✅ Modello richiesta nuova sessione
class StartSessionRequest(BaseModel):
    user_id: str
    title: str = "Nuova Chat"
    summary: str = ""
    status: str = "active"

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
        print(f"🔥 Errore creazione sessione: {e}")
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
        print(f"🔥 Errore archiviazione sessione: {e}")
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
        print(f"🔥 Errore eliminazione sessione: {e}")
        raise HTTPException(status_code=500, detail=f"Errore eliminazione: {str(e)}")

# ✅ Recupera tutte le azioni associate a una sessione
@router.get("/chat_sessions/{session_id}/actions")
async def get_chat_session_actions(session_id: str = Path(...)):
    try:
        query = db.collection_group("actions").where("context.session_id", "==", session_id)
        actions = [doc.to_dict() for doc in query.stream()]
        return actions
    except Exception as e:
        print(f"🔥 Errore recupero azioni sessione: {e}")
        raise HTTPException(status_code=500, detail=f"Errore recupero azioni per sessione: {str(e)}")

# ✅ Recupera tutte le sessioni di un utente
@router.get("/chat_sessions/{user_id}")
async def get_chat_sessions_by_user(user_id: str):
    try:
        sessions_query = (
            db.collection("chat_sessions")
            .where("userId", "==", user_id)
            .order_by("lastUpdated", direction=firestore.Query.DESCENDING)
        )

        results = []
        for doc in sessions_query.stream():
            data = doc.to_dict()
            if data.get("lastUpdated", datetime.min) > datetime(2000, 1, 1):
                results.append(data | {"sessionId": doc.id})

        return results

    except Exception as e:
        print(f"🔥 Errore recupero chat_sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Errore recupero chat: {str(e)}")
