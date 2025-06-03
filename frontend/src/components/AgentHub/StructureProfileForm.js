import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../../styles/StructureProfileForm.css";

const StructureProfileForm = () => {
  const userId = localStorage.getItem("user_id");

  const [formData, setFormData] = useState({
    name: "",
    structureType: "",
    style: "",
    description: "",
    address: "",
    city: "",
    country: "",
    geo: { lat: "", lng: "" },
    checkin: "",
    checkout: "",
    rules: [""],
    services: [""],
    extraServices: [""],
    animalsAllowed: false,
    languages: [""],
    maxGuests: "",
    rooms: "",
    preferredContact: "",
    phoneNumber: "",
    conventions: [""],
    transports: [""],
    shuttleService: false,
    accessibility: "",
    notes: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (name.includes(".")) {
      const [key, subkey] = name.split(".");
      setFormData({
        ...formData,
        [key]: { ...formData[key], [subkey]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogoAndGetURL = async () => {
    if (!logoFile) return null;
    setUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `logos/${userId}/logo.png`);
    await uploadBytes(storageRef, logoFile);
    const downloadURL = await getDownloadURL(storageRef);
    setUploading(false);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const logoUrl = await uploadLogoAndGetURL();
    const payload = { ...formData, user_id: userId };
    if (logoUrl) payload.logoUrl = logoUrl;

    // ✅ Converti geo
    if (payload.geo?.lat && payload.geo?.lng) {
      payload.geo.lat = parseFloat(payload.geo.lat);
      payload.geo.lng = parseFloat(payload.geo.lng);
    } else {
      delete payload.geo;
    }

    // ✅ Pulisci array vuoti
    [
      "rules",
      "services",
      "extraServices",
      "languages",
      "conventions",
      "transports",
    ].forEach((key) => {
      if (Array.isArray(payload[key])) {
        payload[key] = payload[key].filter((val) => val.trim() !== "");
        if (payload[key].length === 0) delete payload[key];
      }
    });

    const response = await fetch("http://localhost:8000/agent/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    alert(data.message || "Profilo salvato.");
  };

  return (
    <form className="structure-form" onSubmit={handleSubmit}>
      <h2>Profilo Struttura</h2>
      <p className="form-intro">
        Compila attentamente le informazioni della tua struttura. Il nostro
        Agente IA utilizzerà questi dati per generare risposte precise,
        suggerimenti mirati, analisi personalizzate e automazioni su misura.
      </p>

      <div className="full-width">
        <label>Nome struttura</label>
        <input name="name" value={formData.name} onChange={handleChange} />
        <span className="field-note">Es. Villa Sole, B&B VerdeMare...</span>
      </div>

      <div>
        <label>Tipo Struttura</label>
        <input
          name="structureType"
          value={formData.structureType}
          onChange={handleChange}
        />
        <span className="field-note">
          Es. Appartamento, Hotel, B&B, Agriturismo...
        </span>
      </div>

      <div>
        <label>Stile</label>
        <input name="style" value={formData.style} onChange={handleChange} />
        <span className="field-note">
          Es. Rustico, Moderno, Elegante, Minimal...
        </span>
      </div>

      <div className="full-width">
        <label>Descrizione</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
        <span className="field-note">
          Breve descrizione della struttura, servizi, atmosfera ecc.
        </span>
      </div>

      <div>
        <label>Indirizzo</label>
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Città</label>
        <input name="city" value={formData.city} onChange={handleChange} />
      </div>

      <div>
        <label>Paese</label>
        <input
          name="country"
          value={formData.country}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Latitudine</label>
        <input
          name="geo.lat"
          value={formData.geo.lat}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Longitudine</label>
        <input
          name="geo.lng"
          value={formData.geo.lng}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Check-in</label>
        <input
          name="checkin"
          value={formData.checkin}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Check-out</label>
        <input
          name="checkout"
          value={formData.checkout}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Animali Ammessi</label>
        <input
          type="checkbox"
          name="animalsAllowed"
          checked={formData.animalsAllowed}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Accessibilità</label>
        <input
          name="accessibility"
          value={formData.accessibility}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Contatto preferito</label>
        <input
          name="preferredContact"
          value={formData.preferredContact}
          onChange={handleChange}
        />
        <span className="field-note">Es. Email, WhatsApp, Telefono</span>
      </div>

      <div>
        <label>Telefono</label>
        <input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
      </div>

      <div className="full-width">
        <label>Note aggiuntive</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <div className="full-width">
        <label>Logo della struttura (max 500x500px)</label>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleLogoChange}
        />

        {logoPreview && (
          <div style={{ marginTop: "10px" }}>
            <strong>Anteprima:</strong>
            <br />
            <img
              src={logoPreview}
              alt="Logo Preview"
              style={{ maxWidth: "150px", borderRadius: "8px" }}
            />
          </div>
        )}

        {uploading && <p>⏳ Upload in corso...</p>}
      </div>

      <button type="submit">Salva Profilo</button>
    </form>
  );
};

export default StructureProfileForm;
