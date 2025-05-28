# ✅ FILE: dispatchers/insightDispatcher.py (ULTRA OPTIMIZED V2)

from firebase_config import db
from datetime import datetime
from uuid import uuid4
import openai
import os
import re

# ✅ Configura OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OPENAI_API_KEY mancante")
client = openai.OpenAI(api_key=openai_api_key)

# 🔍 Riassume documenti
def summarize_docs(docs, limit=5):
    return "\n".join([
        f"- {d.to_dict().get('type', 'doc')} | {d.to_dict().get('content', '')[:60]}..."
        for d in list(docs)[:limit]
    ])

# 🔍 Classificazione dell'insight
def classify_insight(text: str) -> str:
    t = text.lower()
    if any(x in t for x in ["aumentare", "migliorare", "ottimizzare"]):
        return "opportunity"
    if any(x in t for x in ["problema", "rischio", "critico", "errore"]):
        return "warning"
    if any(x in t for x in ["organizzazione", "efficienza", "turni"]):
        return "operational"
    return "strategic"

# 🔍 Classificazione severità (in base al contenuto feedback/eventi)
def detect_severity(feedback_texts: list, insight_text: str) -> str:
    negatives = ["sporco", "ritardo", "problema", "lamentela", "caos"]
    count = sum(1 for f in feedback_texts for word in negatives if word in f.lower())
    if count >= 3 or "urgente" in insight_text.lower():
        return "high"
    elif count == 2:
        return "medium"
    return "low"

# 🔍 Estrazione raccomandazioni
def extract_next_steps(text: str):
    match = re.findall(r"(?i)(?:consigliato|dovresti|\u00e8 utile|si suggerisce|\u00e8 opportuno).*?[\.]", text)
    return match[:3] if match else []

# 🔍 Suggerimento agenti
def suggest_agents(text: str, note: str) -> list:
    suggestions = []
    if "occupazione" in text or "occupazione" in note:
        suggestions.append("pricing")
    if "pulizia" in text or "sporco" in note:
        suggestions.append("cleaning")
    if "conversione" in text or "pochi clienti" in text:
        suggestions.append("marketing")
    return suggestions

# ✅ Funzione principale
async def handle(user_id: str, context: dict):
    try:
        now = datetime.utcnow()
        action_id = str(uuid4())
        note = context.get("note", "")

        base_ref = db.collection("ai_agent_hub").document(user_id)
        profile_doc = base_ref.collection("properties").document("main").get()
        profile = profile_doc.to_dict() if profile_doc.exists else {}

        actions = base_ref.collection("actions").order_by("startedAt", direction=db.Query.DESCENDING).limit(5).stream()
        events = base_ref.collection("events").order_by("createdAt", direction=db.Query.DESCENDING).limit(5).stream()
        feedbacks_stream = base_ref.collection("feedback").stream()
        documents = base_ref.collection("documents").order_by("generatedAt", direction=db.Query.DESCENDING).limit(5).stream()

        feedbacks = list(feedbacks_stream)
        feedback_texts = [fb.to_dict().get("comment", "") for fb in feedbacks]

        prompt = f"""
Sei un analista IA esperto nel settore hospitality.
Profilo struttura: {profile}
Ultime Azioni IA:\n{summarize_docs(actions)}
Eventi Recenti:\n{summarize_docs(events)}
Feedback Recenti:\n{summarize_docs(feedbacks)}
Documenti Generati:\n{summarize_docs(documents)}
"""
        if note:
            prompt += f"\nNota dal gestore: {note}"
        prompt += "\nFornisci un insight strategico per ottimizzare la struttura."

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sei un analista strategico alberghiero."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )

        insight = response.choices[0].message.content.strip()
        category = classify_insight(insight)
        severity = detect_severity(feedback_texts, insight)
        next_steps = extract_next_steps(insight)
        agents_to_trigger = suggest_agents(insight, note)

        # 🔁 Check duplicati recenti
        recent_insights = base_ref.collection("insights_from_agents").order_by("timestamp", direction=db.Query.DESCENDING).limit(10).stream()
        duplicates = [doc for doc in recent_insights if insight[:50] in doc.to_dict().get("comment", "")[:70]]
        is_duplicate = len(duplicates) > 0

        # 🎯 Calcolo priorità
        priority_score = 50
        if severity == "high": priority_score += 25
        if category == "opportunity": priority_score += 15
        if len(next_steps) >= 2: priority_score += 10
        priority_score = min(priority_score, 100)

        # 📦 Salva insight e azione
        insight_data = {
            "source_agent": "insightDispatcher",
            "comment": insight,
            "note": note,
            "category": category,
            "severity": severity,
            "recommendations": next_steps,
            "agents_to_trigger": agents_to_trigger,
            "priority_score": priority_score,
            "duplicate": is_duplicate,
            "timestamp": now
        }

        base_ref.collection("insights_from_agents").document(action_id).set(insight_data)
        base_ref.collection("actions").document(action_id).set({
            "actionId": action_id,
            "type": "insight",
            "status": "completed",
            "startedAt": now,
            "completedAt": now,
            "context": context,
            "output": insight_data
        })

        return {
            "status": "completed",
            "insight": insight,
            "category": category,
            "severity": severity,
            "priority_score": priority_score,
            "recommendations": next_steps,
            "agents_to_trigger": agents_to_trigger,
            "duplicate": is_duplicate,
            "actionId": action_id
        }

    except Exception as e:
        return {
            "status": "error",
            "message": "❌ Errore generazione insight",
            "error": str(e)
        }
