from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import firebase_admin
from firebase_admin import firestore

router = APIRouter()

# ✅ Inizializza Firebase Admin se non già attivo
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ✅ Inizializza automazioni per nuovo utente in base al piano
@router.post("/agent/automations/init")
def init_automations_for_user(user_id: str, plan: str):
    try:
        catalog_ref = db.collection("ai_automations_catalog")
        automations = catalog_ref.stream()

        enabled = {}
        for doc in automations:
            data = doc.to_dict()
            if plan in data.get("available_in", []):
                enabled[doc.id] = data.get("default_enabled", False)

        # 🔁 Scrive in /ai_agent_hub/{userId}/enabledAutomations
        user_ref = db.collection("ai_agent_hub").document(user_id)
        user_ref.set({
            "enabledAutomations": enabled
        }, merge=True)

        return {"message": "✅ Automazioni inizializzate", "enabled": enabled}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore init automazioni: {str(e)}")

# ✅ Recupera automazioni visibili per utente
@router.get("/agent/automations/{user_id}")
def get_automations(user_id: str):
    print("🧪 Richiesta automazioni per:", user_id)

    try:
        user_doc = db.collection("ai_agent_hub").document(user_id).get()

        if not user_doc.exists:
            print("❌ Utente non trovato:", user_id)
            raise HTTPException(status_code=404, detail="Utente non trovato")

        user_data = user_doc.to_dict()
        print("📄 Dati utente:", user_data)

        enabled = user_data.get("enabledAutomations", {})
        plan = user_data.get("plan", "base")
        print("📋 Piano utente:", plan)

        automations = []
        for doc in db.collection("ai_automations_catalog").stream():
            data = doc.to_dict()
            print(f"🔎 Catalog entry: {doc.id} →", data)

            available = plan in data.get("available_in", [])
            automations.append({
                "id": doc.id,
                "title": data.get("title"),
                "description": data.get("description"),
                "available_in": data.get("available_in"),
                "enabled": enabled.get(doc.id, False),
                "canToggle": available
            })

        print("✅ Automazioni restituite:", automations)
        return {"automations": automations}

    except Exception as e:
        print("🔥 Errore get_automations:", str(e))
        raise HTTPException(status_code=500, detail=f"Errore get automazioni: {str(e)}")

# ✅ Attiva/disattiva automazione specifica
class AutomationToggleRequest(BaseModel):
    automation_id: str
    enabled: bool

@router.patch("/agent/automations/{user_id}")
def toggle_automation(user_id: str, body: AutomationToggleRequest):
    try:
        user_ref = db.collection("ai_agent_hub").document(user_id)
        user_ref.set({
            "enabledAutomations": {
                body.automation_id: body.enabled
            }
        }, merge=True)

        return {"message": f"{body.automation_id} {'attivata' if body.enabled else 'disattivata'}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore toggle automazione: {str(e)}")
