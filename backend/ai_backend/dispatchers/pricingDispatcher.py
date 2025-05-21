# ✅ FILE: dispatchers/pricingDispatcher.py

from firebase_config import db
from uuid import uuid4
from datetime import datetime
import openai
import os

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("⚠️ OPENAI_API_KEY mancante")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Funzione principale del dispatcher
async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 📥 Estrai parametri dal context
        property_id = context.get("property_id")
        current_price = context.get("current_price")
        occupancy_rate = context.get("occupancy_rate", 0)
        competitor_prices = context.get("competitor_prices", [])
        seasonality_factor = context.get("seasonality_factor", 1.0)

        if not property_id or not competitor_prices:
            raise ValueError("❌ Parametri insufficienti per ottimizzare il prezzo")

        avg_competitor_price = sum(competitor_prices) / len(competitor_prices)
        base_price = (current_price * 0.7 + avg_competitor_price * 0.3) * seasonality_factor

        # 🧠 Prompt per GPT
        prompt = f"""
        Sei un esperto revenue manager per hotel.
        Il prezzo attuale è {current_price}€.
        Tasso occupazione: {occupancy_rate*100:.1f}%.
        Prezzo medio competitor: {avg_competitor_price:.2f}€.
        Fattore stagionalità: {seasonality_factor}.
        Suggerisci il miglior prezzo di vendita per massimizzare occupazione e profitto.
        Rispondi solo con il prezzo consigliato in euro.
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un esperto di pricing hotel."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        price_raw = response.choices[0].message.content.strip()
        optimized_price = float(price_raw.replace("€", "").replace(",", "."))

        # 💾 Salva prezzi ottimizzati
        db.collection("DynamicPricing").document(property_id).set({
            "userId": user_id,
            "current_price": current_price,
            "optimized_price": optimized_price,
            "occupancy_rate": occupancy_rate,
            "competitor_prices": competitor_prices,
            "seasonality_factor": seasonality_factor,
            "generatedAt": now
        })

        # ✅ Salva azione completata
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "pricing",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "optimized_price": optimized_price
            }
        })

        return {
            "optimized_price": optimized_price,
            "base_price": base_price,
            "model_used": "gpt-4",
            "completedAt": now.isoformat()
        }

    except Exception as e:
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "status": "error",
            "startedAt": now,
            "completedAt": datetime.utcnow(),
            "context": context,
            "error": str(e)
        })
        raise
