"""
memoryUtils.py
Utility helpers for retrieving short-term (Firestore) and long-term (vector-DB) memory
for HOXY / StayPro AI agent dispatchers.
"""

from datetime import datetime
from typing import List, Dict
import os

from firebase_config import db


# ░░░ SHORT-TERM MEMORY (Firestore) ░░░
def get_memory(user_id: str, limit: int = 3) -> List[Dict]:
    """Return the last <limit> completed actions + generated documents for the user."""
    try:
        memory: List[Dict] = []

        # Completed actions
        actions_ref = (
            db.collection("ai_agent_hub")
            .document(user_id)
            .collection("actions")
            .where("status", "==", "completed")
            .order_by("completedAt", direction="DESCENDING")
            .limit(limit)
        )
        for doc in actions_ref.stream():
            data = doc.to_dict()
            memory.append(
                {
                    "type": data.get("type"),
                    "output": data.get("output"),
                    "timestamp": data.get("completedAt").isoformat() if data.get("completedAt") else None,
                }
            )

        # Recent documents
        docs_ref = (
            db.collection("ai_agent_hub")
            .document(user_id)
            .collection("documents")
            .order_by("generatedAt", direction="DESCENDING")
            .limit(limit)
        )
        for doc in docs_ref.stream():
            data = doc.to_dict()
            memory.append(
                {
                    "type": data.get("type", "document"),
                    "output": data.get("content"),
                    "timestamp": data.get("generatedAt").isoformat() if data.get("generatedAt") else None,
                }
            )

        # Order by timestamp desc
        memory.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return memory[:limit]

    except Exception as e:
        print(f"[MEMORY ERROR] {e}")
        return []


def get_memory_context(user_id: str, context: dict) -> dict:
    """Synchronous helper: merges short-term memory into the provided context."""
    context["memory"] = get_memory(user_id)
    return context


async def get_memory_context_async(user_id: str, context: dict | None = None) -> List[Dict]:
    """Async wrapper for pipelines that already work with `await`. Returns short-term memory list."""
    return get_memory(user_id)


# ░░░ LONG-TERM MEMORY (Vector DB, e.g. Weaviate) ░░░
# Optional — returns [] if vector backend is not configured / dependency missing.
try:
    import weaviate  # type: ignore[import]  # <- sopprime l'avviso Pylance
except ImportError:
    weaviate = None  # Graceful fallback if library is absent


async def get_vector_memory(user_id: str, k: int = 5) -> List[Dict]:
    """Fetch top-k vector memories for user (if service configured), else empty list."""
    if weaviate is None:
        return []

    url = os.getenv("VECTOR_DB_URL")
    api_key = os.getenv("VECTOR_DB_API_KEY")
    if not url or not api_key:
        return []

    try:
        client = weaviate.Client(
            url=url,
            additional_headers={"X-OpenAI-Api-Key": api_key},
        )

        result = (
            client.query.get("MemoryChunk", ["text", "createdAt"])
            .with_where({"path": ["userId"], "operator": "Equal", "valueString": user_id})
            .with_limit(k)
            .do()
        )
        memories: List[Dict] = [
            {
                "type": "vector_memory",
                "output": obj.get("text"),
                "timestamp": obj.get("createdAt"),
            }
            for obj in result.get("data", {}).get("Get", {}).get("MemoryChunk", [])
        ]
        return memories
    except Exception as e:
        print(f"[VECTOR MEMORY ERROR] {e}")
        return []


# ░░░ COMBINED HELPER ░░░
async def get_full_memory(user_id: str, short_limit: int = 3, vector_k: int = 5) -> List[Dict]:
    """Fuse short-term Firestore memory with long-term vector memory (if available)."""
    short_mem = get_memory(user_id, short_limit)
    vector_mem = await get_vector_memory(user_id, vector_k)
    all_mem = short_mem + vector_mem
    all_mem.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return all_mem
