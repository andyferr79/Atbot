# ✅ FILE: dispatchers/__init__.py

from .pricingDispatcher import handle as pricing_handler
from .checkinDispatcher import handle as checkin_handler
from .reportDispatcher import handle as report_handler
from .upsellDispatcher import handle as upsell_handler  # ✅ Nuovo agente up-sell

# 🔁 Mappa centrale degli intent → handler dell’agente specializzato
AGENT_DISPATCH_MAP = {
    "pricing": pricing_handler,
    "checkin": checkin_handler,
    "report": report_handler,
    "upsell": upsell_handler  # ✅ Mappato nuovo intent 'upsell'
}
