import React, { useState } from "react";
import "../styles/Chatbox.css";

const Chatbox = () => {
  const [messages, setMessages] = useState([]); // Stato per i messaggi
  const [input, setInput] = useState(""); // Stato per l'input dell'utente
  const [isOpen, setIsOpen] = useState(true); // Controllo visibilità della chat
  const [loading, setLoading] = useState(false); // Stato di caricamento

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]); // Aggiunge il messaggio dell'utente
    setInput("");
    setLoading(true); // Mostra il caricamento

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_message: input,
          session_id: "test123", // Può essere un ID dinamico
        }),
      });

      const data = await response.json();
      const aiMessage = {
        text: data.response, // Risposta IA dal backend
        sender: "ai",
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]); // Aggiunge la risposta IA
    } catch (error) {
      console.error("Errore nel collegamento all'IA:", error);
    } finally {
      setLoading(false); // Rimuove il caricamento
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
