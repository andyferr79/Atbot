import React from "react";
import "../styles/staypro.css"; // File CSS per gli stili

// Sezione: Statistiche chiave
const KeyStats = () => (
  <section id="key-stats">
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

// Sezione: Grafici e tendenze
const Charts = () => (
  <section id="charts">
    <h2>Tendenze e Previsioni</h2>
    <div className="chart-placeholder">[Grafico Occupazione]</div>
    <div className="chart-placeholder">[Grafico Entrate]</div>
  </section>
);

// Sezione: Collegamenti rapidi
const QuickLinks = () => (
  <section id="quick-links">
    <h2>Collegamenti Rapidi</h2>
    <button onClick={() => alert("Vai a Prenotazioni")}>Prenotazioni</button>
    <button onClick={() => alert("Vai a Ospiti")}>Ospiti</button>
    <button onClick={() => alert("Vai a Camere")}>Camere</button>
    <button onClick={() => alert("Vai a Fornitori")}>Fornitori</button>
  </section>
);

// Sezione principale: Dashboard
const StayProDashboard = () => (
  <div>
    <header>
      <h1>Dashboard StayPro</h1>
    </header>
    <KeyStats />
    <Charts />
    <QuickLinks />
  </div>
);

export default StayProDashboard;

