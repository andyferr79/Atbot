# ✅ FILE: dispatchers/supportDispatcher.py

from firebase_admin import firestore
from datetime import datetime, timedelta
import openai
import uuid

# 🔐 Chiavi e modelli OpenAI
openai.api_key = "sk-..."  # Sostituisci con la tua key reale o importa da settings.py
MODEL = "gpt-4"

# 🔄 Fallback automatici (espansi)
FALLBACKS = {
    "problemi login": "Effettua logout e login. Se persiste, svuota la cache del browser.",
    "fatturazione": "Accedi alla sezione 'Fatture' del tuo profilo o scrivici per assistenza.",
    "domande generali": "Puoi consultare la sezione FAQ. Vuoi che te la apra?",
    "backup": "Vai in Impostazioni → Sicurezza per i backup. Vuoi un check ora?",
    "ota non sincronizzate": "Verifica la connessione con le OTA nella sezione Channel Manager.",
    "errore dashboard": "Potrebbe trattarsi di un problema temporaneo. Stiamo verificando.",
    "non arrivano email": "Controlla la cartella spam. Vuoi che ti invii nuovamente la mail?",
    "problemi check-in": "Verifica se l’ospite è stato registrato correttamente e i codici accesso sono attivi.",
    "crm non funziona": "Controlla se hai selezionato un cliente. Vuoi che ti apra la sezione CRM?",
    "chat ia bloccata": "L’agente IA potrebbe essere occupato. Riprova tra qualche secondo.",
    "grafici non caricati": "Potrebbe esserci un problema di rete. Stiamo monitorando.",
    "password dimenticata": "Usa la funzione 'Password dimenticata' dalla schermata di login.",
    "problema automazione": "Controlla la sezione Scheduler per stato e log del task.",
    "up-sell non attivo": "Verifica se è abilitato nelle impostazioni del piano Gold.",
    "channel manager errore": "Assicurati che le camere siano correttamente mappate con le OTA.",
    "codici accesso non inviati": "Controlla che la prenotazione sia completa e i dati ospite corretti.",
    "analisi ia errata": "L’agente può aver usato dati incompleti. Puoi aggiornarli manualmente.",
    "problema sincronizzazione": "La sincronizzazione potrebbe impiegare alcuni minuti. Attendi e riprova.",
}

# ⚙️ Analisi automatica della priorità
def classify_priority(issue: str) -> str:
    issue = issue.lower()
    if any(kw in issue for kw in ["login", "errore", "bloccato", "non accede", "non funziona", "check-in", "pagamento", "accesso"]):
        return "alta"
    if any(kw in issue for kw in ["ota", "sincronizzazione", "email", "grafico", "backup"]):
        return "media"
    return "bassa"

# 📥 Funzione principale dell'agente di supporto
async def handle(user_id: str, context: dict):
    db = firestore.client()
    now = datetime.utcnow()
    support_id = str(uuid.uuid4())

    issue = context.get("message", "").lower()
    priority = classify_priority(issue)

    # 🔍 Fallback statico
    for keyword, reply in FALLBACKS.items():
        if keyword in issue:
            _log_ticket(db, user_id, support_id, issue, reply, handled=True, method="fallback", priority=priority)
            return {
                "status": "completed",
                "handledBy": "fallback",
                "response": reply,
                "ticketId": support_id
            }

    # 🧠 Risposta AI
    try:
        messages = [
            {"role": "system", "content": "Sei un assistente supporto tecnico per utenti SaaS. Non fornire spiegazioni tecniche dettagliate se non richieste."},
            {"role": "user", "content": issue}
        ]

        completion = openai.ChatCompletion.create(
            model=MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=400
        )

        response = completion.choices[0].message["content"]
        _log_ticket(db, user_id, support_id, issue, response, handled=True, method="gpt", priority=priority)

        return {
            "status": "completed",
            "handledBy": "gpt",
            "response": response,
            "ticketId": support_id
        }

    except Exception as e:
        fallback_msg = "Al momento non riesco a risolvere il problema. Ti ricontatteremo a breve con una soluzione."
        _log_ticket(db, user_id, support_id, issue, fallback_msg, handled=False, method="fallback_error", error=str(e), priority=priority)

        return {
            "status": "error",
            "handledBy": "fallback_error",
            "response": fallback_msg,
            "ticketId": support_id,
            "error": str(e)
        }

# 📝 Log su Firestore con distinzione ADMIN / USER e deadline urgenti
def _log_ticket(db, user_id, ticket_id, issue, response, handled=True, method="fallback", error=None, priority="media"):
    deadline = datetime.utcnow() + timedelta(minutes=30) if priority == "alta" else None

    db.collection("support_tickets").document(ticket_id).set({
        "user_id": user_id,
        "ticket_id": ticket_id,
        "issue": issue,
        "response": response,
        "handled": handled,
        "error": error,
        "priority": priority,
        "method": method,
        "createdAt": datetime.utcnow(),
        "deadlineAt": deadline,
        "admin_notes": {
            "raw_issue": issue,
            "method": method,
            "error": error,
            "handled": handled,
            "context_priority": priority
        }
    })
