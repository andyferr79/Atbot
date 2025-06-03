from firebase_config import db
from datetime import datetime
from uuid import uuid4
import openai
import os
from dispatchers.logUtils import log_info, log_error  # ✅ Logging IA
from dispatchers.memoryUtils import get_memory_context  # ✅ Opzionale per futura integrazione

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OPENAI_API_KEY mancante")
client = openai.OpenAI(api_key=openai_api_key)

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        log_info(user_id, "faqDispatcher", "generate_faq_response", context)

        question = context.get("question", "").strip()
        if not question:
            raise ValueError("❌ Domanda mancante nel context")

        # 🔍 Recupera profilo struttura
        profile_ref = db.collection("ai_agent_hub").document(user_id).collection("properties").document("main")
        profile_doc = profile_ref.get()
        structure_profile = profile_doc.to_dict() if profile_doc.exists else {}

        # 📤 Prompt personalizzato
        prompt = f"""
        Sei un assistente virtuale per un hotel.
        Questa è la descrizione della struttura: {structure_profile}.
        Rispondi alla seguente domanda del cliente in modo cortese, preciso e personalizzato:
        → {question}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un assistente specializzato in hotel di lusso."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )

        answer = response.choices[0].message.content.strip()

        # 🧠 Salva azione nel Firestore
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        actions_ref.set({
            "actionId": action_id,
            "type": "faq",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "question": question,
                "answer": answer
            }
        })

        output = {
            "status": "completed",
            "answer": answer,
            "actionId": action_id
        }

        log_info(user_id, "faqDispatcher", "generate_faq_response", context, output)
        return output

    except Exception as e:
        log_error(user_id, "faqDispatcher", "generate_faq_response", e, context)
        return {
            "status": "error",
            "message": "❌ Errore generazione risposta FAQ",
            "error": str(e)
        }
