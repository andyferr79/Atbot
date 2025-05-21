import firebase_admin
from firebase_admin import credentials, firestore

# ✅ Inizializza Firebase una sola volta, con credenziali corrette
if not firebase_admin._apps:
    cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# ✅ Client Firestore da usare ovunque
db = firestore.client()
