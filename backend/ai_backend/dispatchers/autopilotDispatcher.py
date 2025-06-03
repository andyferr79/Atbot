from firebase_config import db
from datetime import datetime
import httpx
from uuid import uuid4
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import get_memory  # ✅ Memoria GPT

# ✅ Dispatcher Autopilot con log e insight
async def handle(user_id: str, context: dict):
    now = datetime.utcnow()
    action_id = str(uuid4())
    log = []
    triggered = []

    try:
        log_info(user_id, "autopilotDispatcher", "start", context)

        # 🔍 Recupera contesto persistente
        state_ref = db.collection("ai_agent_hub").document(user_id).collection("context").document("state")
        ctx_doc = state_ref.get()
        user_ctx = ctx_doc.to_dict() if ctx_doc.exists else {}

        # 🧠 Recupera memoria GPT
        memory = await get_memory(user_id)
        user_ctx["memory"] = memory

        occupancy = user_ctx.get("occupancy_rate", 50)
        last_action = user_ctx.get("last_action")
        pending_tasks = user_ctx.get("pending_tasks", [])
        ai_mode = user_ctx.get("ai_mode", "assist")

        decision_map = []

        # 🔁 Strategie
        if occupancy < 30:
            decision_map += ["pricing", "marketing"]
            log.append("📉 Occupazione bassa (<30%) → trigger pricing + marketing")

        if pending_tasks:
            decision_map += ["checkin", "cleaning"]
            log.append("📋 Task pendenti → trigger checkin + cleaning")

        if last_action == "insight":
            decision_map.append("followup")
            log.append("🧩 Ultima azione = insight → followup")

        if ai_mode == "aggressive":
            decision_map.append("upsell")
            log.append("🚀 Modalità AI = aggressive → upsell")

        if not decision_map:
            decision_map.append("insight")
            log.append("🧠 Nessuna regola attiva → trigger insight")

        # 🚀 Esecuzione
        async with httpx.AsyncClient() as client:
            for task in decision_map:
                payload = {
                    "user_id": user_id,
                    "intent": task,
                    "context": {
                        "session_id": f"autopilot-{task}-{now.isoformat()}",
                        "auto_triggered_by": "autopilot",
                        "property_id": context.get("property_id", ""),
                        "property_type": context.get("property_type", ""),
                        "rooms_status": context.get("rooms_status", []),
                        "housekeeping_today": context.get("housekeeping_today", []),
                        "memory": memory
                    }
                }
                try:
                    res = await client.post("http://127.0.0.1:8000/agent/dispatch", json=payload)
                    triggered.append({
                        "task": task,
                        "result": res.json()
                    })
                except Exception as e:
                    triggered.append({
                        "task": task,
                        "result": {"status": "error", "message": str(e)}
                    })
                    log.append(f"❌ Errore task {task}: {str(e)}")

        # 📂 Salva azione
        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "autopilot",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": user_ctx,
            "output": {
                "decisions": decision_map,
                "triggered": triggered,
                "log": log
            }
        })

        # 💡 Salva suggerimento in insights
        db.collection("ai_agent_hub").document(user_id).collection("insights").add({
            "timestamp": now,
            "source": "autopilot",
            "message": f"Autopilot ha attivato: {', '.join(decision_map)}",
            "context": user_ctx,
            "type": "system_suggestion"
        })

        # 🪵 Log IA
        db.collection("ai_agent_hub").document(user_id).collection("log").add({
            "timestamp": now,
            "event": "autopilot_run",
            "details": {
                "decisions": decision_map,
                "triggered": triggered,
                "notes": log
            }
        })

        response = {
            "status": "completed",
            "message": f"✅ Autopilot completato con {len(decision_map)} azioni.",
            "decisions": decision_map
        }

        log_info(user_id, "autopilotDispatcher", "completed", context, response)
        return response

    except Exception as e:
        log_error(user_id, "autopilotDispatcher", "critical", e, context)
        return {
            "status": "error",
            "message": f"❌ Errore Autopilot: {str(e)}"
        }
