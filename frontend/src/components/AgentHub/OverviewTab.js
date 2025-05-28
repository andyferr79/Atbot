// ✅ FILE: OverviewTab.js - con tabella Azioni + Trigger
import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ActivitySquare,
  MessageCircle,
  Bot,
  MoveRight,
  CalendarClock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const OverviewTab = ({
  actions = [],
  chatSessions = [],
  autonomyLevel = "base",
  setActiveTab,
  triggers = [],
}) => {
  const sortedActions = Array.isArray(actions)
    ? [...actions].sort(
        (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
      )
    : [];

  const latestAction = sortedActions[0];
  const nextTask = sortedActions.find((a) => a.status === "pending");

  const dateCount = {};
  const freqCount = {};

  sortedActions.forEach((action) => {
    const day = new Date(action.startedAt).toLocaleDateString("it-IT");
    dateCount[day] = (dateCount[day] || 0) + 1;
    freqCount[action.type] = (freqCount[action.type] || 0) + 1;
  });

  const graphData = Object.entries(dateCount).map(([date, count]) => ({
    date,
    count,
  }));
  const topActions = Object.entries(freqCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="overview-grid">
      {/* === Box iniziali === */}
      <Card className="hub-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">Ultima Azione</div>
            <ActivitySquare size={16} className="text-primary" />
          </div>
          <div className="text-lg font-medium">
            {latestAction ? latestAction.type : "Nessuna azione recente"}
          </div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => setActiveTab?.("actions")}
          >
            Vai alle Azioni <MoveRight size={16} className="ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">Azioni Totali</div>
            <ActivitySquare size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold">{sortedActions.length}</div>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">Chat Attive</div>
            <MessageCircle size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold">{chatSessions.length}</div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => setActiveTab?.("chat")}
          >
            Vai alle Chat <MoveRight size={16} className="ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">Modalità IA</div>
            <Bot size={16} className="text-primary" />
          </div>
          <Badge variant="default" className="text-sm capitalize">
            {autonomyLevel}
          </Badge>
        </CardContent>
      </Card>

      {/* === Box extra === */}
      <Card className="hub-card md:col-span-2">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Prossimo Task Schedulato
            </div>
            <CalendarClock size={16} className="text-primary" />
          </div>
          <div className="text-md font-medium">
            {nextTask
              ? `${nextTask.type} (${nextTask.status})`
              : "Nessun task in attesa"}
          </div>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="p-4">
          <div className="text-muted-foreground text-sm mb-2">
            Azioni più frequenti
          </div>
          <ul className="text-sm space-y-1">
            {topActions.map(([type, count], i) => (
              <li key={i} className="flex justify-between">
                <span>{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="hub-card">
        <CardContent className="p-4">
          <div className="text-muted-foreground text-sm mb-2">
            Attività IA (ultimi giorni)
          </div>
          <ResponsiveContainer width="100%" height={200} minHeight={160}>
            <BarChart data={graphData}>
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabella Ultime Azioni */}
      <Card className="hub-card md:col-span-2">
        <CardContent className="p-4">
          <div className="text-muted-foreground text-sm mb-2">
            Storico Ultime Azioni
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-1">Data</th>
                <th className="text-left p-1">Tipo</th>
                <th className="text-left p-1">Stato</th>
                <th className="text-left p-1">Output</th>
              </tr>
            </thead>
            <tbody>
              {sortedActions.slice(0, 6).map((a) => (
                <tr key={a.actionId} className="border-b last:border-none">
                  <td className="p-1">
                    {new Date(a.startedAt).toLocaleString("it-IT")}
                  </td>
                  <td className="p-1 capitalize">{a.type}</td>
                  <td className="p-1">
                    <Badge variant="outline">{a.status}</Badge>
                  </td>
                  <td className="p-1 truncate">
                    {a.output?.optimized_price
                      ? `💶 ${a.output.optimized_price} €`
                      : a.output?.message?.slice(0, 50) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tabella Trigger Recenti */}
      <Card className="hub-card md:col-span-2">
        <CardContent className="p-4">
          <div className="text-muted-foreground text-sm mb-2">
            Trigger Recenti
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-1">Trigger</th>
                <th className="text-left p-1">Next Agent</th>
                <th className="text-left p-1">Data</th>
                <th className="text-left p-1">Stato</th>
              </tr>
            </thead>
            <tbody>
              {(triggers || []).slice(0, 6).map((t, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="p-1">{t.trigger}</td>
                  <td className="p-1">{t.next_agent}</td>
                  <td className="p-1">
                    {new Date(t.createdAt?.seconds * 1000).toLocaleString(
                      "it-IT"
                    )}
                  </td>
                  <td className="p-1">
                    <Badge variant="outline">{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
