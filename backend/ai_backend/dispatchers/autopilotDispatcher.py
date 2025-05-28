# ✅ FILE: dispatchers/autopilotDispatcher.py

from firebase_config import db
from datetime import datetime
import httpx
from uuid import uuid4

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())
        log = []

        # 🔍 Recupera il contesto attuale IA dell’utente
        context_ref = db.collection("ai_agent_hub").document(user_id).collection("context").document("state")
        ctx_doc = context_ref.get()
        user_context = ctx_doc.to_dict() if ctx_doc.exists else {}

        occupancy = user_context.get("occupancy_rate", 50)
        last_action = user_context.get("last_action")
        pending_tasks = user_context.get("pending_tasks", [])
        ai_mode = user_context.get("ai_mode", "assist")

        decision_map = []

        # 🔁 Regole di decisione IA
        if occupancy < 30:
            decision_map.append("pricing")
            decision_map.append("marketing")
            log.append("Occupancy < 30% → attivo pricing + marketing")

        if pending_tasks:
            decision_map.append("checkin")
            decision_map.append("cleaning")
            log.append("Task pendenti trovati → attivo checkin + cleaning")

        if last_action == "insight":
            decision_map.append("followup")
            log.append("Ultima azione = insight → attivo followup")

        if not decision_map:
            decision_map.append("insight")
            log.append("Nessuna regola attiva → attivo analisi insight")

        # 🔁 Esegui ogni azione selezionata
        triggered = []
        async with httpx.AsyncClient() as client:
            for task in decision_map:
                payload = {
                    "user_id": user_id,
                    "taskType": task,
                    "parameters": {"auto_triggered_by": "autopilot", "from_context": user_context}
                }
                res = await client.post("http://localhost:8000/agent/dispatch", json=payload)
                output = res.json()
                triggered.append({"task": task, "result": output})

        # 💾 Salva azione principale autopilot
        action_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)
        action_ref.set({
            "actionId": action_id,
            "type": "autopilot",
            "status": "completed",
            "startedAt": now,
            "context": user_context,
            "output": {
                "decisions": decision_map,
                "triggered": triggered,
                "log": log
            }
        })

        return {
            "status": "completed",
            "message": f"🧠 Autopilot attivato con {len(decision_map)} decisioni.",
            "decisions": decision_map
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Errore Autopilot: {str(e)}"
        }
