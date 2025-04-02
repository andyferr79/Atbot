import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Archive, Trash2, Settings, Bot } from "lucide-react";
import "../styles/AgentHub.css";

const AgentHub = () => {
  const [actions, setActions] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [autonomyLevel, setAutonomyLevel] = useState("base");
  const [settings, setSettings] = useState({});
  const userId = "test-user-001";

  useEffect(() => {
    fetch(`/api/chat_sessions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ chatSessions:", data);
        setChatSessions(data);
      })
      .catch((err) => console.error("❌ Errore caricamento chat:", err));

    fetch(`/api/agent/actions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ actions:", data);
        setActions(data);
      })
      .catch((err) => console.error("❌ Errore caricamento azioni:", err));

    fetch(`/api/agent/documents/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ documents:", data);
        setDocuments(data);
      })
      .catch((err) => console.error("❌ Errore caricamento documenti:", err));
  }, []);

  const handleArchive = async (sessionId) => {
    try {
      await fetch(`/api/chat_sessions/${sessionId}/archive`, {
        method: "POST",
      });
      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.sessionId === sessionId ? { ...chat, status: "archived" } : chat
        )
      );
    } catch (err) {
      console.error("Errore archiviazione:", err);
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await fetch(`/api/chat_sessions/${sessionId}`, {
        method: "DELETE",
      });
      setChatSessions((prev) =>
        prev.filter((chat) => chat.sessionId !== sessionId)
      );
    } catch (err) {
      console.error("Errore eliminazione:", err);
    }
  };

  return (
    <div className="agent-hub-container">
      <div className="hub-header-container">
        <h1 className="hub-title">HUB Agente IA</h1>
        <p className="hub-subtitle">
          Gestisci tutte le funzioni della tua IA con un solo click.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="hub-tabs-list">
          <TabsTrigger value="overview">
            <Bot className="icon" /> Panoramica
          </TabsTrigger>
          <TabsTrigger value="actions">Azioni</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documenti</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="icon" /> Impostazioni
          </TabsTrigger>
        </TabsList>

        {/* PANORAMICA */}
        <TabsContent value="overview">
          <div className="overview-grid">
            <Card className="hub-card">
              <CardContent>
                Ultima azione: <strong>Report Settimanale</strong>
              </CardContent>
            </Card>
            <Card className="hub-card">
              <CardContent>
                Azioni pendenti: <strong>{actions.length}</strong>
              </CardContent>
            </Card>
            <Card className="hub-card">
              <CardContent>
                Chat attive: <strong>{chatSessions.length}</strong>
              </CardContent>
            </Card>
            <Card className="hub-card">
              <CardContent>
                Modalità IA: <Badge>{String(autonomyLevel)}</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AZIONI */}
        <TabsContent value="actions">
          <ScrollArea className="hub-scroll">
            <ul className="action-list">
              {actions.map((action) => {
                try {
                  return (
                    <li key={action.actionId} className="action-item">
                      <div className="font-semibold">{String(action.type)}</div>
                      <div className="text-sm text-muted-foreground">
                        {String(action.context?.note || "Nessuna descrizione")}
                      </div>
                      <Badge
                        variant={
                          action.status === "completed" ? "default" : "outline"
                        }
                      >
                        {String(action.status)}
                      </Badge>
                    </li>
                  );
                } catch (e) {
                  console.error("🔥 ERRORE render action:", action, e);
                  return null;
                }
              })}
            </ul>
          </ScrollArea>
        </TabsContent>

        {/* CHAT */}
        <TabsContent value="chat">
          <ScrollArea className="hub-scroll">
            <ul className="chat-list">
              {chatSessions.map((chat) => {
                try {
                  return (
                    <li key={chat.sessionId} className="chat-item">
                      <div>
                        <div className="font-medium">{String(chat.title)}</div>
                        <div className="text-sm text-muted-foreground">
                          {String(chat.summary)}
                        </div>
                      </div>
                      <div className="chat-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(chat.sessionId)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(chat.sessionId)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </li>
                  );
                } catch (e) {
                  console.error("🔥 ERRORE render chat:", chat, e);
                  return null;
                }
              })}
            </ul>
          </ScrollArea>
        </TabsContent>

        {/* DOCUMENTI */}
        <TabsContent value="documents">
          <ScrollArea className="hub-scroll">
            <ul className="document-list">
              {documents.map((doc) => {
                try {
                  return (
                    <li key={doc.id} className="document-item">
                      <div className="font-medium">{String(doc.title)}</div>
                      <div className="text-sm text-muted-foreground">
                        {String(doc.description)}
                      </div>
                      <Button
                        variant="link"
                        onClick={() => window.open(doc.downloadUrl, "_blank")}
                      >
                        Scarica
                      </Button>
                    </li>
                  );
                } catch (e) {
                  console.error("🔥 ERRORE render document:", doc, e);
                  return null;
                }
              })}
            </ul>
          </ScrollArea>
        </TabsContent>

        {/* IMPOSTAZIONI */}
        <TabsContent value="settings">
          <div className="mb-4">
            <h2 className="hub-settings-title">Livello di Autonomia</h2>
            <div className="flex gap-4">
              <Badge
                variant={autonomyLevel === "base" ? "default" : "outline"}
                onClick={() => setAutonomyLevel("base")}
                className="cursor-pointer"
              >
                Base
              </Badge>
              <Badge
                variant={autonomyLevel === "gold" ? "default" : "outline"}
                onClick={() => setAutonomyLevel("gold")}
                className="cursor-pointer"
              >
                Gold
              </Badge>
            </div>
          </div>
          <div className="grid gap-4">
            <Card className="hub-card">
              <CardContent className="space-y-3">
                <div className="hub-toggle-row">
                  <span>Messaggio automatico al check-in</span>
                  <Switch
                    checked={settings.welcomeMessage}
                    onCheckedChange={() =>
                      setSettings((s) => ({
                        ...s,
                        welcomeMessage: !s.welcomeMessage,
                      }))
                    }
                  />
                </div>
                <div className="hub-toggle-row">
                  <span>Generazione automatica report performance</span>
                  <Switch
                    checked={settings.autoReport}
                    onCheckedChange={() =>
                      setSettings((s) => ({
                        ...s,
                        autoReport: !s.autoReport,
                      }))
                    }
                  />
                </div>
                {autonomyLevel === "gold" && (
                  <div className="hub-toggle-row">
                    <span>Invio suggerimenti personalizzati</span>
                    <Switch
                      checked={settings.smartSuggestions}
                      onCheckedChange={() =>
                        setSettings((s) => ({
                          ...s,
                          smartSuggestions: !s.smartSuggestions,
                        }))
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentHub;
