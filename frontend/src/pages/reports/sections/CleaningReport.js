import React, { useState, useEffect } from "react";
import { getCleaningReport } from "../../services/reportsApi";
import "../../../styles/CleaningReport.css";

const CleaningReport = () => {
  const [cleaningTasks, setCleaningTasks] = useState([]);

  useEffect(() => {
    getCleaningReport()
      .then((response) => setCleaningTasks(response.data))
      .catch((error) =>
        console.error("Errore nel recupero dei dati sulle pulizie:", error)
      );
  }, []);

  return (
    <div className="cleaning-report">
      <h1>Report Pulizie</h1>
      <table>
        <thead>
          <tr>
            <th>Stanza</th>
            <th>Stato Pulizia</th>
            <th>Ultima Pulizia</th>
            <th>Responsabile</th>
          </tr>
        </thead>
        <tbody>
          {cleaningTasks.length > 0 ? (
            cleaningTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.roomNumber}</td>
                <td>{task.status}</td>
                <td>{new Date(task.lastCleaned).toLocaleDateString()}</td>
                <td>{task.assignedTo}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Nessun dato disponibile</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CleaningReport;
