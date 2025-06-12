# ✅ FILE: utils/intentClassifier.py

import openai
import os
from datetime import datetime
import firebase_admin
from firebase_admin import firestore

# ✅ Intent supportati
VALID_INTENTS = {
    "pricing", "checkin", "cleaning", "upsell", "marketing", "crm",
    "conversion", "revenue", "bookingfix", "support", "booking",
    "report", "insight", "faq", "security", "alert", "autopilot",
    "context", "feedback", "event", "followup"
}

# ✅ OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("⚠️ OPENAI_API_KEY mancante")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Firestore
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# 🔍 Classificatore Intent con fallback e logging
async def classify_intent_from_message(message: str, user_id: str = None) -> str:
    system_prompt = """
Sei un classificatore IA per un assistente per hotel.
Dato un messaggio dell’utente, individua l’intent dell’agente più adatto tra i seguenti:
{intents}

Rispondi solo con il nome dell’intent, esattamente come scritto sopra.
""".format(intents="\n".join(f"- {intent}" for intent in sorted(VALID_INTENTS)))

    model_order = ["gpt-4", "gpt-3.5-turbo"]
    intent_final = "unknown"
    error_logs = []
    now = datetime.utcnow()

    for model in model_order:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt.strip()},
                    {"role": "user", "content": message.strip()}
                ],
                temperature=0
            )
            raw = response.choices[0].message.content.strip().lower()
            intent = raw.replace("intent:", "").replace('"', "").replace("'", "").strip()

            if intent in VALID_INTENTS:
                intent_final = intent
                break
            else:
                error_logs.append(f"Modello {model} ha risposto: {raw}")
        except Exception as e:
            error_logs.append(f"❌ Errore con {model}: {str(e)}")

    # 🔥 Log Firestore (intent log + intent_history)
    try:
        log_data = {
            "user_id": user_id or "anonymous",
            "message": message,
            "detected_intent": intent_final,
            "timestamp": now,
            "model_used": model if intent_final != "unknown" else None,
            "errors": error_logs if intent_final == "unknown" else None,
            "level": "intent_classification"
        }
        db.collection("ai_agent_logs").add(log_data)

        # 🧠 Salva intent_history utente
        if user_id and intent_final != "unknown":
            db.collection("ai_agent_hub").document(user_id).collection("intent_history").add({
                "message": message,
                "intent": intent_final,
                "detectedAt": now,
                "model": model
            })

    except Exception as firestore_err:
        print(f"[LOGGER] ❌ Errore salvataggio Firestore: {firestore_err}")

    return intent_final
