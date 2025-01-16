import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar"; // Importa la Sidebar
import { getTestFirebase } from "./services/api";
import StayProDashboard from "./pages/StayProDashboard";
import Bookings from "./pages/Bookings";
import Guests from "./pages/Guests"; // Importa la nuova pagina Guests
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Effettua la chiamata al backend per testare la connessione
  useEffect(() => {
    getTestFirebase()
      .then((response) => setMessage(response.data.message))
      .catch((error) => {
        console.error("Errore durante la richiesta:", error);
        setMessage("Errore nella connessione al backend");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Router>
      <div className="App">
        <Sidebar /> {/* Sidebar visibile in tutte le pagine */}
        <div className="main-content">
          <header className="App-header">
            <h1>Test Connessione Backend</h1>
            {isLoading ? <p>Caricamento...</p> : <p>{message}</p>}
          </header>
          {/* Configurazione delle rotte */}
          <Routes>
            <Route path="/" element={<StayProDashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/guests" element={<Guests />} /> {/* Nuova rotta */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
