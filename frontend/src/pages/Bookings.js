import React, { useEffect, useState } from "react";
import "../styles/bookings.css";
import {
  getBookings,
  updateBooking,
  deleteBooking,
  addBooking,
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
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    checkInDate: "",
    checkOutDate: "",
    status: "pending",
    channel: "direct",
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getBookings();
        setBookings(response.data);
      } catch (error) {
        console.error("Errore nel recupero delle prenotazioni:", error);
      }
    };
    fetchBookings();
  }, []);

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
      setNewBooking({
        customerName: "",
        checkInDate: "",
        checkOutDate: "",
        status: "pending",
        channel: "direct",
      });
    } catch (error) {
      console.error("Errore nella creazione della prenotazione:", error);
    }
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
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.includes(searchQuery)
  );

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <h1>Gestione Prenotazioni</h1>
      </header>

      <main className="bookings-content">
        <section className="add-booking">
          <h2>Aggiungi Prenotazione</h2>
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
            <button onClick={handleAddBooking}>Aggiungi Prenotazione</button>
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
      </main>
    </div>
  );
};

export default Bookings;
