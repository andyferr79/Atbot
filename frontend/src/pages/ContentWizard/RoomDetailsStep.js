import React, { useState, useEffect } from "react";
import "../../styles/styles/RoomDetailsStep.css";

const RoomDetailsStep = ({ data = [], onUpdate, onNext }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    name: "",
    size: "",
    guests: "",
    beds: "",
    description: "",
    services: "",
  });

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setRooms(data);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRoom((prev) => ({ ...prev, [name]: value }));
  };

  const addRoom = () => {
    const isValid =
      newRoom.name.trim() &&
      newRoom.size.trim() &&
      newRoom.guests.trim() &&
      newRoom.beds.trim() &&
      newRoom.description.trim().length > 30;

    if (!isValid) return;

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    onUpdate(updatedRooms); // 🔁 aggiorna il parent
    setNewRoom({
      name: "",
      size: "",
      guests: "",
      beds: "",
      description: "",
      services: "",
    });
  };

  const handleNext = () => {
    onUpdate(rooms);
    onNext();
  };

  return (
    <div className="room-form">
      <h2>Camere</h2>
      <p>
        Inserisci i dettagli per ogni camera disponibile nella tua struttura
      </p>

      <div className="room-inputs">
        <input
          placeholder="Nome camera"
          name="name"
          value={newRoom.name}
          onChange={handleChange}
        />
        <input
          placeholder="Superficie in m²"
          name="size"
          value={newRoom.size}
          onChange={handleChange}
        />
        <input
          placeholder="Ospiti max"
          name="guests"
          value={newRoom.guests}
          onChange={handleChange}
        />
        <input
          placeholder="Letti (es. 1 matrimoniale + 1 singolo)"
          name="beds"
          value={newRoom.beds}
          onChange={handleChange}
        />
        <textarea
          placeholder="Descrizione camera (min. 30 caratteri)"
          name="description"
          value={newRoom.description}
          onChange={handleChange}
          rows={3}
        />
        <input
          placeholder="Servizi (es. WiFi, bagno, TV...)"
          name="services"
          value={newRoom.services}
          onChange={handleChange}
        />
        <button className="btn ghost" onClick={addRoom}>
          Aggiungi camera
        </button>
      </div>

      <div className="room-list">
        <h4>Camere inserite:</h4>
        {rooms.length === 0 ? (
          <p>Nessuna camera aggiunta.</p>
        ) : (
          rooms.map((room, i) => (
            <div key={i} className="room-item">
              <strong>{room.name}</strong> – {room.size} m² – {room.guests}{" "}
              ospiti
            </div>
          ))
        )}
      </div>

      <div className="structure-footer">
        <button
          disabled={rooms.length === 0}
          onClick={handleNext}
          className="btn primary"
        >
          Avanti
        </button>
      </div>
    </div>
  );
};

export default RoomDetailsStep;
