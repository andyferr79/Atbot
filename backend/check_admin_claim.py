import firebase_admin
from firebase_admin import auth, credentials

# Percorso del tuo file serviceAccountKey.json
cred = credentials.Certificate("E:/ATBot/backend/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# UID della tua email personale da verificare
uid = "KNS0oo06pLbdXoK1mwqSQUCMdLO2"

# Recupera l'utente da Firebase
user = auth.get_user(uid)
print("✅ CLAIM ATTUALI:", user.custom_claims)

# Se non c'è il ruolo admin, lo assegna
if not user.custom_claims or user.custom_claims.get("role") != "admin":
    auth.set_custom_user_claims(uid, {"role": "admin"})
    print("🔐 Ruolo admin assegnato con successo!")
else:
    print("✅ L'utente ha già il ruolo admin.")
