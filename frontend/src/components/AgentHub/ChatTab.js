import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";
import { Archive, Trash2 } from "lucide-react";

const ChatTab = ({ chatSessions, onArchive, onDelete }) => {
  return (
    <ScrollArea className="hub-scroll">
      <ul className="chat-list">
        {chatSessions.map((chat) => (
          <li key={chat.sessionId} className="chat-item">
            <div>
              <div className="font-medium">{chat.title}</div>
              <div className="text-sm text-muted-foreground">
                {chat.summary}
              </div>
            </div>
            <div className="chat-actions">
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
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default ChatTab;
