import datetime
from datetime import timezone
import firebase_admin
from firebase_admin import credentials, firestore
import requests

# ✅ Inizializza Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# 🔁 Costanti
DISPATCH_URL = "http://localhost:8000/agent/dispatch"
GPT_MODELS = {"BASE": "gpt-3.5-turbo", "GOLD": "gpt-4"}
TODAY = datetime.datetime.now(timezone.utc).date()

def price_delta(old, new):
    if old == 0:
        return 100
    return abs((new - old) / old) * 100

def run_scheduler():
    logs = []
    users = db.collection("ai_agent_hub").stream()

    for user_doc in users:
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        plan = user_data.get("plan", "BASE").upper()
        enabled = user_data.get("enabledAutomations", {})
        if not enabled.get("pricing"):
            continue

        tasks = db.collection("AutomationTasks") \
                  .where("taskType", "==", "pricing") \
                  .where("assignedTo", "==", user_id).stream()

        for task in tasks:
            task_data = task.to_dict()
            due_date = task_data.get("dueDate")
            if not due_date:
                continue

            due_date_obj = due_date.to_datetime() if hasattr(due_date, 'to_datetime') else due_date
            if due_date_obj.date() != TODAY:
                continue

            # 🧠 Condizioni simulate (da sostituire con dati reali)
            occupancy = 0.72
            has_bookings = True
            last_price = 120
            new_suggested = 124.2

            if not has_bookings or occupancy > 0.9:
                logs.append(f"⏭️  Skip {user_id} (occupancy/bookings)")
                continue
            if price_delta(last_price, new_suggested) < 5:
                logs.append(f"🌀 Skip {user_id} (delta <5%)")
                continue

            payload = {
                "user_id": user_id,
                "intent": "pricing",
                "context": {
                    "session_id": f"auto-{TODAY}",
                    "property_id": "main",
                    "current_price": last_price,
                    "occupancy_rate": occupancy,
                    "competitor_prices": [110, 125, 120],
                    "seasonality_factor": 1.05,
                    "model": GPT_MODELS.get(plan, "gpt-3.5-turbo")
                }
            }

            try:
                res = requests.post(DISPATCH_URL, json=payload)
                if res.status_code == 200:
                    logs.append(f"✅ Dispatch OK for {user_id}")
                else:
                    logs.append(f"❌ Dispatch FAIL for {user_id}: {res.status_code}")
            except Exception as e:
                logs.append(f"🔥 ERROR for {user_id}: {str(e)}")

    return logs

if __name__ == "__main__":
    results = run_scheduler()
    for log in results:
        print(log)
