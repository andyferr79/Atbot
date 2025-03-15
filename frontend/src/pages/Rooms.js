import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Rooms.css";
import { FaBed, FaHome, FaEdit, FaTrash, FaPlus, FaSync } from "react-icons/fa";

/**
 * Rooms: Pagina di gestione Strutture (Stanze / Alloggi)
 * - Include placeholder e guida se l'utente non ha ancora configurato nulla
 * - Filtri per mostrare 'Tutte', 'Stanze' e 'Alloggi'
 * - Possibilità di aggiungere nuove voci (room / property)
 * - Card con immagine, nome, tipo, prezzo e pulsanti di modifica/elimina
 * - Pulsante "Aggiorna" (FaSync) per ricaricare i dati
 */

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "rooms", "properties"
  const [isLoading, setIsLoading] = useState(true);

  // FORM di aggiunta rapida
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "room", // "room" per stanze, "property" per alloggi
    price: "",
    image: "",
    operatorId: "12345", // ID fittizio, da collegare a login
  });

  // Demo: se non arrivano dati reali, possiamo mostrarne di base
  const [showDemoData, setShowDemoData] = useState(false);

  // Al caricamento, recupera i dati
  useEffect(() => {
    fetchRooms();
    fetchProperties();
  }, []);

  // Se rooms/properties sono vuoti, proponiamo onboarding/demo
  useEffect(() => {
    if (!isLoading && rooms.length === 0 && properties.length === 0) {
      setShowDemoData(true);
    }
  }, [rooms, properties, isLoading]);

  // 🔹 Recupera stanze
  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms");
      console.log("Rooms ->", response.data); // LOG per capire la risposta
      setRooms(response.data);
    } catch (error) {
      console.error("Errore nel recupero delle stanze:", error);
    } finally {
      // Che vada bene o male, usciamo dal caricamento
      setIsLoading(false);
    }
  };

  // 🔹 Recupera alloggi
  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      console.log("Properties ->", response.data); // LOG per capire la risposta
      setProperties(response.data);
    } catch (error) {
      console.error("Errore nel recupero degli alloggi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Bottone refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchRooms();
    fetchProperties();
  };

  // ➕ Aggiunta rapida (stanza/alloggio)
  const handleAddRoom = async () => {
    try {
      // Stiamo usando lo stesso endpoint "/rooms" come da esempio,
      // ma in un caso reale, per gli alloggi potresti usare "/properties".
      const response = await api.post("/rooms", newRoom);
      console.log("Aggiunta ->", response.data);

      if (newRoom.type === "room") {
        setRooms([...rooms, response.data]);
      } else {
        setProperties([...properties, response.data]);
      }
      setNewRoom({
        name: "",
        type: "room",
        price: "",
        image: "",
        operatorId: "12345",
      });
    } catch (error) {
      console.error("Errore nell'aggiunta:", error);
    }
  };

  // ❌ Elimina stanza/alloggio
  const handleDeleteRoom = async (itemId, itemType) => {
    try {
      // Esempio: /rooms/:id oppure /properties/:id
      await api.delete(`/${itemType}/${itemId}`);
      console.log("Eliminazione ->", itemId, itemType);

      if (itemType === "rooms") {
        setRooms((prev) => prev.filter((r) => r.id !== itemId));
      } else {
        setProperties((prev) => prev.filter((p) => p.id !== itemId));
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
    }
  };

  // 🔹 Se l'utente sceglie di caricare DEMO data
  const handleLoadDemo = () => {
    const demoRoom = {
      id: 999,
      name: "Camera Demo",
      type: "room",
      price: 80,
      image: "",
    };
    const demoProperty = {
      id: 888,
      name: "Casa Vacanze Demo",
      type: "property",
      price: 120,
      image: "",
    };
    setRooms([demoRoom]);
    setProperties([demoProperty]);
    setShowDemoData(false);
  };

  // Se sta caricando
  if (isLoading) {
    return (
      <div className="rooms-page">
        <h1>Gestione Strutture</h1>
        <p style={{ textAlign: "center", marginTop: "50px" }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="rooms-page">
      {/* ========== HEADER + BOTTONE REFRESH ========== */}
      <div className="rooms-header">
        <h1>Gestione Strutture</h1>
        <button className="refresh-button" onClick={handleRefresh}>
          <FaSync /> Aggiorna
        </button>
      </div>

      {/* ========== FILTRI ========== */}
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

      {/* ========== ONBOARDING / DEMO DATA ========== */}
      {showDemoData && (
        <div className="onboarding-container">
          <img src="/no-data.png" alt="Nessun Dato" />
          <h2>Benvenuto nella Gestione Strutture!</h2>
          <p>
            Sembra che tu non abbia ancora aggiunto stanze o alloggi. Puoi
            iniziare aggiungendo manualmente le tue informazioni qui sotto,
            oppure caricare qualche esempio di dati demo.
          </p>
          <button onClick={handleLoadDemo}>
            <FaPlus /> Carica Dati Demo
          </button>
        </div>
      )}

      {/* ========== LISTA STANZE ========== */}
      {(filter === "all" || filter === "rooms") && rooms.length > 0 && (
        <div className="rooms-section">
          <h2>🛏 Stanze</h2>
          <div className="rooms-container">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <img src={room.image || "/default-room.jpg"} alt={room.name} />
                <div className="room-details">
                  <h3>{room.name}</h3>
                  <p>
                    <FaBed /> {room.type}
                  </p>
                  <p>💰 {room.price}€/notte</p>
                  <div className="room-actions">
                    <button>
                      <FaEdit /> Modifica
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id, "rooms")}>
                      <FaTrash /> Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== LISTA ALLOGGI ========== */}
      {(filter === "all" || filter === "properties") &&
        properties.length > 0 && (
          <div className="properties-section">
            <h2>🏡 Alloggi</h2>
            <div className="properties-container">
              {properties.map((prop) => (
                <div key={prop.id} className="property-card">
                  <img
                    src={prop.image || "/default-property.jpg"}
                    alt={prop.name}
                  />
                  <div className="property-details">
                    <h3>{prop.name}</h3>
                    <p>
                      <FaHome /> {prop.type}
                    </p>
                    <p>💰 {prop.price}€/notte</p>
                    <div className="property-actions">
                      <button>
                        <FaEdit /> Modifica
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(prop.id, "properties")}
                      >
                        <FaTrash /> Elimina
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ========== FORM DI AGGIUNTA STRUTTURA ========== */}
      <div className="add-room-form">
        <h2>➕ Aggiungi Nuova Struttura</h2>
        <p className="form-hint">
          Inserisci i dati per creare una nuova stanza o un nuovo alloggio
        </p>
        <input
          type="text"
          placeholder="Nome (es. Camera 101 o Villa Girasole)"
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
        <button onClick={handleAddRoom}>
          <FaPlus /> Aggiungi
        </button>
      </div>
    </div>
  );
};

export default Rooms;
