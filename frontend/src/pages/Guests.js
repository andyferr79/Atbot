import React, { useState, useEffect } from "react";
import { getGuests, addGuest } from "../services/api";
import "../styles/guests.css";

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    roomType: "",
  });

  useEffect(() => {
    // Recupera gli ospiti dal backend
    getGuests()
      .then((response) => {
        setGuests(response.data);
      })
      .catch((error) => {
        console.error("Errore durante il recupero degli ospiti:", error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGuest((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddGuest = () => {
    addGuest(newGuest)
      .then(() => {
        alert("Ospite aggiunto con successo!");
        setNewGuest({
          name: "",
          email: "",
          phone: "",
          roomType: "",
        });
        return getGuests(); // Ricarica la lista degli ospiti
      })
      .then((response) => setGuests(response.data))
      .catch((error) => {
        console.error("Errore durante l'aggiunta di un ospite:", error);
        alert("Errore durante l'aggiunta di un ospite.");
      });
  };

  return (
    <div className="guests-page">
      <h1>Gestione Ospiti</h1>
      <div className="guest-list">
        <h2>Lista Ospiti</h2>
        {guests.length === 0 ? (
          <p>Nessun ospite registrato.</p>
        ) : (
          <ul>
            {guests.map((guest) => (
              <li key={guest.id}>
                <strong>{guest.name}</strong> - {guest.email} - {guest.phone}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="add-guest">
        <h2>Aggiungi Ospite</h2>
        <input
          type="text"
          name="name"
          placeholder="Nome"
          value={newGuest.name}
          onChange={handleInputChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={newGuest.email}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Telefono"
          value={newGuest.phone}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="roomType"
          placeholder="Tipo di Camera"
          value={newGuest.roomType}
          onChange={handleInputChange}
        />
        <button onClick={handleAddGuest}>Aggiungi</button>
      </div>
    </div>
  );
};

export default Guests;
