import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { getTestFirebase } from "./services/api";
import StayProDashboard from "./pages/StayProDashboard";
import Bookings from "./pages/Bookings";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        <header className="App-header">
          <h1>Test Connessione Backend</h1>
          {isLoading ? <p>Caricamento...</p> : <p>{message}</p>}
        </header>
        <Routes>
          <Route path="/" element={<StayProDashboard />} />
          <Route path="/bookings" element={<Bookings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


