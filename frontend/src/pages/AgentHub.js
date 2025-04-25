import React, { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Settings, Bot } from "lucide-react";
import OverviewTab from "../components/AgentHub/OverviewTab";
import ActionsTab from "../components/AgentHub/ActionsTab";
import ChatTab from "../components/AgentHub/ChatTab";
import DocumentsTab from "../components/AgentHub/DocumentsTab";
import "../styles/AgentHub.css";

const AgentHub = () => {
  const [userId, setUserId] = useState(null);
  const [actions, setActions] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [autonomyLevel, setAutonomyLevel] = useState("base");
  const [settings, setSettings] = useState({});
  const [plan, setPlan] = useState("BASE");

  const automations = [
    {
      key: "welcomeMessage",
      label: "Automatic check-in message",
      plan: "BASE",
    },
    {
      key: "autoReport",
      label: "Automatic performance report generation",
      plan: "BASE",
    },
    { key: "smartSuggestions", label: "Smart suggestions", plan: "GOLD" },
    { key: "autoCheckin", label: "Complete AI Auto Check-in", plan: "GOLD" },
    {
      key: "cleaningReminder",
      label: "Free room cleaning reminder",
      plan: "BASE",
    },
    {
      key: "bookingConfirm",
      label: "Automatic booking confirmation",
      plan: "BASE",
    },
    { key: "autoArchiveChats", label: "Auto archive chats", plan: "BASE" },
    {
      key: "offerSuggestions",
      label: "Offer suggestions (manual)",
      plan: "BASE",
    },
    { key: "weeklySummary", label: "Weekly summary email", plan: "BASE" },
    {
      key: "autoCleaningSchedule",
      label: "Staff cleaning schedule (AI)",
      plan: "GOLD",
    },
    { key: "lastminuteOffersAi", label: "Last minute AI offers", plan: "GOLD" },
    {
      key: "competitorAnalysis",
      label: "OTA competitor analysis",
      plan: "GOLD",
    },
    { key: "socialPostAi", label: "AI social post generation", plan: "GOLD" },
    { key: "reviewAnalysis", label: "Customer review analysis", plan: "GOLD" },
  ];

  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    if (uid) setUserId(uid);
    else console.error("⚠ Nessun user_id trovato. L'utente non è autenticato.");
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/chat_sessions/${userId}`)
      .then((res) => res.json())
      .then((data) => setChatSessions(data))
      .catch((err) => console.error("❌ Error loading chat:", err));

    fetch(`/api/agent/actions/${userId}`)
      .then((res) => res.json())
      .then((data) => setActions(data))
      .catch((err) => console.error("❌ Error loading actions:", err));

    fetch(`/api/agent/documents/${userId}`)
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error("❌ Error loading documents:", err));

    fetch(`/api/agent/config/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setAutonomyLevel(data.autonomyLevel || "base");
        setSettings(data.enabledAutomations || {});
        setPlan(data.plan || "BASE");
      })
      .catch((err) => console.error("❌ Error loading config:", err));
  }, [userId]);

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
      console.error("Archive error:", err);
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await fetch(`/api/chat_sessions/${sessionId}`, { method: "DELETE" });
      setChatSessions((prev) =>
        prev.filter((chat) => chat.sessionId !== sessionId)
      );
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (!userId) return null;

  return (
    <div className="agent-hub-container">
      <div className="hub-header-container">
        <h1 className="hub-title">AI Agent HUB</h1>
        <p className="hub-subtitle">
          Manage all your AI functions with one click.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="hub-tabs-list">
          <TabsTrigger value="overview">
            <Bot className="icon" /> Overview
          </TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="icon" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            actions={actions}
            chatSessions={chatSessions}
            autonomyLevel={autonomyLevel}
          />
        </TabsContent>

        <TabsContent value="actions">
          <ActionsTab actions={actions} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatTab
            chatSessions={chatSessions}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab documents={documents} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="mb-4">
            <h2 className="hub-settings-title">Autonomy Level</h2>
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
            <div className="hub-card">
              <div className="card-content space-y-3">
                {automations.map(({ key, label, plan: requiredPlan }) => {
                  const isDisabled = requiredPlan === "GOLD" && plan === "BASE";
                  return (
                    <div key={key} className="hub-toggle-row">
                      <span>
                        {label}{" "}
                        {isDisabled && (
                          <Badge variant="outline" className="ml-2">
                            Gold
                          </Badge>
                        )}
                      </span>
                      <Switch
                        checked={!!settings[key]}
                        onCheckedChange={(val) =>
                          setSettings((prev) => ({ ...prev, [key]: val }))
                        }
                        disabled={isDisabled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            className="mt-4"
            onClick={() => {
              fetch(`/api/agent/config/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  autonomyLevel,
                  enabledAutomations: settings,
                  plan,
                }),
              });
            }}
          >
            Save Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentHub;
