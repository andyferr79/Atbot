import React, { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Settings, Bot } from "lucide-react";
import OverviewTab from "../components/AgentHub/OverviewTab";
import ActionsTab from "../components/AgentHub/ActionsTab";
import ChatTab from "../components/AgentHub/ChatTab";
import DocumentsTab from "../components/AgentHub/DocumentsTab";
import SettingsTab from "../components/AgentHub/SettingsTab";
import ScheduledTasksTab from "../components/AgentHub/ScheduledTasksTab";
import StructureProfileForm from "../components/AgentHub/StructureProfileForm";
import "../styles/AgentHub.css";

const AgentHub = () => {
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actions, setActions] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [autonomyLevel, setAutonomyLevel] = useState("base");
  const [settings, setSettings] = useState({});
  const [plan, setPlan] = useState("BASE");

  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    if (uid) setUserId(uid);
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:8000/chat_sessions/${userId}`)
      .then((res) => res.json())
      .then(setChatSessions)
      .catch((err) => console.error("❌ Error loading chat:", err));

    fetch(`http://localhost:8000/agent/actions/${userId}`)
      .then((res) => res.json())
      .then(setActions)
      .catch((err) => console.error("❌ Error loading actions:", err));

    fetch(`http://localhost:8000/agent/documents/${userId}`)
      .then((res) => res.json())
      .then(setDocuments)
      .catch((err) => console.error("❌ Error loading documents:", err));

    fetch(`http://localhost:8000/agent/config/${userId}`)
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
      await fetch(`http://localhost:8000/chat_sessions/${sessionId}/archive`, {
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
      await fetch(`http://localhost:8000/chat_sessions/${sessionId}`, {
        method: "DELETE",
      });
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hub-tabs-list">
          <TabsTrigger value="overview">
            <Bot className="icon" /> Overview
          </TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="structure">Profilo</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="icon" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            actions={actions}
            chatSessions={chatSessions}
            autonomyLevel={autonomyLevel}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="actions">
          <ActionsTab actions={actions} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatTab
            chatSessions={chatSessions}
            onArchive={handleArchive}
            onDelete={handleDelete}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab documents={documents} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="scheduler">
          <ScheduledTasksTab />
        </TabsContent>

        <TabsContent value="structure">
          <StructureProfileForm />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab
            autonomyLevel={autonomyLevel}
            setAutonomyLevel={setAutonomyLevel}
            settings={settings}
            setSettings={setSettings}
            plan={plan}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentHub;
