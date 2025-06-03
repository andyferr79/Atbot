from datetime import datetime
import traceback
from firebase_config import db

MAX_LEN = 300  # Limite di caratteri visualizzati in log

def log_info(user_id, dispatcher, action, context=None, output=None):
    timestamp = datetime.utcnow().isoformat()
    print(f"[INFO] {timestamp} | {dispatcher} | user: {user_id} | action: {action}")

    if output:
        print(f"       ↳ Output: {str(output)[:MAX_LEN]}")
    if context:
        print(f"       ↳ Context: {str(context)[:MAX_LEN]}")

    try:
        db.collection("ai_agent_logs").add({
            "user_id": user_id,
            "dispatcher": dispatcher,
            "action": action,
            "output": str(output)[:1000] if output else None,
            "context": str(context)[:1000] if context else None,
            "timestamp": timestamp,
            "level": "info"
        })
    except Exception as firestore_error:
        print(f"[LOGGER] ❌ Errore salvataggio log INFO: {firestore_error}")


def log_error(user_id, dispatcher, action, error, context=None):
    timestamp = datetime.utcnow().isoformat()
    tb = traceback.format_exc()

    print(f"[ERROR] {timestamp} | {dispatcher} | user: {user_id} | action: {action}")
    print(f"        ↳ Error: {str(error)}")
    print(f"        ↳ Traceback:\n{tb}")
    if context:
        print(f"        ↳ Context: {str(context)[:MAX_LEN]}")

    try:
        db.collection("ai_agent_logs").add({
            "user_id": user_id,
            "dispatcher": dispatcher,
            "action": action,
            "error": str(error),
            "traceback": tb,
            "context": str(context)[:1000] if context else None,
            "timestamp": timestamp,
            "level": "error"
        })
    except Exception as firestore_error:
        print(f"[LOGGER] ❌ Errore salvataggio log ERROR: {firestore_error}")
