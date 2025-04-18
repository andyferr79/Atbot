// ✅ Rooms.js - versione migliorata, con layout a due colonne, feedback e lista stanze (senza warning ESLint)

import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Rooms.css";
import { FaEdit, FaTrash, FaPlus, FaSync } from "react-icons/fa";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showDemoData, setShowDemoData] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "room",
    price: "",
    image: "",
    operatorId: "12345",
  });

  useEffect(() => {
    fetchRooms();
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!isLoading && rooms.length === 0 && properties.length === 0) {
      setShowDemoData(true);
    }
  }, [rooms, properties, isLoading]);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data.rooms || []);
    } catch (error) {
      console.error("Errore nel recupero delle stanze:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/properties");
      setProperties(res.data.properties || []);
    } catch (error) {
      console.error("Errore nel recupero degli alloggi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      await api.post("/rooms", newRoom);
      await fetchRooms();
      setNewRoom({
        name: "",
        type: "room",
        price: "",
        image: "",
        operatorId: "12345",
      });
      setSuccessMessage("✅ Struttura creata con successo!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Errore nell'aggiunta:", error);
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      setRooms((prev) => prev.filter((room) => room.id !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
    }
  };

  const handleLoadDemo = () => {
    setRooms([
      { id: 999, name: "Camera Demo", type: "room", price: 80, image: "" },
    ]);
    setShowDemoData(false);
  };

  if (isLoading) {
    return (
      <div className="rooms-page">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="rooms-page">
      {successMessage && <div className="success-alert">{successMessage}</div>}

      <div className="rooms-columns">
        {/* COLONNA SINISTRA */}
        <div className="column form-column">
          <h2>
            <FaPlus /> Aggiungi Nuova Struttura
          </h2>
          <p className="form-hint">
            Inserisci i dati per creare una nuova stanza o alloggio
          </p>
          <input
            type="text"
            placeholder="Nome (es. Camera 101)"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
          />
          <select
            value={newRoom.type}
            onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
          >
            <option value="room">🛏 Stanza</option>
            <option value="property">🏡 Alloggio</option>
          </select>
          <input
            type="number"
            placeholder="Prezzo per notte"
            value={newRoom.price}
            onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
          />
          <input
            type="text"
            placeholder="URL Immagine (opzionale)"
            value={newRoom.image}
            onChange={(e) => setNewRoom({ ...newRoom, image: e.target.value })}
          />
          <button className="add-btn" onClick={handleAddRoom}>
            <FaPlus /> Aggiungi
          </button>
          <button className="refresh-btn" onClick={fetchRooms}>
            <FaSync /> Aggiorna
          </button>
        </div>

        {/* COLONNA DESTRA */}
        <div className="column content-column">
          <div className="filter-options">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              🏠 Tutte
            </button>
            <button
              className={filter === "rooms" ? "active" : ""}
              onClick={() => setFilter("rooms")}
            >
              🛏 Stanze
            </button>
            <button
              className={filter === "properties" ? "active" : ""}
              onClick={() => setFilter("properties")}
            >
              🏡 Alloggi
            </button>
          </div>

          {showDemoData ? (
            <div className="onboarding-container">
              <img src="/no-data.png" alt="Nessun Dato" />
              <h2>Benvenuto nella Gestione Strutture!</h2>
              <p>
                Non hai ancora aggiunto strutture. Puoi caricare un esempio o
                iniziare subito.
              </p>
              <button onClick={handleLoadDemo}>
                <FaPlus /> Carica Dati Demo
              </button>
            </div>
          ) : (
            <div className="rooms-list">
              {(filter === "all" || filter === "rooms") && rooms.length > 0 && (
                <div>
                  <h3>🛏 Stanze</h3>
                  <div className="cards-container">
                    {rooms.map((room) => (
                      <div key={room.id} className="card">
                        <img
                          src={room.image || "/default-room.jpg"}
                          alt={room.name}
                        />
                        <h4>{room.name}</h4>
                        <p>{room.type}</p>
                        <p>{room.price}€/notte</p>
                        <div className="actions">
                          <button>
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDeleteRoom(room.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
