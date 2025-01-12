import React from "react";
import "../styles/bookings.css"; // Stile specifico per la pagina

const Bookings = () => {
  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <h1>Gestione Prenotazioni</h1>
        <p>Visualizza, modifica e gestisci le prenotazioni del tuo hotel.</p>
      </header>

      <main className="bookings-content">
        {/* Filtri */}
        <section className="filters">
          <h2>Filtri</h2>
          <div className="filter-options">
            <label>
              Data:
              <input type="date" />
            </label>
            <label>
              Stato:
              <select>
                <option value="all">Tutte</option>
                <option value="confirmed">Confermate</option>
                <option value="pending">In attesa</option>
                <option value="cancelled">Cancellate</option>
              </select>
            </label>
            <button className="filter-button">Applica</button>
          </div>
        </section>

        {/* Elenco prenotazioni */}
        <section className="bookings-list">
          <h2>Elenco Prenotazioni</h2>
          <table className="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome Cliente</th>
                <th>Data Check-in</th>
                <th>Data Check-out</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#12345</td>
                <td>Mario Rossi</td>
                <td>2025-01-15</td>
                <td>2025-01-20</td>
                <td>Confermata</td>
                <td>
                  <button className="action-button">Modifica</button>
                  <button className="action-button delete">Elimina</button>
                </td>
              </tr>
              {/* Altre righe */}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Bookings;
