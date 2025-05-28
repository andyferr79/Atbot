import React, { useState, useEffect } from "react";
import "../../styles/styles/MappingStep.css";

const MappingStep = ({ data = {}, onUpdate, onNext }) => {
  const [form, setForm] = useState({
    bookingPropertyTypeId: "",
    airbnbRoomId: "",
    agodaListingCode: "",
    hotelRunnerSync: false,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ...data,
    }));
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleNext = () => {
    onUpdate(form);
    onNext();
  };

  return (
    <div className="mapping-step">
      <h2>Mappatura OTA</h2>
      <p>
        Inserisci i codici esterni o seleziona i valori per completare la
        sincronizzazione.
      </p>

      <label>ID tipo struttura Booking.com *</label>
      <input
        name="bookingPropertyTypeId"
        placeholder="Es. 501 (Villa)"
        value={form.bookingPropertyTypeId}
        onChange={handleChange}
      />

      <label>ID stanza Airbnb *</label>
      <input
        name="airbnbRoomId"
        placeholder="Es. 12345678"
        value={form.airbnbRoomId}
        onChange={handleChange}
      />

      <label>Codice listing Agoda</label>
      <input
        name="agodaListingCode"
        placeholder="Es. AGA-0001"
        value={form.agodaListingCode}
        onChange={handleChange}
      />

      <label className="checkbox-label">
        <input
          type="checkbox"
          name="hotelRunnerSync"
          checked={form.hotelRunnerSync}
          onChange={handleChange}
        />
        Abilita sincronizzazione tramite HotelRunner
      </label>

      <div className="structure-footer">
        <button
          disabled={!form.bookingPropertyTypeId || !form.airbnbRoomId}
          onClick={handleNext}
          className="btn primary"
        >
          Avanti
        </button>
      </div>
    </div>
  );
};

export default MappingStep;
