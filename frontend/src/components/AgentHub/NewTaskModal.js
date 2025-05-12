import React, { useState } from "react";
import "../../styles/AgentHub.css";

const NewTaskModal = ({ onClose, onCreated }) => {
  const [taskType, setTaskType] = useState("report_generation");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const assignedTo = localStorage.getItem("user_id"); // per ora user corrente
  const token = localStorage.getItem("firebaseToken");

  const handleCreate = async () => {
    if (!taskType || !dueDate) return;

    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5001/staypro-backend/us-central1/createAutomationTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskType,
            assignedTo,
            dueDate,
          }),
        }
      );

      const data = await res.json();
      console.log("✅ Task creato:", data);
      if (onCreated) onCreated(); // ricarica lista
      onClose();
    } catch (err) {
      console.error("❌ Errore creazione task:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ❌
        </button>

        <h3 className="modal-title">➕ Nuovo Task Pianificato</h3>

        <label className="modal-label">Tipo di Task</label>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="modal-input"
        >
          <option value="report_generation">Report settimanale</option>
          <option value="pricing">Ottimizzazione prezzi</option>
          <option value="checkin">Messaggio check-in</option>
          <option value="cleaning_summary">Riepilogo pulizie</option>
        </select>

        <label className="modal-label">Data Esecuzione</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="modal-input"
        />

        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel">
            Annulla
          </button>
          <button
            onClick={handleCreate}
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "⏳ Creazione..." : "✅ Crea Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTaskModal;
