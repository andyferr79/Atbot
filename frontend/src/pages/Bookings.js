// 📂 E:/ATBot/frontend/src/pages/Bookings.js

import React, { useEffect, useState } from "react";
import "../styles/bookings.css";
import {
  getBookings,
  deleteBooking,
  addBooking,
  updateBooking,
} from "../services/api";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
const STATUS_LABELS = {
  pending: "In Attesa",
  accepted: "Accettata",
  confirmed: "Confermata",
  completed: "Completata",
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [calendarView, setCalendarView] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    checkInDate: "",
    checkOutDate: "",
    status: "pending",
    channel: "direct",
  });
  const [editingBookingId, setEditingBookingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getBookings();
        const data = response.data?.bookings || [];
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Errore nel recupero delle prenotazioni:", error);
        setBookings([]);
      }
    };
    fetchBookings();
  }, []);

  const handleAddOrUpdateBooking = async () => {
    try {
      if (
        !newBooking.customerName ||
        !newBooking.checkInDate ||
        !newBooking.checkOutDate
      ) {
        alert("Tutti i campi devono essere compilati.");
        return;
      }

      if (editingBookingId) {
        await updateBooking(editingBookingId, newBooking);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === editingBookingId ? { ...b, ...newBooking } : b
          )
        );
        setConfirmationMessage("✅ Prenotazione aggiornata con successo.");
      } else {
        const response = await addBooking(newBooking);
        setBookings((prev) => [
          ...prev,
          { ...newBooking, id: response.data.id },
        ]);
        setConfirmationMessage("✅ Prenotazione creata con successo.");
      }

      setNewBooking({
        customerName: "",
        checkInDate: "",
        checkOutDate: "",
        status: "pending",
        channel: "direct",
      });
      setEditingBookingId(null);

      setTimeout(() => setConfirmationMessage(""), 3000);
    } catch (error) {
      console.error(
        "Errore nella creazione/modifica della prenotazione:",
        error
      );
    }
  };

  const handleEdit = (booking) => {
    setNewBooking({
      customerName: booking.customerName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: booking.status,
      channel: booking.channel,
    });
    setEditingBookingId(booking.id);
  };

  const handleDelete = async (bookingId) => {
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    } catch (error) {
      console.error("Errore nell'eliminazione della prenotazione:", error);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.includes(searchQuery)
  );

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <h1>Gestione Prenotazioni</h1>
      </header>

      <main className="bookings-content">
        <section className="add-booking">
          <h2>
            {editingBookingId
              ? "Modifica Prenotazione"
              : "Aggiungi Prenotazione"}
          </h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nome Cliente"
              value={newBooking.customerName}
              onChange={(e) =>
                setNewBooking({ ...newBooking, customerName: e.target.value })
              }
            />
            <input
              type="date"
              value={newBooking.checkInDate}
              onChange={(e) =>
                setNewBooking({ ...newBooking, checkInDate: e.target.value })
              }
            />
            <input
              type="date"
              value={newBooking.checkOutDate}
              onChange={(e) =>
                setNewBooking({ ...newBooking, checkOutDate: e.target.value })
              }
            />
            <button onClick={handleAddOrUpdateBooking}>
              {editingBookingId ? "Salva Modifiche" : "Aggiungi Prenotazione"}
            </button>
            {confirmationMessage && (
              <div className="confirmation-message">{confirmationMessage}</div>
            )}
          </div>
        </section>

        <section className="search-bar">
          <input
            type="text"
            placeholder="🔍 Cerca per nome o ID prenotazione..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </section>

        <section className="calendar-controls">
          <button onClick={() => setCalendarView("day")}>Giornaliero</button>
          <button onClick={() => setCalendarView("week")}>Settimanale</button>
          <button onClick={() => setCalendarView("month")}>Mensile</button>
        </section>

        <section className="calendar-container">
          <h2>Calendario Prenotazioni</h2>
          <Calendar
            localizer={localizer}
            events={filteredBookings.map((booking) => ({
              title: `${booking.customerName} (${
                STATUS_LABELS[booking.status]
              })`,
              start: new Date(booking.checkInDate),
              end: new Date(booking.checkOutDate),
            }))}
            startAccessor="start"
            endAccessor="end"
            views={{ month: true, week: true, day: true }}
            view={calendarView}
            onView={(view) => setCalendarView(view)}
            style={{ height: 500 }}
          />
        </section>

        <section className="booking-list">
          <h3>Elenco Prenotazioni</h3>
          <ul>
            {filteredBookings.map((booking) => (
              <li key={booking.id}>
                <span>
                  {booking.customerName} ({booking.checkInDate} -{" "}
                  {booking.checkOutDate})
                </span>
                <button onClick={() => handleEdit(booking)}>Modifica</button>
                <button onClick={() => handleDelete(booking.id)}>
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Bookings;
