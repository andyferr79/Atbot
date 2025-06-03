// src/pages/Guests.js (da rinominare in Clients.js)
import React, { useState, useEffect } from "react";
import { getGuests, addGuest } from "../services/api";
import "../styles/guests.css";

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState({
    fullName: "",
    email: "",
    phone: "",
    roomType: "",
    tags: "",
    notes: "",
    language: "it",
    marketingConsent: false,
  });

  useEffect(() => {
    getGuests()
      .then((response) => {
        setGuests(response.data);
      })
      .catch((error) => {
        console.error("Errore durante il recupero dei clienti:", error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setNewGuest((prev) => ({ ...prev, [name]: val }));
  };

  const handleAddGuest = () => {
    const payload = {
      ...newGuest,
      tags: newGuest.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((t) => t !== ""),
    };

    addGuest(payload)
      .then(() => {
        alert("Cliente aggiunto con successo!");
        setNewGuest({
          fullName: "",
          email: "",
          phone: "",
          roomType: "",
          tags: "",
          notes: "",
          language: "it",
          marketingConsent: false,
        });
        return getGuests();
      })
      .then((response) => setGuests(response.data))
      .catch((error) => {
        console.error("Errore durante l'aggiunta del cliente:", error);
        alert("Errore durante l'aggiunta del cliente.");
      });
  };

  return (
    <div className="guests-page">
      <h1>Gestione Clienti</h1>

      <div className="add-guest">
        <h2>Aggiungi Cliente Manualmente</h2>
        <input
          type="text"
          name="fullName"
          placeholder="Nome Completo"
          value={newGuest.fullName}
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
        <input
          type="text"
          name="tags"
          placeholder="Tag (es. frequente, vip)"
          value={newGuest.tags}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="notes"
          placeholder="Note"
          value={newGuest.notes}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="language"
          placeholder="Lingua (es. it, en)"
          value={newGuest.language}
          onChange={handleInputChange}
        />
        <label>
          <input
            type="checkbox"
            name="marketingConsent"
            checked={newGuest.marketingConsent}
            onChange={handleInputChange}
          />
          Consenso Marketing
        </label>
        <button onClick={handleAddGuest}>Aggiungi Cliente</button>
      </div>

      <div className="guest-list">
        <h2>Lista Clienti</h2>
        {guests.length === 0 ? (
          <p>Nessun cliente registrato.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Tipo Camera</th>
                <th>Tag</th>
                <th>Note</th>
                <th>Lingua</th>
                <th>Marketing</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td>{guest.fullName}</td>
                  <td>{guest.email}</td>
                  <td>{guest.phone}</td>
                  <td>{guest.roomType || "-"}</td>
                  <td>{(guest.tags || []).join(", ")}</td>
                  <td>{guest.notes}</td>
                  <td>{guest.language}</td>
                  <td>{guest.marketingConsent ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Guests;
