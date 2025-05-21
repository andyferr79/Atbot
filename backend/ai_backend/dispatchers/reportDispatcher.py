# ✅ FILE: dispatchers/reportDispatcher.py

from firebase_config import db
from datetime import datetime
from uuid import uuid4

async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())

        # Simula generazione contenuto report
        report_content = f"📊 Report generato per {user_id} alle {now.isoformat()}"

        # 🔥 Salva nel DB
        db.collection("ai_agent_hub").document(user_id).collection("documents").document(action_id).set({
            "documentId": action_id,
            "type": "report",
            "content": report_content,
            "generatedAt": now,
            "linkedSession": context.get("session_id", "N/A")
        })

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "report",
            "status": "completed",
            "startedAt": now,
            "output": {
                "report": report_content
            }
        })

        return {
            "status": "completed",
            "documentId": action_id,
            "generatedAt": now.isoformat()
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
