import React, { useState } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";
import { Archive, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../../components/ui/badge";

const ChatTab = ({ chatSessions, onArchive, onDelete }) => {
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [chatActionsMap, setChatActionsMap] = useState({});

  const toggleExpand = async (sessionId) => {
    if (expandedChatId === sessionId) {
      setExpandedChatId(null);
      return;
    }

    if (!chatActionsMap[sessionId]) {
      try {
        const res = await fetch(
          `http://localhost:8000/chat_sessions/${sessionId}/actions`
        );
        const data = await res.json();
        setChatActionsMap((prev) => ({ ...prev, [sessionId]: data }));
      } catch (err) {
        console.error("❌ Errore caricamento azioni:", err);
        return;
      }
    }

    setExpandedChatId(sessionId);
  };

  return (
    <ScrollArea className="hub-scroll">
      <ul className="chat-list">
        {Array.isArray(chatSessions) && chatSessions.length > 0 ? (
          chatSessions.map((chat) => (
            <li key={chat.sessionId} className="chat-item">
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-medium">{chat.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {chat.summary || "Nessun riassunto disponibile"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(chat.sessionId)}
                    >
                      {expandedChatId === chat.sessionId ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(chat.sessionId)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(chat.sessionId)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Azioni associate */}
                {expandedChatId === chat.sessionId &&
                  Array.isArray(chatActionsMap[chat.sessionId]) &&
                  chatActionsMap[chat.sessionId].length > 0 && (
                    <ul className="space-y-2 mt-2">
                      {chatActionsMap[chat.sessionId].map((action) => (
                        <li
                          key={action.actionId}
                          className="border p-2 rounded-md bg-muted"
                        >
                          <div className="text-sm font-semibold capitalize">
                            {action.type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ⏱ {new Date(action.startedAt).toLocaleString()}
                          </div>
                          <div className="text-sm mt-1">
                            {action.output?.message ||
                              action.output?.title ||
                              "– Nessun messaggio"}
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant={
                                action.status === "completed"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {action.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground p-4">
            Nessuna chat disponibile.
          </li>
        )}
      </ul>
    </ScrollArea>
  );
};

export default ChatTab;
