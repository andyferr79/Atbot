// ✅ Rooms.js - versione migliorata con edit modal + operatorId dinamico
import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Rooms.css";
import { FaEdit, FaTrash, FaPlus, FaSync, FaSave } from "react-icons/fa";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showDemoData, setShowDemoData] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const userId = localStorage.getItem("user_id");

  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "room",
    price: "",
    image: "",
    operatorId: userId || "default-uid",
  });

  const [editRoom, setEditRoom] = useState(null);

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
        operatorId: userId || "default-uid",
      });
      setSuccessMessage("✅ Struttura creata con successo!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Errore nell'aggiunta:", error);
    }
  };

  const handleEditRoom = (room) => {
    setEditRoom({ ...room });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/rooms/${editRoom.id}`, editRoom);
      await fetchRooms();
      setEditRoom(null);
      setSuccessMessage("✅ Modifica salvata con successo!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Errore nella modifica:", error);
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
          <input
            type="text"
            placeholder="Nome"
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
            placeholder="Prezzo"
            value={newRoom.price}
            onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
          />
          <input
            type="text"
            placeholder="URL Immagine"
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
                          <button onClick={() => handleEditRoom(room)}>
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

      {/* MODAL MODIFICA STANZA */}
      {editRoom && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Modifica Stanza</h3>
            <input
              type="text"
              value={editRoom.name}
              onChange={(e) =>
                setEditRoom({ ...editRoom, name: e.target.value })
              }
            />
            <input
              type="number"
              value={editRoom.price}
              onChange={(e) =>
                setEditRoom({ ...editRoom, price: e.target.value })
              }
            />
            <input
              type="text"
              value={editRoom.image}
              onChange={(e) =>
                setEditRoom({ ...editRoom, image: e.target.value })
              }
            />
            <div className="modal-actions">
              <button onClick={handleSaveEdit}>
                <FaSave /> Salva
              </button>
              <button onClick={() => setEditRoom(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
