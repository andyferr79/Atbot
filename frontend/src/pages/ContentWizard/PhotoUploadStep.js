import React, { useRef, useState } from "react";
import "../../styles/styles/PhotoUploadStep.css";

const PhotoUploadStep = ({ data = {}, onUpdate, onNext }) => {
  const photos = {
    structure: Array.isArray(data.structure) ? data.structure : [],
    rooms:
      typeof data.rooms === "object" && data.rooms !== null ? data.rooms : {},
  };

  const [structurePhotos, setStructurePhotos] = useState(photos.structure);
  const inputRef = useRef();

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    const updated = [...structurePhotos, ...previews];
    setStructurePhotos(updated);
    onUpdate({ ...photos, structure: updated });
  };

  const handleNext = () => {
    onUpdate({ ...photos, structure: structurePhotos });
    onNext();
  };

  return (
    <div className="photo-upload-form">
      <h2>Foto della Struttura</h2>
      <p>
        Carica almeno 1 foto di buona qualità. Formato consigliato: 1280x800px.
      </p>

      <div className="photo-preview-list">
        {structurePhotos.map((src, i) => (
          <div className="photo-box" key={i}>
            <img src={src} alt={`foto-${i}`} />
          </div>
        ))}
        {structurePhotos.length < 6 && (
          <div
            className="upload-placeholder"
            onClick={() => inputRef.current.click()}
          >
            + Aggiungi foto
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      <div className="structure-footer">
        <button
          disabled={structurePhotos.length === 0}
          onClick={handleNext}
          className="btn primary"
        >
          Avanti
        </button>
      </div>
    </div>
  );
};

export default PhotoUploadStep;
