# ✅ FILE: supportTicketMonitor.py

from firebase_admin import firestore
from datetime import datetime
import firebase_admin

# ⚙️ Inizializza Firebase se non è già inizializzato
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# 📥 Salva notifica in Firestore (visibile in Admin Dashboard)
def notify_admin_firestore(ticket):
    db.collection("admin_alerts").add({
        "type": "ticket_overdue",
        "timestamp": datetime.utcnow(),
        "ticket_id": ticket["ticket_id"],
        "user_id": ticket["user_id"],
        "message": f"⏰ Ticket urgente scaduto: {ticket['issue']}",
        "priority": ticket.get("priority", "media"),
        "status": "unread"
    })

# 🔍 Verifica ticket urgenti non gestiti entro 30 minuti
def check_overdue_tickets():
    now = datetime.utcnow()
    tickets_ref = db.collection("support_tickets")
    query = tickets_ref.where("priority", "==", "alta").where("handled", "==", False)
    results = query.stream()

    overdue_found = False

    for doc in results:
        data = doc.to_dict()
        deadline = data.get("deadlineAt")
        if deadline and deadline < now:
            notify_admin_firestore(data)
            overdue_found = True
            print(f"📌 Ticket {data['ticket_id']} scaduto salvato in admin_alerts")

    if not overdue_found:
        print("✅ Nessun ticket urgente scaduto trovato.")

# ✅ Esegui manualmente o schedula via cron
if __name__ == "__main__":
    check_overdue_tickets()
