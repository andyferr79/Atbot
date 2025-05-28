import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import "../../styles/styles/OTAContentChecklist.css";

const OTAContentChecklist = ({ progress = 0, checklist = [], onClick }) => {
  return (
    <div className="ota-checklist-box">
      <h3>📋 Contenuti richiesti per OTA</h3>
      <p>
        Completa i dati richiesti per abilitare la sincronizzazione con le OTA.
      </p>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
        <span>{progress}% completato</span>
      </div>

      <ul className="checklist">
        {checklist.map((item, index) => (
          <li key={index} className={item.ok ? "ok" : "missing"}>
            {item.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}{" "}
            {item.label}
          </li>
        ))}
      </ul>

      <button className="btn primary" onClick={onClick}>
        {progress === 100 ? "Rivedi contenuti" : "Completa ora"}
      </button>
    </div>
  );
};

export default OTAContentChecklist;
