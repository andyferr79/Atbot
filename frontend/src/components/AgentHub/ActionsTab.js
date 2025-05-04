import React, { useState } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CheckCircle, Clock, XCircle, Bot, Trash2 } from "lucide-react";
import "../../styles/ActionsTab.css"; // ✅ CSS dedicato

const statusIcon = {
  completed: <CheckCircle size={16} className="text-green-600" />,
  pending: <Clock size={16} className="text-yellow-500" />,
  error: <XCircle size={16} className="text-red-500" />,
};

const formatDate = (isoDate) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleString("it-IT");
};

const ActionsTab = ({ actions, setActiveTab, setActions }) => {
  const userId = localStorage.getItem("user_id");
  const [expanded, setExpanded] = useState({});

  const handleDispatchPricing = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/autotaskerbot/us-central1/dispatchAgentAction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            intent: "pricing",
            context: {
              user_id: userId,
              property_id: "demo-property",
              current_price: 120,
              occupancy_rate: 0.7,
              competitor_prices: [115, 123, 130],
              seasonality_factor: 1.1,
            },
          }),
        }
      );

      const data = await res.json();
      alert("✅ Dispatch completato: " + data.message);
      if (typeof setActiveTab === "function") {
        setTimeout(() => setActiveTab("documents"), 300);
      }
    } catch (err) {
      console.error("❌ Errore dispatch pricing:", err);
      alert("Errore invio dispatch");
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa azione IA?"))
      return;
    try {
      await fetch(`http://localhost:8000/agent/actions/${userId}/${actionId}`, {
        method: "DELETE",
      });
      setActions((prev) => prev.filter((a) => a.actionId !== actionId));
    } catch (err) {
      console.error("❌ Errore eliminazione azione:", err);
      alert("Errore durante l'eliminazione dell'azione");
    }
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <ScrollArea className="hub-scroll space-y-6">
      <div className="text-right">
        <Button onClick={handleDispatchPricing}>
          🧪 Test Dispatch → AI Pricing
        </Button>
      </div>

      <ul className="space-y-4">
        {actions && actions.length > 0 ? (
          actions
            .sort(
              (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
            )
            .map((action) => (
              <li
                key={action.actionId}
                className={`action-item ${action.status || "pending"}`}
              >
                <div className="action-header">
                  <div className="flex items-center gap-2">
                    <Bot size={16} />
                    <span className="capitalize">{action.type}</span>
                  </div>
                  <div className="action-status">
                    {statusIcon[action.status] || <Clock size={16} />}
                    <Badge
                      variant={
                        action.status === "completed" ? "default" : "outline"
                      }
                    >
                      {action.status}
                    </Badge>
                    <Trash2
                      size={16}
                      className="text-red-500 cursor-pointer"
                      onClick={() => handleDeleteAction(action.actionId)}
                    />
                  </div>
                </div>
                <div className="action-meta">
                  Avviata il {formatDate(action.startedAt)}
                </div>

                {action.output?.optimized_price && (
                  <div className="action-output">
                    💰 Prezzo ottimizzato:{" "}
                    <span className="highlight">
                      {action.output.optimized_price} €
                    </span>
                  </div>
                )}

                {action.output?.preview && (
                  <div>
                    <div
                      className={`action-output preview ${
                        expanded[action.actionId]
                          ? "collapsible expanded"
                          : "collapsible"
                      }`}
                    >
                      📨 {action.output.preview}
                    </div>
                    {action.output.preview.length > 250 && (
                      <span
                        className="show-more"
                        onClick={() => toggleExpanded(action.actionId)}
                      >
                        {expanded[action.actionId]
                          ? "Mostra meno ▲"
                          : "Mostra tutto ▼"}
                      </span>
                    )}
                  </div>
                )}

                {action.output?.title && (
                  <div className="action-output">
                    📄 Report:{" "}
                    <span className="highlight">{action.output.title}</span>
                  </div>
                )}
              </li>
            ))
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Nessuna azione IA trovata.
          </div>
        )}
      </ul>
    </ScrollArea>
  );
};

export default ActionsTab;
