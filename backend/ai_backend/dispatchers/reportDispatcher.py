from firebase_config import db
from datetime import datetime
from uuid import uuid4
from dispatchers.logUtils import log_info, log_error  # ✅ Logging centralizzato

# ✅ Funzione principale dispatcher
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())

    try:
        # 📥 Estrai dati dal context
        session_id = context.get("session_id", "N/A")
        if not session_id:
            raise ValueError("❌ session_id mancante nel context")

        # 📝 Simula generazione contenuto report
        report_content = f"📊 Report generato per {user_id} alle {now.isoformat()}"

        # 📄 Documento
        doc_data = {
            "documentId": action_id,
            "type": "report",
            "content": report_content,
            "generatedAt": now,
            "linkedSession": session_id,
            "source_agent": "reportDispatcher",
            "tags": ["report", "generated"]
        }

        # 💾 Salva documento
        db.collection("ai_agent_hub").document(user_id).collection("documents").document(action_id).set(doc_data)

        # 🧠 Tracciamento azione IA
        action_data = {
            "actionId": action_id,
            "type": "report",
            "status": "completed",
            "startedAt": now,
            "completedAt": datetime.utcnow(),
            "context": context,
            "output": {
                "report": report_content,
                "linkedSession": session_id
            }
        }
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)

        log_info(user_id, "reportDispatcher", "generate_report", context, action_data["output"])

        return {
            "status": "completed",
            "documentId": action_id,
            "generatedAt": now.isoformat()
        }

    except Exception as e:
        log_error(user_id, "reportDispatcher", "generate_report", e, context)
        return {
            "status": "error",
            "message": f"❌ Errore generazione report: {str(e)}"
        }
