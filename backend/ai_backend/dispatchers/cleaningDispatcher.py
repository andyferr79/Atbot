# ✅ FILE: dispatchers/cleaningDispatcher.py

from datetime import datetime, timedelta
from firebase_config import db  # Usa connessione centralizzata a Firestore
import openai
import os
from uuid import uuid4

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)


async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # 🔍 Estrai info da context
        checkouts_today = context.get("checkouts_today", [])  # es. [{"room": "101", "time": "10:00"}, ...]
        checkins_today = context.get("checkins_today", [])    # es. [{"room": "101", "time": "14:00"}, ...]
        staff_available = context.get("staff", [])            # es. ["Luca", "Elena"]

        # 💡 Prompt IA per generare task di pulizia intelligente
        prompt = f"""
        Sei un gestore intelligente delle pulizie per un hotel.
        Oggi ci sono i seguenti check-out: {checkouts_today}
        E i seguenti check-in: {checkins_today}
        Il personale disponibile è: {staff_available}
        Crea un piano ottimizzato per le pulizie, indicando chi pulisce cosa e con quale priorità.
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un assistente IA specializzato nella gestione delle pulizie alberghiere."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        cleaning_plan = response.choices[0].message.content.strip()

        # 🔥 Salva azione nel Firestore
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        actions_ref.set({
            "actionId": action_id,
            "type": "cleaning",
            "status": "completed",
            "startedAt": now,
            "context": context,
            "output": {
                "cleaning_plan": cleaning_plan
            }
        })

        # 🔄 Aggiorna stato utente
        db.collection("ai_agent_hub").document(user_id).set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        return {
            "status": "completed",
            "plan": cleaning_plan,
            "actionId": action_id
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
