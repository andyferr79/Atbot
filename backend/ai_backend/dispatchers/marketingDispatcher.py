from firebase_config import db
from datetime import datetime
import uuid
from dispatchers.logUtils import log_info, log_error
from dispatchers.memoryUtils import get_memory_context

async def handle(user_id: str, context: dict) -> dict:
    now = datetime.utcnow()

    try:
        structure_name = context.get("structureName", "la tua struttura")
        focus = context.get("focus", "un’offerta speciale")

        # ✅ Genera contenuto email marketing
        subject = f"Offerta esclusiva da {structure_name}"
        content = f"""
Ciao 👋

Abbiamo pensato a qualcosa di speciale per te! 🎁

Prenota ora da {structure_name} e ottieni:
✅ 10% di sconto
✅ Colazione inclusa
✅ Check-out esteso gratuito

📅 Offerta valida solo per pochi giorni!
🎯 Focus: {focus}

👉 Prenota adesso e approfitta di questa occasione.

Grazie per aver scelto {structure_name}! 💙
""".strip()

        action_id = f"marketing-{uuid.uuid4().hex[:8]}"
        action_data = {
            "actionId": action_id,
            "type": "email_marketing",
            "status": "completed",
            "priority": "normal",
            "startedAt": now,
            "completedAt": now,
            "context": {
                "structureName": structure_name,
                "focus": focus
            },
            "output": {
                "subject": subject,
                "content": content,
                "suggestedUse": "Promozione stagionale o in caso di bassa occupazione"
            }
        }

        db.collection("ai_agent_hub").document(user_id).collection("actions").document(action_id).set(action_data)

        output = {
            "status": "completed",
            "actionId": action_id,
            "subject": subject,
            "content": content
        }

        log_info(user_id, "marketingDispatcher", "email_campaign", context, output)
        return output

    except Exception as e:
        log_error(user_id, "marketingDispatcher", "email_campaign", e, context)
        return {"status": "error", "message": f"Errore dispatcher marketing: {str(e)}"}
