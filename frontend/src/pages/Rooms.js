import React, { useEffect, useState } from "react";
import api from "../services/api"; // Importa le API
import "../styles/Rooms.css"; // Stili CSS

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "",
    price: "",
    operatorId: "12345", // ID dell'operatore (puoi sostituirlo con uno dinamico)
  });
  const [isLoading, setIsLoading] = useState(true);

  // Recupera tutte le camere al caricamento della pagina
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms");
      setRooms(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Errore nel recupero delle camere:", error);
    }
  };

  const handleAddRoom = async () => {
    try {
      const response = await api.post("/rooms", newRoom);
      setRooms([...rooms, response.data]);
      setNewRoom({ name: "", type: "", price: "", operatorId: "12345" });
    } catch (error) {
      console.error("Errore nell'aggiunta della camera:", error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Errore nell'eliminazione della camera:", error);
    }
  };

  return (
    <div className="rooms-page">
      <h1>Gestione Camere</h1>
      {isLoading ? (
        <p>Caricamento...</p>
      ) : (
        <>
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Prezzo</th>
                <th>Operazioni</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.type}</td>
                  <td>€{room.price}</td>
                  <td>
                    <button onClick={() => handleDeleteRoom(room.id)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="add-room-form">
            <h2>Aggiungi Camera</h2>
            <input
              type="text"
              placeholder="Nome Camera"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tipo Camera"
              value={newRoom.type}
              onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
            />
            <input
              type="number"
              placeholder="Prezzo per notte"
              value={newRoom.price}
              onChange={(e) =>
                setNewRoom({ ...newRoom, price: e.target.value })
              }
            />
            <button onClick={handleAddRoom}>Aggiungi</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Rooms;
