import React from "react";
import "../styles/staypro.css"; // Stile associato, se esiste

const StayProDashboard = () => {
  const goTo = (section) => {
    alert(`Navigazione alla sezione ${section} (da implementare)!`);
  };

  return (
    <div>
      <header>
        <h1>Dashboard StayPro</h1>
      </header>
      <section id="stats">
        <div className="stat">
          <h2>Occupazione</h2>
          <p>80%</p>
        </div>
        <div className="stat">
          <h2>Entrate</h2>
          <p>€10,000</p>
        </div>
        <div className="stat">
          <h2>Prenotazioni</h2>
          <p>50</p>
        </div>
      </section>
      <section id="quick-links">
        <button onClick={() => goTo("booking")}>Prenotazioni</button>
        <button onClick={() => goTo("guests")}>Ospiti</button>
        <button onClick={() => goTo("rooms")}>Camere</button>
      </section>
    </div>
  );
};

export default StayProDashboard;
