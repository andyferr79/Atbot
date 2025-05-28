# ✅ FILE: schedulers/generateDailyTasks.py

from firebase_config import db
from datetime import datetime
from uuid import uuid4

# ✅ TASK disponibili per piano
PLAN_AUTOMATIONS = {
    "BASE": ["pricing"],
    "GOLD": ["pricing", "cleaning", "insight", "checkin"]
}

# ✅ Crea un task nel Firestore
def create_task(user_id, task_type, context):
    action_id = str(uuid4())
    now = datetime.utcnow()
    task_ref = db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id)

    task_ref.set({
        "actionId": action_id,
        "type": task_type,
        "status": "pending",
        "context": context,
        "startedAt": now,
        "auto": True
    })

    print(f"✅ Task '{task_type}' creato per {user_id}")

# ✅ Funzione principale
async def generate_daily_tasks():
    print("🚀 Inizio generazione task giornalieri...")
    users_ref = db.collection("users")
    users = users_ref.stream()

    for user in users:
        data = user.to_dict()
        user_id = data.get("uid")
        plan = data.get("plan", "BASE")

        config_ref = db.collection("ai_agent_hub").document(user_id).collection("config").document("settings")
        config_doc = config_ref.get()
        config = config_doc.to_dict() if config_doc.exists else {}

        enabled = config.get("enabled_automations", PLAN_AUTOMATIONS.get(plan, []))

        for task_type in PLAN_AUTOMATIONS.get(plan, []):
            if task_type in enabled:
                # 🔁 Imposta context base per ogni tipo
                context = {"generatedBy": "daily_trigger", "priority": "medium"}
                if task_type == "checkin":
                    context.update({"note": "Trigger giornaliero check-in"})
                if task_type == "insight":
                    context.update({"note": "Analisi giornaliera performance struttura"})

                create_task(user_id, task_type, context)

    print("✅ Task giornalieri generati per tutti gli utenti.")
