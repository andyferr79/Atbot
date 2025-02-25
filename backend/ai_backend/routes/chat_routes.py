from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

router = APIRouter()

class ChatRequest(BaseModel):
    user_message: str
    session_id: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key non trovata")

    try:
        model = "gpt-4" if "analisi avanzata" in request.user_message.lower() else "gpt-3.5-turbo"
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": request.user_message}],
            temperature=0.7
        )

        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore OpenAI: {str(e)}")
