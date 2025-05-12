import React, { useState } from "react";
import { Bot, Send } from "lucide-react";
import "../styles/AgentChatbox.css";

const AgentChatbox = ({ onStartThinking, onStopThinking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const userId = localStorage.getItem("user_id");
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("chat_session_id") || null
  );

  const createSession = async () => {
    try {
      const res = await fetch("http://localhost:8000/chat/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: "Interazione Agente",
        }),
      });
      const data = await res.json();
      localStorage.setItem("chat_session_id", data.sessionId);
      setSessionId(data.sessionId);
      console.log("📌 Nuova sessione:", data.sessionId);
    } catch (err) {
      console.error("❌ Errore creazione sessione:", err);
    }
  };

  const trackAction = async (type, context = {}) => {
    try {
      const res = await fetch("http://localhost:8000/agent/track-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          type,
          context,
        }),
      });
      const data = await res.json();
      console.log("🧠 Azione IA tracciata:", data.actionId);
      setActionId(data.actionId);
    } catch (err) {
      console.error("❌ Errore tracking IA:", err);
    }
  };

  const uploadReport = async (sessionId, userId, content) => {
    try {
      const res = await fetch("http://localhost:8000/agent/upload-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          content,
        }),
      });
      const data = await res.json();
      console.log("📎 Report salvato:", data);
    } catch (err) {
      console.error("❌ Errore upload report:", err);
    }
  };

  const updateAction = async (output = {}) => {
    if (!actionId) return;
    try {
      await fetch(`http://localhost:8000/agent/actions/${userId}/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          output,
        }),
      });
    } catch (err) {
      console.error("❌ Errore update azione:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!sessionId) await createSession();

    const newUserMessage = {
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);
    onStartThinking && onStartThinking();

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: input,
          session_id: localStorage.getItem("chat_session_id"),
          user_id: userId,
        }),
      });
      const data = await res.json();

      const responseText = data.response;
      const newBotMessage = {
        sender: "agent",
        text: responseText,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newBotMessage]);

      const prompt = input.toLowerCase();
      const context = { session_id: sessionId, prompt: input };

      let type = "chat";
      if (prompt.includes("report")) {
        type = "report";
        await uploadReport(sessionId, userId, responseText);
      } else if (prompt.includes("check-in")) type = "checkin";
      else if (prompt.includes("prezzo") || prompt.includes("tariffa"))
        type = "pricing";

      await trackAction(type, context);

      await updateAction({
        response: responseText,
        preview: responseText.slice(0, 100) + "...",
      });
    } catch (err) {
      console.error("Errore risposta IA:", err);
    } finally {
      setLoading(false);
      onStopThinking && onStopThinking();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="agent-chatbox-fixed">
      <div className="agent-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <Bot size={18} />
        <span className="agent-toggle-label">Agente</span>
      </div>

      {isOpen && (
        <div className="agent-chatbox">
          <div className="chat-header">🤖 Agente IA</div>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.sender}`}>
                <div className="chat-meta">
                  <span>{msg.sender === "user" ? "Tu" : "Agente"}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="chat-text">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg agent">⌛ Sto pensando...</div>
            )}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Scrivi un comando o una richiesta..."
            />
            <button onClick={sendMessage} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChatbox;
