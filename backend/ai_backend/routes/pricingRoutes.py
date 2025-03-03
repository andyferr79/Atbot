from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import openai
import os

# Inizializzazione FastAPI
app = FastAPI()

# Configurazione Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Configurazione OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Modello dati per richiesta di ottimizzazione prezzi
class PricingRequest(BaseModel):
    property_id: str
    current_price: float
    occupancy_rate: float
    competitor_prices: list
    seasonality_factor: float

@app.post("/api/agent/pricing")
def optimize_pricing(data: PricingRequest):
    """Ottimizzazione dinamica del prezzo delle camere."""
    
    # Raccolta dati e calcolo prezzo suggerito
    avg_competitor_price = sum(data.competitor_prices) / len(data.competitor_prices)
    optimal_price = (data.current_price * 0.7) + (avg_competitor_price * 0.3) * data.seasonality_factor
    
    # Richiesta a OpenAI per affinare il suggerimento
    response = openai.Completion.create(
        engine="gpt-4",
        prompt=f"""
        Sei un esperto di gestione alberghiera. Il prezzo attuale di una camera è {data.current_price}€,
        il tasso di occupazione è {data.occupancy_rate*100}%, il prezzo medio dei competitor è {avg_competitor_price}€
        e il fattore stagionalità è {data.seasonality_factor}. Suggerisci il miglior prezzo per massimizzare il profitto.
        """,
        max_tokens=50
    )
    ai_suggested_price = float(response.choices[0].text.strip().replace("€", ""))
    
    # Salvataggio nel database
    db.collection("DynamicPricing").document(data.property_id).set({
        "current_price": data.current_price,
        "optimized_price": ai_suggested_price,
        "occupancy_rate": data.occupancy_rate,
        "competitor_prices": data.competitor_prices,
        "seasonality_factor": data.seasonality_factor
    })
    
    return {"optimized_price": ai_suggested_price}
