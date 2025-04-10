import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";

const DocumentsTab = ({ documents }) => {
  return (
    <ScrollArea className="hub-scroll">
      <ul className="document-list">
        {documents.map((doc) => (
          <li key={doc.id} className="document-item">
            <div className="font-medium">{doc.title}</div>
            <div className="text-sm text-muted-foreground">
              {doc.description}
            </div>
            <Button
              variant="link"
              onClick={() => window.open(doc.downloadUrl, "_blank")}
            >
              Download
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default DocumentsTab;
