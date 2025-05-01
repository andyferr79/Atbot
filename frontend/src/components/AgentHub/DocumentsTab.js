import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";

const DocumentsTab = ({ documents = [], setActiveTab }) => {
  const safeDocuments = Array.isArray(documents) ? documents : [];

  return (
    <ScrollArea className="hub-scroll">
      <ul className="document-list">
        {safeDocuments.length > 0 ? (
          safeDocuments.map((doc) => (
            <li key={doc.id || doc.reportId} className="document-item">
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-muted-foreground">
                {doc.description || "Documento generato dall'agente IA"}
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
          ))
        ) : (
          <div className="text-muted-foreground text-sm px-4 py-2">
            Nessun documento disponibile.
          </div>
        )}
      </ul>
    </ScrollArea>
  );
};

export default DocumentsTab;
