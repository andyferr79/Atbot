// 📁 functions/lib/generateDocumentTags.js

function generateDocumentTags({ type, content = "", clientName = "" }) {
  const tags = [];

  // Tipo di documento
  if (type) tags.push(type.toLowerCase());

  // Parole chiave nel contenuto
  const keywords = [
    "spa",
    "colazione",
    "late check-out",
    "e-bike",
    "upsell",
    "automazione",
  ];
  for (const word of keywords) {
    if (content.toLowerCase().includes(word)) {
      tags.push(word.toLowerCase().replace(/\s+/g, "-"));
    }
  }

  // Aggiungi "pdf" se è un documento PDF o simulato
  if (
    content.toLowerCase().includes("pdf") ||
    content.toLowerCase().includes("report")
  ) {
    tags.push("pdf");
  }

  // Aggiunta tag automazione se non presente
  tags.push("automazione");

  return Array.from(new Set(tags)); // Rimuove duplicati
}

module.exports = { generateDocumentTags };
