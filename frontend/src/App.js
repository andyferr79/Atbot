import React, { useEffect, useState } from "react";
import { getTestFirebase } from "./services/api"; // Funzione Axios ottimizzata
import "./App.css";

function App() {
  const [message, setMessage] = useState(""); // Stato per il messaggio dal backend
  const [isLoading, setIsLoading] = useState(true); // Stato per il caricamento

  useEffect(() => {
    // Effettua una richiesta GET alla rotta "/test-firebase"
    getTestFirebase()
      .then((response) => {
        setMessage(response.data.message); // Imposta il messaggio nello stato
      })
      .catch((error) => {
        console.error("Errore durante la richiesta:", error);
        setMessage("Errore nella connessione al backend");
      })
      .finally(() => {
        setIsLoading(false); // Fine caricamento
      });
  }, []); // L'array vuoto esegue useEffect una sola volta

  return (
    <div className="App">
      <header className="App-header">
        <h1>Test Connessione Backend</h1>
        {isLoading ? (
          <p>Caricamento...</p>
        ) : (
          <p>{message}</p>
        )}
      </header>
    </div>
  );
}

export default App;


