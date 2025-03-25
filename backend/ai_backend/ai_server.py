import os
import openai
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# 🔍 Carica variabili d'ambiente
load_dotenv()

# ✅ Inizializza FastAPI
app = FastAPI()

# ✅ Importa le route dell'agente IA
from routes import chat_routes, agent_routes, pricingRoutes
app.include_router(chat_routes.router)
app.include_router(agent_routes.router)
app.include_router(pricingRoutes.router)

# ✅ CORS Debug per frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In produzione restringere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Preflight fix (CORS OPTIONS)
@app.options("/{full_path:path}")
async def preflight_check(full_path: str):
    return JSONResponse(content={}, status_code=200)

# 🔑 Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("⚠️ ATTENZIONE: Chiave API OpenAI mancante.")
    raise RuntimeError("❌ Chiave API non trovata.")
client = openai.OpenAI(api_key=openai_api_key)

# 🔥 Inizializza Firebase
firebase_credentials_path = "E:/ATBot/backend/serviceAccountKey.json"
if not os.path.exists(firebase_credentials_path):
    print(f"⚠️ Credenziali Firebase non trovate in {firebase_credentials_path}")
else:
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_credentials_path)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Connessione Firebase riuscita!")
    except Exception as e:
        print(f"🔴 ERRORE connessione Firebase: {str(e)}")

# ✅ Avvio del server con Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

