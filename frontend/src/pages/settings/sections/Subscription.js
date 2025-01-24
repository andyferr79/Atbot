// Subscription.js - Gestione Abbonamento
import React, { useState } from "react";
import "../../../styles/Subscription.css";

const Subscription = () => {
  const [currentPlan, setCurrentPlan] = useState({
    name: "StayPro Plus",
    price: "69.99 €",
    features: [
      "Accesso completo a StayPro",
      "Gestione avanzata delle prenotazioni",
      "Supporto prioritario",
    ],
    renewalDate: "2025-02-01",
  });

  const [plans] = useState([
    {
      name: "StayPro Basic",
      price: "29.99 €",
      features: ["Gestione base delle prenotazioni", "Supporto standard"],
    },
    {
      name: "StayPro Plus",
      price: "69.99 €",
      features: [
        "Accesso completo a StayPro",
        "Gestione avanzata delle prenotazioni",
        "Supporto prioritario",
      ],
    },
    {
      name: "StayPro Premium",
      price: "99.99 €",
      features: [
        "Tutte le funzionalità di StayPro Plus",
        "Integrazione con strumenti avanzati",
        "Consulenza personalizzata",
      ],
    },
  ]);

  const [invoices] = useState([
    { id: 1, date: "2025-01-01", amount: "69.99 €", status: "Pagata" },
    { id: 2, date: "2024-12-01", amount: "69.99 €", status: "Pagata" },
    { id: 3, date: "2024-11-01", amount: "69.99 €", status: "Pagata" },
  ]);

  const [accountant, setAccountant] = useState({
    name: "Dott. Mario Rossi",
    email: "mario.rossi@example.com",
    phone: "+39 123 456 7890",
  });

  const handleChangePlan = (plan) => {
    if (plan.name === currentPlan.name) {
      alert("Hai già questo piano attivo.");
      return;
    }
    setCurrentPlan(plan);
    alert(`Piano aggiornato a ${plan.name}`);
  };

  const handleCancelSubscription = () => {
    const confirmCancel = window.confirm(
      "Sei sicuro di voler annullare il tuo abbonamento?"
    );
    if (confirmCancel) {
      setCurrentPlan(null);
      alert("Abbonamento annullato con successo.");
    }
  };

  const sendInvoiceToAccountant = (invoice) => {
    alert(`Fattura del ${invoice.date} inviata a ${accountant.name}`);
  };

  const updateAccountant = () => {
    const newName = prompt(
      "Inserisci il nuovo nome del commercialista:",
      accountant.name
    );
    const newEmail = prompt(
      "Inserisci la nuova email del commercialista:",
      accountant.email
    );
    const newPhone = prompt(
      "Inserisci il nuovo numero di telefono del commercialista:",
      accountant.phone
    );

    if (newName && newEmail && newPhone) {
      setAccountant({ name: newName, email: newEmail, phone: newPhone });
      alert("Contatti del commercialista aggiornati con successo.");
    } else {
      alert("Tutti i campi devono essere compilati.");
    }
  };

  return (
    <div className="subscription">
      <h2 className="section-title">Gestione Abbonamento</h2>
      <p className="section-description">
        Visualizza e gestisci il tuo piano di abbonamento.
      </p>

      {currentPlan ? (
        <div className="current-plan">
          <h3>Piano Attuale</h3>
          <p>
            <strong>Nome:</strong> {currentPlan.name}
          </p>
          <p>
            <strong>Prezzo:</strong> {currentPlan.price} / mese
          </p>
          <p>
            <strong>Prossimo rinnovo:</strong> {currentPlan.renewalDate}
          </p>
          <h4>Funzionalità incluse:</h4>
          <ul>
            {currentPlan.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <button className="cancel-button" onClick={handleCancelSubscription}>
            Annulla Abbonamento
          </button>
        </div>
      ) : (
        <p>Non hai un abbonamento attivo.</p>
      )}

      <div className="available-plans">
        <h3>Altri Piani Disponibili</h3>
        <div className="plans-container">
          {plans.map((plan, index) => (
            <div key={index} className="plan-card">
              <h4>{plan.name}</h4>
              <p>
                <strong>Prezzo:</strong> {plan.price} / mese
              </p>
              <h5>Funzionalità:</h5>
              <ul>
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <button
                className="change-plan-button"
                onClick={() => handleChangePlan(plan)}
              >
                Passa a {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="invoices-section">
        <h3>Storico Fatture</h3>
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Importo</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.date}</td>
                <td>{invoice.amount}</td>
                <td>{invoice.status}</td>
                <td>
                  <button
                    className="download-button"
                    onClick={() => alert(`Download fattura ${invoice.id}`)}
                  >
                    Scarica
                  </button>
                  <button
                    className="send-button"
                    onClick={() => sendInvoiceToAccountant(invoice)}
                  >
                    Invia al Commercialista
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="accountant-section">
        <h3>Contatti Commercialista</h3>
        <p>
          <strong>Nome:</strong> {accountant.name}
        </p>
        <p>
          <strong>Email:</strong> {accountant.email}
        </p>
        <p>
          <strong>Telefono:</strong> {accountant.phone}
        </p>
        <button className="edit-accountant-button" onClick={updateAccountant}>
          Modifica Contatti Commercialista
        </button>
      </div>
    </div>
  );
};

export default Subscription;
