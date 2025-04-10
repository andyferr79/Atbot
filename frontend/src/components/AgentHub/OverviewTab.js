import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const OverviewTab = ({ actions, chatSessions, autonomyLevel }) => {
  const latestAction = actions[0]?.type || "No recent actions";

  return (
    <div className="overview-grid">
      <Card className="hub-card">
        <CardContent>
          Last action: <strong>{latestAction}</strong>
        </CardContent>
      </Card>
      <Card className="hub-card">
        <CardContent>
          Pending actions: <strong>{actions.length}</strong>
        </CardContent>
      </Card>
      <Card className="hub-card">
        <CardContent>
          Active chats: <strong>{chatSessions.length}</strong>
        </CardContent>
      </Card>
      <Card className="hub-card">
        <CardContent>
          AI mode: <Badge>{autonomyLevel}</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
