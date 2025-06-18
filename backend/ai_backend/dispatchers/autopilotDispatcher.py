from datetime import datetime, timedelta
from uuid import uuid4
import asyncio, math, httpx, random

from firebase_config import db
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import (
    get_memory,          # memoria classica (30 gg)
    get_vector_memory,   # 🔄 nuova: vettoriale, se disponibile
)
# opz. se hai già un wrapper per inviare notifiche admin/email
# from dispatchers.notifyUtils import notify_admin

MAX_RETRIES = 3          # 🔁 retry per singolo task
CB_THRESHOLD = 5         # 💥 circuit-breaker su 5 fallimenti in 15 min

def compute_priority_score(ctx: dict, negatives_30d: int) -> int:
    """Calcola un punteggio 0-100 da occupancy, ai_mode & feedback 👎"""
    occ_penalty  = max(0, 30 - ctx.get("occupancy_rate", 50)) * 1.5     # fino a 45
    mode_bonus   = 15 if ctx.get("ai_mode") == "aggressive" else 0
    fb_penalty   = min(20, negatives_30d * 2)                           # max −20
    raw = 50 + mode_bonus + occ_penalty - fb_penalty
    return max(0, min(100, round(raw)))

async def safe_post(client: httpx.AsyncClient, url: str, json_payload: dict):
    """POST con retry esponenziale; restituisce (success, result|exception)"""
    delay = 1
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = await client.post(url, json=json_payload, timeout=30)
            r.raise_for_status()
            return True, r.json()
        except Exception as exc:
            if attempt == MAX_RETRIES:
                return False, exc
            await asyncio.sleep(delay + random.random())
            delay *= 2

async def handle(user_id: str, context: dict):
    now        = datetime.utcnow()
    action_id  = str(uuid4())
    log_lines  = []
    triggered  = []
    circuit_ok = True

    try:
        log_info(user_id, "autopilotDispatcher", "start", context)

        # ── 1️⃣ Contesto persistente (+ memoria classica & vettoriale) ──
        state_ref = (
            db.collection("ai_agent_hub").document(user_id)
              .collection("context").document("state")
        )
        ctx_doc   = state_ref.get()
        user_ctx  = ctx_doc.to_dict() if ctx_doc.exists else {}

        # • memoria classica (30 gg)
        memory = await get_memory(user_id)
        # • memoria vettoriale (long-term) – se Pinecone/Weaviate configurato
        vector_mem = await get_vector_memory(user_id, limit=100) or []
        user_ctx.update({"memory": memory, "vector_memory": vector_mem})

        # negativi ultimi 30 gg per priorità
        negatives_30d = (
            db.collection("ai_agent_hub").document(user_id)
              .collection("feedback")
              .where("rating", "==", "down")
              .where("timestamp", ">", now - timedelta(days=30))
              .get()
        )
        priority_score = compute_priority_score(user_ctx, len(negatives_30d))

        # ── 2️⃣ Decision Map dinamica ──
        decision_map = []

        if priority_score > 70:
            decision_map += ["insight", "alert"]
            log_lines.append(f"🔥 priority_score={priority_score} → insight+alert")

        if user_ctx.get("occupancy_rate", 50) < 30:
            decision_map += ["pricing", "marketing"]
            log_lines.append("📉 Occupazione bassa → pricing+marketing")

        if user_ctx.get("pending_tasks"):
            decision_map += ["checkin", "cleaning"]
            log_lines.append("📋 Task pendenti → checkin+cleaning")

        if user_ctx.get("last_action") == "insight":
            decision_map.append("followup")
            log_lines.append("🔄 Ultima azione insight → followup")

        if user_ctx.get("ai_mode") == "aggressive":
            decision_map.append("upsell")
            log_lines.append("🚀 AI-mode aggressive → upsell")

        if not decision_map:
            decision_map.append("insight")
            log_lines.append("🧠 Fallback → insight")

        # ── 3️⃣ Circuit-breaker: troppi fallimenti recenti? ──
        fails_recent = (
            db.collection("ai_agent_hub").document(user_id)
              .collection("failed_tasks")
              .where("timestamp", ">", now - timedelta(minutes=15))
              .get()
        )
        if len(fails_recent) >= CB_THRESHOLD:
            circuit_ok = False
            log_lines.append("⛔ Circuit-breaker attivo: skip dispatch")

        # ── 4️⃣ Dispatch asíncrono con retry ──
        if circuit_ok:
            async with httpx.AsyncClient() as client:
                for task in decision_map:
                    payload = {
                        "user_id": user_id,
                        "intent": task,
                        "context": {
                            **context,
                            "session_id": f"autopilot-{task}-{now.isoformat()}",
                            "auto_triggered_by": "autopilot",
                            "priority_score": priority_score,
                        },
                    }
                    success, result = await safe_post(client,
                        "http://127.0.0.1:8000/agent/dispatch", payload
                    )

                    if success:
                        triggered.append({"task": task, "result": result})
                    else:
                        err_msg = str(result)
                        log_lines.append(f"❌ {task} errore: {err_msg}")
                        triggered.append({"task": task, "result": {"status":"error","msg": err_msg}})

                        # salva nel registro fail & (opz) notifica admin
                        db.collection("ai_agent_hub").document(user_id) \
                          .collection("failed_tasks").add({
                              "timestamp": now,
                              "task": task,
                              "error": err_msg,
                              "context": payload["context"],
                          })
                        # notify_admin(user_id, f"Task {task} fallito", err_msg)
        else:
            triggered.append({"status": "circuit_open"})

        # ── 5️⃣ Persistenza finale azione + insight ──
        db.collection("ai_agent_hub").document(user_id)\
          .collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "autopilot",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "priority_score": priority_score,
            "context": user_ctx,
            "output": {"decisions": decision_map, "triggered": triggered, "log": log_lines},
        })

        db.collection("ai_agent_hub").document(user_id)\
          .collection("insights").add({
            "timestamp": now,
            "source": "autopilot",
            "message": f"Autopilot ha avviato {', '.join(decision_map)} (prio {priority_score})",
            "type": "system_suggestion",
        })

        resp = {
            "status": "completed",
            "priority_score": priority_score,
            "decisions": decision_map,
            "triggered": triggered,
        }
        log_info(user_id, "autopilotDispatcher", "completed", context, resp)
        return resp

    except Exception as exc:
        log_error(user_id, "autopilotDispatcher", "critical", exc, context)
        return {"status": "error", "message": f"Autopilot crash: {exc}"}
