import React, { useEffect, useState } from "react";
import NewTaskModal from "./NewTaskModal"; // ✅ NUOVO
import "../../styles/AgentHub.css";

const ScheduledTasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = () => {
    fetch(
      "http://localhost:5001/staypro-backend/us-central1/getAutomationTasks",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .catch((err) =>
        console.error("❌ Errore caricamento task pianificati:", err)
      );
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="scheduler-tab-container">
      <div className="scheduler-header">
        <h2 className="hub-settings-title">🗓️ Automazioni Pianificate</h2>
        <button className="btn-add-task" onClick={() => setShowModal(true)}>
          ➕ Nuovo Task
        </button>
      </div>

      <div className="scheduler-list">
        {tasks.length === 0 && (
          <p className="text-muted-foreground">
            Nessun task pianificato trovato.
          </p>
        )}

        {tasks.map((task) => (
          <div key={task.id} className="scheduler-task-card">
            <div className="scheduler-task-row">
              <span className="task-label">🧠 Tipo:</span>
              <strong>{task.taskType}</strong>
            </div>
            <div className="scheduler-task-row">
              <span className="task-label">👤 Assegnato a:</span>
              <span>{task.assignedTo}</span>
            </div>
            <div className="scheduler-task-row">
              <span className="task-label">📅 Scadenza:</span>
              <span>{new Date(task.dueDate).toLocaleDateString("it-IT")}</span>
            </div>
            <div className="scheduler-task-row">
              <span className="task-label">📌 Creato il:</span>
              <span>
                {task.createdAt !== "N/A"
                  ? new Date(task.createdAt).toLocaleString("it-IT")
                  : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default ScheduledTasksTab;
