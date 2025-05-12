import firebase_admin
from firebase_admin import credentials, firestore

# ✅ Inizializza Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# 📋 Automazioni disponibili
automations = [
    {
        "id": "report_generation",
        "title": "Report settimanale",
        "description": "Invia automaticamente un report con riepilogo prenotazioni e attività.",
        "available_in": ["base", "gold"],
        "default_enabled": True
    },
    {
        "id": "pricing",
        "title": "Ottimizzazione prezzi",
        "description": "Aggiorna i prezzi dinamicamente in base alla domanda e ai competitor.",
        "available_in": ["gold"],
        "default_enabled": False
    },
    {
        "id": "checkin",
        "title": "Messaggi auto check-in",
        "description": "Invia automaticamente un messaggio di benvenuto al cliente prima dell'arrivo.",
        "available_in": ["gold"],
        "default_enabled": True
    },
    {
        "id": "cleaning_summary",
        "title": "Riepilogo pulizie",
        "description": "Invia ogni settimana un riepilogo delle pulizie da fare o già eseguite.",
        "available_in": ["base", "gold"],
        "default_enabled": True
    },
    {
        "id": "competitor_analysis",
        "title": "Analisi competitor",
        "description": "Confronta i prezzi della concorrenza e propone suggerimenti strategici.",
        "available_in": ["gold"],
        "default_enabled": False
    }
]

# 🚀 Inserimento in Firestore
for auto in automations:
    db.collection("ai_automations_catalog").document(auto["id"]).set(auto)

print("✅ Catalogo automazioni creato con successo!")
