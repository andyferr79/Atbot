from datetime import datetime
from firebase_config import db
import openai
import os
from uuid import uuid4
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import get_memory_context

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OpenAI API key non trovata")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Prompt dinamico
def build_prompt(checkouts, checkins, staff):
    return f"""
Sei un assistente IA specializzato nella gestione delle pulizie per hotel e B&B.
Organizza le pulizie post check-out ottimizzando le risorse disponibili.

🏨 Check-out di oggi: {checkouts}
🛬 Check-in previsti: {checkins}
👥 Staff disponibile: {staff}

Genera un piano dettagliato indicando chi pulisce quali camere, priorità alta se la stanza è in check-in immediato.
"""

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        # 🧠 Recupera memoria IA
        context["memory"] = await get_memory_context(user_id, context, intent="cleaning")

        # 🔍 Estrai contesto
        checkouts_today = context.get("checkouts_today", [])
        checkins_today = context.get("checkins_today", [])
        staff_available = context.get("staff", [])

        # 🔁 Fallback intelligenti
        if not checkouts_today:
            checkouts_today = ["Nessun check-out registrato oggi"]
        if not staff_available:
            staff_available = ["Nessuno disponibile"]

        # 💬 Costruzione prompt
        prompt = build_prompt(checkouts_today, checkins_today, staff_available)

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un assistente IA specializzato nella gestione delle pulizie alberghiere."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )

        cleaning_plan = response.choices[0].message.content.strip()

        # 💾 Salva su Firestore
        action_data = {
            "actionId": action_id,
            "type": "cleaning",
            "status": "completed",
            "startedAt": now,
            "completedAt": datetime.utcnow(),
            "context": context,
            "output": {
                "cleaning_plan": cleaning_plan
            }
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)
        db.collection("ai_agent_hub").document(user_id).set({
            "lastActive": now,
            "lastCompletedAction": action_id
        }, merge=True)

        log_info(user_id, "cleaningDispatcher", "generate_cleaning_plan", context, action_data["output"])
        return {
            "status": "completed",
            "plan": cleaning_plan,
            "actionId": action_id
        }

    except Exception as e:
        log_error(user_id, "cleaningDispatcher", "generate_cleaning_plan", e, context)
        return {
            "status": "error",
            "error": str(e),
            "message": "❌ Errore nella generazione del piano pulizie"
        }
