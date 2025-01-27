// Bookings.js - Gestione Prenotazioni
import React, { useEffect, useState } from "react";
import "../styles/bookings.css"; // Stile specifico per la pagina
import {
  getBookings,
  updateBooking,
  deleteBooking,
  addBooking,
} from "../services/api"; // API per le prenotazioni

const Bookings = () => {
  const [bookings, setBookings] = useState([]); // Stato per le prenotazioni
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    checkInDate: "",
    checkOutDate: "",
    status: "pending",
    channel: "direct",
  }); // Stato per una nuova prenotazione

  // Recupero prenotazioni all'avvio
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getBookings();
        setBookings(response.data); // Assumi che response.data contenga un array di prenotazioni
      } catch (error) {
        console.error("Errore nel recupero delle prenotazioni:", error);
      }
    };

    fetchBookings();
  }, []);

  // Aggiunta di una nuova prenotazione
  const handleAddBooking = async () => {
    try {
      if (
        !newBooking.customerName ||
        !newBooking.checkInDate ||
        !newBooking.checkOutDate
      ) {
        alert("Tutti i campi devono essere compilati.");
        return;
      }

      const response = await addBooking(newBooking);
      setBookings((prev) => [...prev, response.data]);
      alert("Prenotazione aggiunta con successo.");
      setNewBooking({
        customerName: "",
        checkInDate: "",
        checkOutDate: "",
        status: "pending",
        channel: "direct",
      });
    } catch (error) {
      console.error("Errore nella creazione della prenotazione:", error);
      alert("Errore nella creazione della prenotazione.");
    }
  };

  // Eliminazione di una prenotazione
  const handleDelete = async (bookingId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa prenotazione?")) {
      return;
    }
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      alert("Prenotazione eliminata con successo.");
    } catch (error) {
      console.error("Errore nell'eliminazione della prenotazione:", error);
      alert("Errore nell'eliminazione della prenotazione.");
    }
  };

  // Modifica di una prenotazione
  const handleEdit = async (bookingId) => {
    const newStatus = prompt("Inserisci il nuovo stato della prenotazione:");
    if (!newStatus) return;

    try {
      await updateBooking(bookingId, { status: newStatus });
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
      alert("Prenotazione aggiornata con successo.");
    } catch (error) {
      console.error("Errore nella modifica della prenotazione:", error);
      alert("Errore nella modifica della prenotazione.");
    }
  };

  // Gruppo di prenotazioni per canale
  const groupByChannel = (bookings) => {
    return bookings.reduce((groups, booking) => {
      const channel = booking.channel || "direct";
      if (!groups[channel]) {
        groups[channel] = [];
      }
      groups[channel].push(booking);
      return groups;
    }, {});
  };

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <h1>Gestione Prenotazioni</h1>
        <p>Visualizza, modifica e gestisci le prenotazioni del tuo hotel.</p>
      </header>

      <main className="bookings-content">
        {/* Aggiungi Prenotazione */}
        <section className="add-booking">
          <h2>Aggiungi Prenotazione</h2>
          <div className="form-group">
            <label>
              Nome Cliente:
              <input
                type="text"
                value={newBooking.customerName}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, customerName: e.target.value })
                }
              />
            </label>
            <label>
              Data Check-in:
              <input
                type="date"
                value={newBooking.checkInDate}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, checkInDate: e.target.value })
                }
              />
            </label>
            <label>
              Data Check-out:
              <input
                type="date"
                value={newBooking.checkOutDate}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, checkOutDate: e.target.value })
                }
              />
            </label>
            <label>
              Canale:
              <select
                value={newBooking.channel}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, channel: e.target.value })
                }
              >
                <option value="direct">Direct</option>
                <option value="booking">Booking.com</option>
                <option value="airbnb">Airbnb</option>
                <option value="expedia">Expedia</option>
              </select>
            </label>
            <button onClick={handleAddBooking}>Aggiungi Prenotazione</button>
          </div>
        </section>

        {/* Prenotazioni per Canale */}
        <section className="channel-bookings">
          <h2>Prenotazioni per Canale</h2>
          {Object.entries(groupByChannel(bookings)).map(
            ([channel, bookings]) => (
              <div key={channel} className="channel-section">
                <h3>{channel.toUpperCase()}</h3>
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
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.customerName}</td>
                        <td>{booking.checkInDate}</td>
                        <td>{booking.checkOutDate}</td>
                        <td>{booking.status}</td>
                        <td>
                          <button onClick={() => handleEdit(booking.id)}>
                            Modifica
                          </button>
                          <button onClick={() => handleDelete(booking.id)}>
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
};

export default Bookings;
