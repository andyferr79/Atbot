from firebase_config import db
from datetime import datetime
from typing import List, Dict

# ✅ Recupera memoria storica per l’utente
def get_memory(user_id: str, limit: int = 3) -> List[Dict]:
    try:
        memory = []

        # 🔁 Ultime azioni completate
        actions_ref = db.collection("ai_agent_hub").document(user_id).collection("actions")
        actions = (
            actions_ref
            .where("status", "==", "completed")
            .order_by("completedAt", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        for doc in actions:
            data = doc.to_dict()
            memory.append({
                "type": data.get("type"),
                "output": data.get("output"),
                "completedAt": data.get("completedAt").isoformat() if data.get("completedAt") else None
            })

        # 📄 Documenti recenti
        docs_ref = db.collection("ai_agent_hub").document(user_id).collection("documents")
        documents = (
            docs_ref
            .order_by("generatedAt", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        for doc in documents:
            data = doc.to_dict()
            memory.append({
                "type": data.get("type", "document"),
                "output": data.get("content"),
                "generatedAt": data.get("generatedAt").isoformat() if data.get("generatedAt") else None
            })

        # 🔃 Ordina tutto per timestamp
        memory.sort(key=lambda x: x.get("completedAt") or x.get("generatedAt"), reverse=True)

        return memory[:limit]

    except Exception as e:
        print(f"[MEMORY ERROR] {e}")
        return []

# ✅ Wrapper sincrono per compatibilità legacy
def get_memory_context(user_id: str, context: dict) -> dict:
    context["memory"] = get_memory(user_id)
    return context

# ✅ Wrapper asincrono per dispatcher moderni
async def get_memory_context(user_id: str, context: dict = None, intent: str = None) -> List[Dict]:
    return get_memory(user_id)
