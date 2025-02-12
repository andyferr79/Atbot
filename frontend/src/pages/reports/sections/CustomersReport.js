import React, { useState, useEffect } from "react";
import "../../../styles/CustomersReport.css";

const CustomersReport = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/reports/customers")
      .then((response) => response.json())
      .then((data) => setCustomers(data))
      .catch((error) =>
        console.error("Errore nel recupero dei dati clienti:", error)
      );
  }, []);

  return (
    <div className="customers-report">
      <h1>Report Clienti</h1>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Prenotazioni Effettuate</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.bookings}</td>
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

export default CustomersReport;
