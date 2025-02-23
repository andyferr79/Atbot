import os
import openai
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

# Inizializza FastAPI
app = FastAPI()

# Configura OpenAI API
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("⚠️ ATTENZIONE: La chiave API di OpenAI non è stata trovata. Assicurati di averla impostata nel file .env")
else:
    openai.api_key = openai_api_key

# Inizializza Firebase
firebase_credentials_path = "E:/ATBot/firebase/serviceAccountKey.json"
if not os.path.exists(firebase_credentials_path):
    print(f"⚠️ ATTENZIONE: Il file delle credenziali Firebase non è stato trovato: {firebase_credentials_path}")
else:
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Connessione a Firebase riuscita!")
    except Exception as e:
        print(f"🔴 ERRORE: Impossibile connettersi a Firebase - {str(e)}")

# Modello dati per la richiesta alla chatbox
class ChatRequest(BaseModel):
    user_message: str
    session_id: str

# Funzione per selezionare il modello AI
def decide_model(user_message: str):
    if "analisi avanzata" in user_message.lower():
        return "gpt-4"
    return "gpt-3.5-turbo"

# Endpoint per la chat AI
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not openai_api_key:
        return {"error": "⚠️ OpenAI non è configurato. Controlla il file .env."}

    try:
        model = decide_model(request.user_message)
        response = openai.client.completions.create(
            model=model,
            messages=[{"role": "user", "content": request.user_message}],
            temperature=0.7
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        print(f"❌ Errore durante la richiesta a OpenAI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore durante la richiesta a OpenAI: {str(e)}")

# Avvio del server con uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

