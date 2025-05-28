import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import "../../styles/styles/StructureInfoStep.css";

const StructureInfoStep = ({ data = {}, onUpdate, onNext }) => {
  const [form, setForm] = useState({
    name: "",
    type: "",
    address: "",
    description: "",
    checkin: "",
    checkout: "",
    policies: "",
  });

  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, ...data }));
  }, [data]);

  useEffect(() => {
    const complete =
      (form.name?.length || 0) > 3 &&
      form.type &&
      (form.address?.length || 0) > 5 &&
      (form.description?.length || 0) > 50 &&
      form.checkin &&
      form.checkout;
    setValid(complete);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoFill = () => {
    setLoading(true);
    setTimeout(() => {
      setForm({
        name: "Villa Paradiso",
        type: "Villa",
        address: "Via dei Fiori 23, Firenze, Italia",
        description:
          "Villa Paradiso è una residenza elegante immersa nella campagna toscana. Dispone di ampi spazi, piscina privata e vista panoramica.",
        checkin: "15:00",
        checkout: "10:00",
        policies:
          "Cancellazione gratuita entro 7 giorni dall'arrivo. Animali non ammessi.",
      });
      setLoading(false);
    }, 1200);
  };

  const handleNext = () => {
    onUpdate(form);
    onNext();
  };

  return (
    <div className="structure-form">
      <h2>Dati della Struttura</h2>
      <p>Inserisci le informazioni base richieste dalle OTA</p>

      <label>Nome struttura *</label>
      <input name="name" value={form.name || ""} onChange={handleChange} />

      <label>Tipo struttura *</label>
      <select name="type" value={form.type || ""} onChange={handleChange}>
        <option value="">Seleziona</option>
        <option value="Hotel">Hotel</option>
        <option value="B&B">B&B</option>
        <option value="Villa">Villa</option>
        <option value="Ostello">Ostello</option>
        <option value="Appartamento">Appartamento</option>
      </select>

      <label>Indirizzo completo *</label>
      <input
        name="address"
        value={form.address || ""}
        onChange={handleChange}
      />

      <label>Descrizione *</label>
      <textarea
        name="description"
        value={form.description || ""}
        onChange={handleChange}
        rows={4}
      />

      <label>Check-in *</label>
      <input
        name="checkin"
        type="time"
        value={form.checkin || ""}
        onChange={handleChange}
      />

      <label>Check-out *</label>
      <input
        name="checkout"
        type="time"
        value={form.checkout || ""}
        onChange={handleChange}
      />

      <label>Politiche opzionali</label>
      <textarea
        name="policies"
        value={form.policies || ""}
        onChange={handleChange}
        rows={3}
      />

      <div className="structure-footer">
        <button onClick={handleAutoFill} className="btn ghost">
          {loading ? (
            <Loader className="animate-spin" />
          ) : (
            "Compila automaticamente"
          )}
        </button>
        <button disabled={!valid} onClick={handleNext} className="btn primary">
          Avanti
        </button>
      </div>
    </div>
  );
};

export default StructureInfoStep;
