// 📁 E:/ATBot/frontend/src/components/AgentHub/SettingsTab.js
import React from "react";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";

const SettingsTab = ({
  autonomyLevel,
  setAutonomyLevel,
  settings,
  setSettings,
  plan,
  userId,
}) => {
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

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:8000/agent/config/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autonomyLevel,
          enabledAutomations: settings,
          plan,
        }),
      });
      alert("✅ Impostazioni salvate");
    } catch (err) {
      console.error("Errore salvataggio settings:", err);
      alert("❌ Errore durante il salvataggio delle impostazioni");
    }
  };

  return (
    <div>
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
                    {label}
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

      <Button className="mt-4" onClick={handleSave}>
        Save Settings
      </Button>
    </div>
  );
};

export default SettingsTab;
