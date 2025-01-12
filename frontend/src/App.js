import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Importa il Router
import { getTestFirebase } from "./services/api"; // Funzione Axios ottimizzata
import StayProDashboard from "./pages/StayProDashboard"; // Importa la Dashboard
import Bookings from "./pages/Bookings"; // Importa la pagina delle prenotazioni

import "./App.css";

function App() {
  // Stato per il messaggio ricevuto dal backend
  const [message, setMessage] = useState(""); 
  // Stato per indicare il caricamento
  const [isLoading, setIsLoading] = useState(true); 

  // Effettua la chiamata al backend per testare la connessione
  useEffect(() => {
    getTestFirebase()
      .then((response) => {
        setMessage(response.data.message); // Aggiorna il messaggio con la risposta
      })
      .catch((error) => {
        console.error("Errore durante la richiesta:", error);
        setMessage("Errore nella connessione al backend"); // Mostra un errore se non riesce
      })
      .finally(() => {
        setIsLoading(false); // Rimuove lo stato di caricamento
      });
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Test Connessione Backend</h1>
          {isLoading ? (
            <p>Caricamento...</p> // Mostra caricamento se in corso
          ) : (
            <p>{message}</p> // Mostra il messaggio ricevuto dal backend
          )}
        </header>
        {/* Configurazione delle rotte */}
        <Routes>
          <Route path="/" element={<StayProDashboard />} />
          <Route path="/bookings" element={<Bookings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

