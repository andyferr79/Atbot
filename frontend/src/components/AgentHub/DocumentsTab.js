import React, { useState } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import "../../styles/DocumentsTab.css";

const DocumentsTab = ({ documents = [], setActiveTab }) => {
  const safeDocuments = Array.isArray(documents) ? documents : [];

  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 📁 Categorie
  const reports = safeDocuments.filter((doc) => doc.type === "report");
  const messages = safeDocuments.filter((doc) => doc.type === "message");
  const suggestions = safeDocuments.filter((doc) => doc.type === "suggestion");
  const others = safeDocuments.filter(
    (doc) => !["report", "message", "suggestion"].includes(doc.type)
  );

  // 🔠 Raggruppa messaggi per cliente
  const groupByCustomer = (docs) => {
    const grouped = {};
    for (const doc of docs) {
      const key = doc.customer_id || "Sconosciuto";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(doc);
    }
    return grouped;
  };

  const renderSection = (title, sectionKey, docs, renderGroupFn = null) => {
    if (docs.length === 0) return null;
    return (
      <div className="document-section">
        <div
          className={`section-header ${
            expandedSections[sectionKey] ? "open" : ""
          }`}
          onClick={() => toggleSection(sectionKey)}
        >
          {expandedSections[sectionKey] ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
          <span>{title}</span>
        </div>
        {expandedSections[sectionKey] && (
          <ul className="document-list">
            {renderGroupFn
              ? renderGroupFn(docs)
              : docs.map((doc) => (
                  <li key={doc.documentId} className="document-item">
                    <div className="font-medium">
                      📄 {doc.title || doc.documentId}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      📅 {formatDate(doc.generatedAt)}
                    </div>
                    {doc.downloadUrl && (
                      <Button
                        variant="link"
                        onClick={() => window.open(doc.downloadUrl, "_blank")}
                      >
                        Download
                      </Button>
                    )}
                  </li>
                ))}
          </ul>
        )}
      </div>
    );
  };

  const renderGroupedMessages = (docs) => {
    const groups = groupByCustomer(docs);
    return Object.entries(groups).map(([customerId, customerDocs]) => (
      <li key={customerId} className="document-item">
        <div className="font-semibold">
          👤 Cliente: {customerDocs[0].customer_name || customerId}
        </div>
        <ul className="ml-4 mt-1 space-y-1">
          {customerDocs.map((doc) => (
            <li key={doc.documentId} className="text-sm text-muted-foreground">
              📨 {doc.title || "Messaggio"} – {formatDate(doc.generatedAt)}
            </li>
          ))}
        </ul>
      </li>
    ));
  };

  return (
    <ScrollArea className="hub-scroll space-y-6 p-2">
      {renderSection("📊 Report Generati", "reports", reports)}
      {renderSection(
        "📬 Messaggi ai Clienti",
        "messages",
        messages,
        renderGroupedMessages
      )}
      {renderSection("💡 Suggerimenti dell’agente", "suggestions", suggestions)}
      {renderSection("📁 Altri documenti", "others", others)}
      {safeDocuments.length === 0 && (
        <div className="text-muted-foreground text-sm px-4 py-2">
          Nessun documento disponibile.
        </div>
      )}
    </ScrollArea>
  );
};

export default DocumentsTab;
