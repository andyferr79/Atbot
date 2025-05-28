# ✅ FILE: schedulers/triggerWatcher.py

from firebase_config import db
from datetime import datetime
import requests

DISPATCH_URL = "http://localhost:8000/agent/dispatch"  # Cambia se in produzione

def log(msg):
    print(f"[TriggerWatcher] {msg}")

async def trigger_pending_events():
    log("🚀 Inizio scansione eventi pending...")
    events_ref = db.collection_group("events")\
        .where("status", "==", "pending")\
        .order_by("createdAt")

    for doc in events_ref.stream():
        event = doc.to_dict()
        user_id = doc.reference.parent.parent.id
        event_id = doc.id

        task_type = event.get("next_agent")
        context = event.get("params", {})

        if not task_type:
            log(f"❌ Evento {event_id} senza next_agent, ignorato.")
            continue

        payload = {
            "user_id": user_id,
            "taskType": task_type,
            "parameters": context
        }

        try:
            res = requests.post(DISPATCH_URL, json=payload)
            if res.status_code == 200:
                log(f"✅ Triggerato {task_type} per {user_id}")
                doc.reference.update({
                    "status": "dispatched",
                    "dispatchedAt": datetime.utcnow()
                })
            else:
                log(f"⚠️ Errore trigger {task_type} → {res.status_code}: {res.text}")
        except Exception as e:
            log(f"❌ Errore invio dispatch: {str(e)}")

    log("✅ Fine scansione eventi.")

# ✅ Endpoint FastAPI (opzionale)
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/agent/trigger-pending")
async def trigger_pending():
    try:
        await trigger_pending_events()
        return {"message": "✅ Trigger IA completati."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Errore trigger: {str(e)}")
