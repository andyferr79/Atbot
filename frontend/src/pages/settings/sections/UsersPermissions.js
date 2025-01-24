// UsersPermissions.js - Gestione Collaboratori e Permessi
import React, { useState } from "react";
import "../../../styles/UsersPermissions.css";

const UsersPermissions = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    role: "",
    sector: "",
  });
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [filter, setFilter] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCollaborator((prev) => ({ ...prev, [name]: value }));
  };

  const addCollaborator = () => {
    if (
      newCollaborator.name &&
      newCollaborator.email &&
      newCollaborator.role &&
      newCollaborator.sector
    ) {
      setCollaborators([
        ...collaborators,
        { ...newCollaborator, id: Date.now(), status: "Attivo" },
      ]);
      setNewCollaborator({ name: "", email: "", role: "", sector: "" });
      alert("Collaboratore aggiunto con successo!");
    } else {
      alert("Compila tutti i campi richiesti.");
    }
  };

  const removeCollaborator = (id) => {
    setCollaborators(collaborators.filter((collab) => collab.id !== id));
    alert("Collaboratore rimosso con successo!");
  };

  const filteredCollaborators = collaborators.filter(
    (collab) =>
      collab.name.toLowerCase().includes(filter.toLowerCase()) ||
      collab.sector.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="users-permissions">
      <h2 className="section-title">Gestione Collaboratori e Permessi</h2>
      <p className="section-description">
        Gestisci i collaboratori della struttura e assegna loro i permessi.
      </p>

      {selectedCollaborator ? (
        <div className="collaborator-details">
          <h3>Dettagli Collaboratore</h3>
          <p>
            <strong>Nome:</strong> {selectedCollaborator.name}
          </p>
          <p>
            <strong>Email:</strong> {selectedCollaborator.email}
          </p>
          <p>
            <strong>Ruolo:</strong> {selectedCollaborator.role}
          </p>
          <p>
            <strong>Settore:</strong> {selectedCollaborator.sector}
          </p>
          <p>
            <strong>Stato:</strong> {selectedCollaborator.status}
          </p>
          <button
            className="back-button"
            onClick={() => setSelectedCollaborator(null)}
          >
            Torna Indietro
          </button>
        </div>
      ) : (
        <>
          {/* Aggiungi Collaboratore */}
          <div className="add-collaborator-section">
            <h3>Aggiungi Collaboratore</h3>
            <label>
              Nome:
              <input
                type="text"
                name="name"
                value={newCollaborator.name}
                onChange={handleInputChange}
                placeholder="Inserisci il nome"
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={newCollaborator.email}
                onChange={handleInputChange}
                placeholder="Inserisci l'email"
              />
            </label>
            <label>
              Ruolo:
              <select
                name="role"
                value={newCollaborator.role}
                onChange={handleInputChange}
              >
                <option value="">Seleziona un ruolo</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </label>
            <label>
              Settore:
              <select
                name="sector"
                value={newCollaborator.sector}
                onChange={handleInputChange}
              >
                <option value="">Seleziona un settore</option>
                <option value="Pulizia">Pulizia</option>
                <option value="Bar">Bar</option>
                <option value="Cucina">Cucina</option>
                <option value="Lavanderia">Lavanderia</option>
                <option value="Manutenzione">Manutenzione</option>
                <option value="Amministrazione">Amministrazione</option>
              </select>
            </label>
            <button className="add-button" onClick={addCollaborator}>
              Aggiungi Collaboratore
            </button>
          </div>

          {/* Filtra Collaboratori */}
          <div className="filter-section">
            <h3>Filtra Collaboratori</h3>
            <input
              type="text"
              placeholder="Cerca per nome o settore"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Elenco Collaboratori */}
          <div className="collaborators-list">
            <h3>Elenco Collaboratori</h3>
            {filteredCollaborators.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Settore</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborators.map((collab) => (
                    <tr key={collab.id}>
                      <td>{collab.name}</td>
                      <td>{collab.email}</td>
                      <td>{collab.role}</td>
                      <td>{collab.sector}</td>
                      <td>{collab.status}</td>
                      <td>
                        <button
                          className="view-button"
                          onClick={() => setSelectedCollaborator(collab)}
                        >
                          Visualizza
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => removeCollaborator(collab.id)}
                        >
                          Rimuovi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nessun collaboratore trovato.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPermissions;
