import React, { useState } from "react";
import "../styles/Chatbox.css";

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");
  const sessionId =
    localStorage.getItem("chat_session_id") || "default-session";

  const appendMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const updateMessageStatus = (pendingId, newText, type) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.pending_action_id === pendingId
          ? { ...msg, text: newText, type }
          : msg
      )
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const now = new Date().toLocaleTimeString();
    appendMessage({ text: input, sender: "user", time: now });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat/understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: input,
        }),
      });

      const data = await res.json();

      if (data.intent && data.pending_action_id) {
        appendMessage({
          text: data.response,
          sender: "ai",
          time: now,
          type: "proposal",
          pending_action_id: data.pending_action_id,
        });
      } else {
        appendMessage({ text: data.response, sender: "ai", time: now });
      }
    } catch (error) {
      console.error("Errore IA:", error);
      appendMessage({
        text: "❌ Errore di connessione con l'IA",
        sender: "ai",
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (pendingId, type) => {
    const url = `http://localhost:8000/agent/${type}-action/${userId}/${pendingId}`;
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (type === "accept") {
        updateMessageStatus(
          pendingId,
          data.result?.message || "✅ Azione completata",
          "completed"
        );
      } else {
        updateMessageStatus(pendingId, "❌ Azione rifiutata", "rejected");
      }
    } catch (error) {
      console.error(`Errore ${type} azione:`, error);
      updateMessageStatus(
        pendingId,
        `❌ Errore durante ${type} azione`,
        "error"
      );
    }
  };

  const handleKeyPress = (e) => e.key === "Enter" && sendMessage();

  return (
    <div
      className="chatbox-container"
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div className="chatbox-header">
        Chat IA
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <span className="message-time">{msg.time}</span>
            <div>{msg.text}</div>

            {msg.type === "proposal" && (
              <div className="proposal-buttons">
                <button
                  onClick={() => handleAction(msg.pending_action_id, "accept")}
                >
                  ✅ Accetta
                </button>
                <button
                  onClick={() => handleAction(msg.pending_action_id, "reject")}
                >
                  ❌ Rifiuta
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message ai">⏳ L'IA sta rispondendo...</div>
        )}
      </div>

      <div className="chatbox-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Scrivi un messaggio..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Invia"}
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
