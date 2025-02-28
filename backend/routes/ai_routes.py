from fastapi import APIRouter, HTTPException, Request, Depends
import requests
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()

AI_BACKEND_URL = "http://127.0.0.1:8000"  # URL locale del backend AI

# ✅ Configurazione del logging avanzato
logging.basicConfig(filename="logs/ai_errors.log", level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

# ✅ Rate Limiting (Max 20 richieste per IP ogni 10 minuti)
limiter = Limiter(key_func=get_remote_address)

@router.post("/ai/chat")
@limiter.limit("20/minute")  # ✅ Limitiamo a 20 richieste al minuto per evitare abusi
async def chat_with_ai(user_message: str, session_id: str):
    """Invia un messaggio all'AI e ottiene una risposta."""
    if not user_message or not session_id:
        raise HTTPException(status_code=400, detail="❌ I campi user_message e session_id sono obbligatori.")

    try:
        response = requests.post(
            f"{AI_BACKEND_URL}/chat",
            json={"user_message": user_message, "session_id": session_id},
            timeout=10  # ✅ Impostiamo un timeout massimo di 10 secondi
        )
        response.raise_for_status()  # ✅ Lancia un'eccezione per errori HTTP 4xx/5xx
        return response.json()
    except requests.exceptions.Timeout:
        logging.error("❌ Timeout nella comunicazione con il backend AI.")
        raise HTTPException(status_code=504, detail="❌ Timeout nella comunicazione con il backend AI.")
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Errore comunicazione AI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"❌ Errore comunicazione AI: {str(e)}")
