from datetime import datetime
from uuid import uuid4
from firebase_config import db
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import get_memory  # ✅ Import memoria

async def handle_generic_action(context: dict) -> dict:
    user_id = context.get("user_id", "unknown")
    intent = context.get("intent", "generic")
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        # 🧠 Recupera memoria GPT (ultime azioni e documenti)
        memory = await get_memory(user_id)
        context["memory"] = memory  # ✅ Inserisce nel context

        log_info(user_id, "genericDispatcher", intent, context)  # 🟢 Log inizio

        # ✅ Salva un'azione generica nell'hub
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": intent,
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": {
                "message": f"Azione generica '{intent}' eseguita."
            }
        })

        output = {
            "status": "completed",
            "actionId": action_id,
            "message": f"✅ Azione generica '{intent}' completata."
        }

        log_info(user_id, "genericDispatcher", intent, context, output)  # 🟢 Log fine
        return output

    except Exception as e:
        log_error(user_id, "genericDispatcher", intent, e, context)  # 🔴 Log errore
        return {
            "status": "error",
            "error": str(e),
            "message": "❌ Errore esecuzione azione generica"
        }
