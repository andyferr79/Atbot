import React, { useState } from "react";
import { sendMessageToAI } from "../services/api";
import "../styles/Chatbox.css";

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const sessionId =
        localStorage.getItem("chat_session_id") || "default-session";
      const res = await sendMessageToAI(input, sessionId);
      const aiMessage = {
        text: res.data.response,
        sender: "ai",
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Errore nel collegamento all'IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

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
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <span className="message-time">{msg.time}</span>
            {msg.text}
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
