from datetime import datetime
from uuid import uuid4
from firebase_config import db

def handle_generic_action(context: dict) -> dict:
    try:
        user_id = context.get("user_id", "unknown")
        intent = context.get("intent", "generic")
        now = datetime.utcnow()
        action_id = str(uuid4())

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

        return {
            "status": "completed",
            "actionId": action_id,
            "message": f"✅ Azione generica '{intent}' completata."
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "❌ Errore esecuzione azione generica"
        }
