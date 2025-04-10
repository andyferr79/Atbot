import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";

const ActionsTab = ({ actions }) => {
  return (
    <ScrollArea className="hub-scroll">
      <ul className="action-list">
        {actions.map((action) => (
          <li key={action.actionId} className="action-item">
            <div className="font-semibold">{String(action.type)}</div>
            <div className="text-sm text-muted-foreground">
              {String(action.context?.note || "No description")}
            </div>
            <Badge
              variant={action.status === "completed" ? "default" : "outline"}
            >
              {String(action.status)}
            </Badge>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default ActionsTab;
