from fastapi import APIRouter, HTTPException
import requests
import os

router = APIRouter()

AI_BACKEND_URL = "http://127.0.0.1:8000"  # URL locale del backend AI

@router.post("/ai/chat")
async def chat_with_ai(user_message: str, session_id: str):
    try:
        response = requests.post(
            f"{AI_BACKEND_URL}/chat",
            json={"user_message": user_message, "session_id": session_id}
        )
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Errore comunicazione AI: {str(e)}")
