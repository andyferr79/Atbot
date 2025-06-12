from fastapi import APIRouter, HTTPException, Request
from firebase_admin import firestore, auth
from datetime import datetime

router = APIRouter()
db = firestore.client()

@router.get("/admin/ia/spending-today")
async def get_today_gpt_spending(request: Request):
    try:
        token = request.headers.get("Authorization")
        if not token:
            raise HTTPException(status_code=401, detail="Token mancante")

        # 🔐 Verifica token Firebase (solo controllo ruolo "admin")
        decoded_token = auth.verify_id_token(token.replace("Bearer ", ""))
        if decoded_token.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Accesso negato")

        today = datetime.utcnow().date()
        start_ts = datetime.combine(today, datetime.min.time())
        end_ts = datetime.combine(today, datetime.max.time())

        logs_ref = db.collection("gpt_usage_logs")
        query = logs_ref.where("timestamp", ">=", start_ts).where("timestamp", "<=", end_ts)
        docs = query.stream()

        total_tokens = 0
        for doc in docs:
            data = doc.to_dict()
            total_tokens += data.get("total_tokens", 0)

        token_rate = 0.06 / 1000
        cost = round(total_tokens * token_rate, 4)

        return {
            "date": today.isoformat(),
            "total_tokens": total_tokens,
            "estimated_cost_usd": cost
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel calcolo spesa GPT: {str(e)}")
