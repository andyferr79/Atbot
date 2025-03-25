from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import openai
import os

router = APIRouter()

# ✅ Inizializza Firebase se non già attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Modello dati per richiesta
class PricingRequest(BaseModel):
    user_id: str
    property_id: str
    current_price: float
    occupancy_rate: float
    competitor_prices: list
    seasonality_factor: float

@router.post("/agent/pricing")
async def optimize_pricing(request: PricingRequest):
    try:
        now = datetime.utcnow()
        avg_competitor_price = sum(request.competitor_prices) / len(request.competitor_prices)

        # Calcolo interno iniziale
        optimal_price = (request.current_price * 0.7 + avg_competitor_price * 0.3) * request.seasonality_factor

        # Prompt per OpenAI (ChatCompletion)
        prompt = f"""
        Sei un esperto revenue manager per hotel.
        Il prezzo attuale è {request.current_price}€.
        Tasso occupazione: {request.occupancy_rate*100:.1f}%.
        Prezzo medio competitor: {avg_competitor_price:.2f}€.
        Fattore stagionalità: {request.seasonality_factor}.
        Suggerisci il miglior prezzo di vendita per massimizzare occupazione e profitto.
        Rispondi solo con il prezzo consigliato in euro.
        """

        chat_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un esperto di pricing hotel."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        ai_price_raw = chat_response.choices[0].message.content.strip()
        ai_suggested_price = float(ai_price_raw.replace("€", "").replace(",", "."))

        # 🔥 Salva il prezzo nel DB
        db.collection("DynamicPricing").document(request.property_id).set({
            "userId": request.user_id,
            "current_price": request.current_price,
            "optimized_price": ai_suggested_price,
            "occupancy_rate": request.occupancy_rate,
            "competitor_prices": request.competitor_prices,
            "seasonality_factor": request.seasonality_factor,
            "generatedAt": now
        })

        # ✅ Traccia azione in HUB
        action_id = str(uuid4())
        hub_ref = db.collection("ai_agent_hub").document(request.user_id)
        hub_ref.collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "pricing",
            "status": "completed",
            "startedAt": now,
            "context": request.dict(),
            "output": {
                "optimized_price": ai_suggested_price
            }
        })

        hub_ref.set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        return {
            "message": "✅ Prezzo ottimizzato con successo",
            "optimized_price": ai_suggested_price
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore ottimizzazione: {str(e)}")

