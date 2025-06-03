// 📁 E:/ATBot/frontend/src/pages/auth/Subscribe.js
import React, { useState } from "react";
import { FaRocket, FaBriefcase } from "react-icons/fa";
import "../../styles/Subscribe.css";

const Subscribe = () => {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    company: "",
    vat: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo({ ...billingInfo, [name]: value });
  };

  const handleSubmit = () => {
    alert("✅ Dati ricevuti! Quando pronto collegherai Stripe qui.");
    console.log("Piano scelto:", selectedPlan);
    console.log("Dati di fatturazione:", billingInfo);
  };

  return (
    <div className="subscription-container">
      <h1 className="subscription-title">Abbonati a StayPro</h1>
      <p style={{ textAlign: "center", marginBottom: "2rem" }}>
        Scegli il piano più adatto alla tua struttura. L’abbonamento è mensile e
        puoi annullare in qualsiasi momento.
      </p>

      {step === 1 && (
        <div className="plan-grid">
          <div
            className={`plan-card ${selectedPlan === "base" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("base")}
          >
            <div className="plan-icon">
              <FaBriefcase />
            </div>
            <div className="plan-title">StayPro Base</div>
            <div className="plan-description">
              Tutto l’essenziale per iniziare:
              <ul style={{ textAlign: "left", marginTop: "0.5rem" }}>
                <li>✔️ Dashboard e gestione ospiti</li>
                <li>✔️ AI Check-in automatico</li>
                <li>✔️ Reportistica PDF</li>
                <li>❌ IA Marketing, Social, Upsell</li>
              </ul>
            </div>
            <div className="plan-price">€69,90 / mese</div>
          </div>

          <div
            className={`plan-card ${selectedPlan === "gold" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("gold")}
          >
            <div className="plan-icon">
              <FaRocket />
            </div>
            <div className="plan-title">StayPro Gold</div>
            <div className="plan-description">
              Include tutto e funzionalità avanzate:
              <ul style={{ textAlign: "left", marginTop: "0.5rem" }}>
                <li>✔️ Tutto nel Piano Base</li>
                <li>✔️ IA Marketing e automazioni</li>
                <li>✔️ Generazione contenuti social</li>
                <li>✔️ Dashboard avanzata e KPI</li>
              </ul>
            </div>
            <div className="plan-price">€129,90 / mese</div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            disabled={!selectedPlan}
            onClick={() => setStep(2)}
            className="subscribe-button"
          >
            Avanti
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step-form">
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Dati di fatturazione
          </h2>
          <input
            type="text"
            name="fullName"
            placeholder="Nome completo"
            value={billingInfo.fullName}
            onChange={handleChange}
          />
          <input
            type="text"
            name="company"
            placeholder="Ragione sociale (opzionale)"
            value={billingInfo.company}
            onChange={handleChange}
          />
          <input
            type="text"
            name="vat"
            placeholder="Partita IVA (opzionale)"
            value={billingInfo.vat}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email di fatturazione"
            value={billingInfo.email}
            onChange={handleChange}
          />
          <div
            className="buttons"
            style={{ marginTop: "1.5rem", textAlign: "center" }}
          >
            <button
              onClick={() => setStep(1)}
              className="subscribe-button"
              style={{ marginRight: "1rem" }}
            >
              Indietro
            </button>
            <button onClick={handleSubmit} className="subscribe-button">
              Conferma Abbonamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribe;
