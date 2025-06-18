// 📁 functions/lib/eventMatcher.js

/**
 * IA Event Matcher – Analizza eventi frammentati e decide se creare un'azione IA
 * Usato in Fase 2.21 per riconciliazione automatica
 */

function matchEvent({ eventType, note = "", booking = {}, customer = {} }) {
  const matches = [];

  // Esempio 1: nota con parola chiave "allarme", "furto", "problema"
  const keywords = [
    "allarme",
    "furto",
    "problema",
    "emergenza",
    "chiasso",
    "anomalia",
  ];
  for (const word of keywords) {
    if (note.toLowerCase().includes(word)) {
      matches.push({
        type: "security_alert",
        reason: `Parola chiave "${word}" trovata nella nota`,
        priority: "urgent",
      });
    }
  }

  // Esempio 2: prenotazione con richiesta speciale sensibile
  if (booking?.notes?.toLowerCase().includes("vip")) {
    matches.push({
      type: "vip_check",
      reason: "Prenotazione segnalata come VIP",
      priority: "high",
    });
  }

  // Esempio 3: inattività cliente (es. non accede da giorni)
  if (
    customer?.lastLogin &&
    Date.now() - new Date(customer.lastLogin).getTime() >
      1000 * 60 * 60 * 24 * 14
  ) {
    matches.push({
      type: "followup_required",
      reason: "Cliente inattivo da più di 14 giorni",
      priority: "normal",
    });
  }

  // Esempio 4: mancanza email / documento in prenotazione
  if (booking && (!booking.email || !booking.documentId)) {
    matches.push({
      type: "missing_data_check",
      reason: "Prenotazione incompleta (email o documento mancante)",
      priority: "normal",
    });
  }

  return matches;
}

module.exports = { matchEvent };
