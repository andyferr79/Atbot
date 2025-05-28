import React from "react";
import "../../styles/styles/FinalReviewStep.css";

const FinalReviewStep = ({ data = {}, onNext }) => {
  const safeLength = (val) =>
    Array.isArray(val)
      ? val.length
      : val && typeof val === "object"
      ? Object.keys(val).length
      : 0;

  const checklist = [
    {
      key: "structure",
      label: "Struttura",
      isValid: !!(data.structure && data.structure.name),
    },
    {
      key: "rooms",
      label: "Camere",
      isValid: safeLength(data.rooms) > 0,
    },
    {
      key: "photos",
      label: "Foto struttura",
      isValid: !!(
        data.photos &&
        Array.isArray(data.photos.structure) &&
        data.photos.structure.length > 0
      ),
    },
    {
      key: "translations",
      label: "Traduzioni",
      isValid: safeLength(data.translations) >= 5,
    },
    {
      key: "mapping",
      label: "Mappatura OTA",
      isValid:
        !!data.mapping?.bookingPropertyTypeId && !!data.mapping?.airbnbRoomId,
    },
  ];

  const completed = checklist.filter((c) => c.isValid).length;
  const total = checklist.length;
  const percent = Math.round((completed / total) * 100);
  const allValid = completed === total;

  const handleSync = () => {
    onNext();
  };

  return (
    <div className="final-review-step">
      <h2>Riepilogo finale</h2>
      <p>
        Controlla che tutti i dati siano completi prima della sincronizzazione
        OTA.
      </p>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${percent}%` }} />
        <span>{percent}% completato</span>
      </div>

      <ul className="checklist">
        {checklist.map((item) => (
          <li key={item.key} className={item.isValid ? "ok" : "missing"}>
            {item.isValid ? "✅" : "❌"} {item.label}
          </li>
        ))}
      </ul>

      {!allValid && (
        <p className="warning">
          ⚠️ Alcuni contenuti sono incompleti. Completa tutti i campi per
          evitare problemi con le OTA.
        </p>
      )}

      <div className="structure-footer">
        <button
          disabled={!allValid}
          onClick={handleSync}
          className="btn primary"
        >
          {allValid
            ? "Sincronizza con OTA"
            : "Completa prima tutti i contenuti"}
        </button>
      </div>
    </div>
  );
};

export default FinalReviewStep;
