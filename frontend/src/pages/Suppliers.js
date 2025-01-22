// Suppliers.js - Gestione Fornitori
import React, { useState, useEffect } from "react";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/api";
import "../styles/Suppliers.css";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuppliers();
      console.log("Dati ricevuti:", data);
      setSuppliers(data);
    } catch (err) {
      console.error("Errore nel recupero dei fornitori:", err);
      setError("Errore nel caricamento dei fornitori");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo fornitore?"))
      return;
    try {
      await deleteSupplier(id);
      setSuppliers((prevSuppliers) =>
        prevSuppliers.filter((supplier) => supplier.id !== id)
      );
      alert("Fornitore eliminato con successo");
    } catch (err) {
      console.error("Errore nell'eliminazione del fornitore:", err);
      alert("Errore nell'eliminazione del fornitore");
    }
  };

  const handleAddSupplier = async () => {
    const name = prompt("Inserisci il nome del nuovo fornitore:");
    const email = prompt("Inserisci l'email del fornitore:");
    const phone = prompt("Inserisci il numero di telefono del fornitore:");
    if (!name || !email) return;
    try {
      const newSupplier = {
        name,
        category: "Generale",
        status: "Attivo",
        contact: {
          email,
          phone,
        },
      };
      const addedSupplier = await addSupplier(newSupplier);
      setSuppliers((prevSuppliers) => [...prevSuppliers, addedSupplier]);
      alert("Fornitore aggiunto con successo");
    } catch (err) {
      console.error("Errore nell'aggiunta del fornitore:", err);
      alert("Errore nell'aggiunta del fornitore");
    }
  };

  const handleEditSupplier = async (supplier) => {
    const newName = prompt("Modifica il nome del fornitore:", supplier.name);
    const newEmail = prompt(
      "Modifica l'email del fornitore:",
      supplier.contact?.email
    );
    const newPhone = prompt(
      "Modifica il numero di telefono del fornitore:",
      supplier.contact?.phone
    );
    if (!newName || newName === supplier.name) return;

    try {
      const updatedSupplier = {
        ...supplier,
        name: newName,
        contact: {
          email: newEmail || supplier.contact?.email,
          phone: newPhone || supplier.contact?.phone,
        },
      };
      await updateSupplier(supplier.id, updatedSupplier);
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((s) => (s.id === supplier.id ? updatedSupplier : s))
      );
      alert("Fornitore aggiornato con successo");
    } catch (err) {
      console.error("Errore nell'aggiornamento del fornitore:", err);
      alert("Errore nell'aggiornamento del fornitore");
    }
  };

  const filteredSuppliers = Array.isArray(suppliers)
    ? suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="suppliers-page">
      {/* Header */}
      <div className="suppliers-header">
        <h1>Gestione Fornitori</h1>
        <button className="add-supplier-button" onClick={handleAddSupplier}>
          + Aggiungi Fornitore
        </button>
        <input
          type="text"
          placeholder="Cerca fornitori..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-bar"
        />
      </div>

      {/* Loading e Errori */}
      {loading && <p>Caricamento in corso...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Table */}
      <div className="suppliers-table">
        {filteredSuppliers.length === 0 ? (
          <p>Nessun fornitore trovato</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.category}</td>
                  <td>{supplier.contact?.email || "Non disponibile"}</td>
                  <td>{supplier.contact?.phone || "Non disponibile"}</td>
                  <td>{supplier.status}</td>
                  <td>
                    <button
                      onClick={() => setSelectedSupplier(supplier)}
                      className="view-button"
                    >
                      Visualizza
                    </button>
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="edit-button"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="archive-button"
                    >
                      Archivia
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Supplier Details */}
      {selectedSupplier && (
        <div className="supplier-details">
          <h2>Dettagli Fornitore</h2>
          <p>
            <strong>Nome:</strong> {selectedSupplier.name}
          </p>
          <p>
            <strong>Categoria:</strong> {selectedSupplier.category}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {selectedSupplier.contact?.email || "Non disponibile"}
          </p>
          <p>
            <strong>Telefono:</strong>{" "}
            {selectedSupplier.contact?.phone || "Non disponibile"}
          </p>
          <p>
            <strong>Stato:</strong> {selectedSupplier.status}
          </p>
          <button
            className="close-details-button"
            onClick={() => setSelectedSupplier(null)}
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
