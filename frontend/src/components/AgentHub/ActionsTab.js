import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CheckCircle, Clock, XCircle, Bot } from "lucide-react";

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

const ActionsTab = (props) => {
  const { actions, setActiveTab } = props;
  const userId = localStorage.getItem("user_id");

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

      // ⏩ Passa alla tab "documents"
      if (typeof setActiveTab === "function") {
        setTimeout(() => setActiveTab("documents"), 300);
      }
    } catch (err) {
      console.error("❌ Errore dispatch pricing:", err);
      alert("Errore invio dispatch");
    }
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
                className="action-item p-3 border rounded-md"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Bot size={16} />
                    <span className="capitalize">{action.type}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {statusIcon[action.status] || <Clock size={16} />}
                    <Badge
                      variant={
                        action.status === "completed" ? "default" : "outline"
                      }
                    >
                      {action.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Avviata il {formatDate(action.startedAt)}
                </div>
                {action.output?.optimized_price && (
                  <div className="text-sm">
                    💰 Prezzo ottimizzato:{" "}
                    <strong>{action.output.optimized_price} €</strong>
                  </div>
                )}
                {action.output?.preview && (
                  <div className="text-sm italic text-muted-foreground">
                    📨 {action.output.preview.slice(0, 100)}...
                  </div>
                )}
                {action.output?.title && (
                  <div className="text-sm font-medium">
                    📄 Report: <span>{action.output.title}</span>
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
