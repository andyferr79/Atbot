import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const OverviewTab = ({
  actions = [],
  chatSessions = [],
  autonomyLevel = "base",
  setActiveTab,
}) => {
  const sortedActions = Array.isArray(actions)
    ? [...actions].sort(
        (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
      )
    : [];

  const latestAction = sortedActions[0];

  return (
    <div className="overview-grid">
      <Card className="hub-card">
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Ultima Azione</div>
          <div className="font-medium">
            {latestAction ? latestAction.type : "Nessuna azione recente"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab?.("actions")}
          >
            Vai alle Azioni
          </Button>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Azioni Totali</div>
          <div className="text-lg font-semibold">{sortedActions.length}</div>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Chat Attive</div>
          <div className="text-lg font-semibold">{chatSessions.length}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab?.("chat")}
          >
            Vai alle Chat
          </Button>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Modalità IA</div>
          <Badge variant="default" className="text-sm capitalize">
            {autonomyLevel}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
