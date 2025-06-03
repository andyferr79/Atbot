from firebase_config import db
from firebase_admin import firestore
from datetime import datetime
import uuid
from dispatchers.logUtils import log_info, log_error

# 🔁 FUNZIONE PRINCIPALE (sincrona)
def run(user_id: str, context: dict) -> dict:
    now = datetime.utcnow()
    try:
        log_info(user_id, "crmDispatcher", "update_customer", context)

        customer_data = context.get("customer")
        if not customer_data:
            return {"status": "error", "message": "❌ Nessun dato cliente fornito"}

        customer_id = customer_data.get("id") or f"cust-{uuid.uuid4().hex[:8]}"

        doc_ref = (
            db.collection("ai_agent_hub")
            .document(user_id)
            .collection("crm")
            .document("customers")
            .collection("list")
            .document(customer_id)
        )

        data = {
            "fullName": customer_data.get("fullName"),
            "email": customer_data.get("email"),
            "phone": customer_data.get("phone"),
            "tags": customer_data.get("tags", []),
            "notes": customer_data.get("notes", ""),
            "language": customer_data.get("language", "it"),
            "marketingConsent": customer_data.get("marketingConsent", False),
            "lastUpdate": now
        }

        doc_ref.set(data, merge=True)

        action_id = f"crm-{uuid.uuid4().hex[:6]}"
        action_data = {
            "type": "crm_customer_update",
            "status": "completed",
            "context": {
                "customer_id": customer_id,
                "source": "crmDispatcher"
            },
            "output": f"Dati cliente '{data['fullName']}' salvati correttamente",
            "startedAt": now,
            "completedAt": now
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)

        output = {
            "status": "completed",
            "customerId": customer_id,
            "output": action_data["output"]
        }

        log_info(user_id, "crmDispatcher", "update_customer", context, output)
        return output

    except Exception as e:
        log_error(user_id, "crmDispatcher", "update_customer", e, context)
        return {"status": "error", "message": f"Errore salvataggio CRM: {str(e)}"}

# ✅ VERSIONE ASYNC richiesta dal dispatcher
async def handle(user_id: str, context: dict):
    return run(user_id, context)

