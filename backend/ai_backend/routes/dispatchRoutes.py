from fastapi import APIRouter, Request
from dispatchers import (
    autopilotDispatcher,
    pricingDispatcher,
    checkinDispatcher,
    reportDispatcher,
    cleaningDispatcher,
    upsellDispatcher,
    eventDispatcher,
    faqDispatcher,
    alertDispatcher,
    securityDispatcher,
    insightDispatcher
)

DISPATCHER_MAP = {
    "autopilot": autopilotDispatcher,
    "pricing": pricingDispatcher,
    "checkin": checkinDispatcher,
    "report": reportDispatcher,
    "cleaning": cleaningDispatcher,
    "upsell": upsellDispatcher,
    "event": eventDispatcher,
    "faq": faqDispatcher,
    "alert": alertDispatcher,
    "security": securityDispatcher,
    "insight": insightDispatcher
}

router = APIRouter()

@router.post("/agent/dispatch")
async def dispatch_agent(request: Request):
    payload = await request.json()
    intent = payload.get("intent")
    dispatcher = DISPATCHER_MAP.get(intent)

    if dispatcher:
        return await dispatcher.handle(payload)
    else:
        return {"status": "error", "message": f"Intent non gestito: {intent}"}
