// 📂 E:\ATBot\frontend\src\pages\chatbox\Chatbox.js
// Creazione file base Chatbox.js con stile simile a GPT

import React, { useState } from "react";
import "../styles/Chatbox.css";

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const handleSend = () => {
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      setMessages([
        ...messages,
        { text: input, sender: "user", time: timestamp },
      ]);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div
      className="chatbox-container"
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div className="chatbox-header">
        Chatbox IA
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
      </div>
      <div className="chatbox-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Scrivi un messaggio..."
        />
        <button onClick={handleSend}>Invia</button>
      </div>
    </div>
  );
};

export default Chatbox;

/* 📂 Posiziona il file in: E:\ATBot\frontend\src\pages\chatbox\Chatbox.js */
/* Stile simile a GPT: input, output, timestamp discreto, bottone per chiudere */
