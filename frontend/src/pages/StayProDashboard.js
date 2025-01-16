import React from "react";
import "../styles/StayProDashboard.css"; // Stile specifico per la dashboard

// Componenti per sezioni
const KeyStats = () => (
  <section className="key-stats">
    <div className="stat">
      <h2>Entrate</h2>
      <p>€12,000</p>
    </div>
    <div className="stat">
      <h2>Tasso di Occupazione</h2>
      <p>75%</p>
    </div>
    <div className="stat">
      <h2>Prenotazioni</h2>
      <p>120</p>
    </div>
  </section>
);

const Charts = () => (
  <section className="charts">
    <h2>Tendenze e Previsioni</h2>
    <div className="chart">
      <p>Grafico Occupazione</p>
    </div>
    <div className="chart">
      <p>Grafico Entrate</p>
    </div>
  </section>
);

const QuickLinks = () => (
  <section className="quick-links">
    <h2>Collegamenti Rapidi</h2>
    <button onClick={() => alert("Vai a Prenotazioni")}>Prenotazioni</button>
    <button onClick={() => alert("Vai a Ospiti")}>Ospiti</button>
    <button onClick={() => alert("Vai a Camere")}>Camere</button>
    <button onClick={() => alert("Vai a Fornitori")}>Fornitori</button>
  </section>
);

const StayProDashboard = () => (
  <div className="dashboard-container">
    <header className="dashboard-header">
      <h1>Dashboard StayPro</h1>
    </header>
    <KeyStats />
    <Charts />
    <QuickLinks />
  </div>
);

export default StayProDashboard;
