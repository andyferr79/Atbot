import React, { useState, useEffect } from "react";
import "../../../styles/MarketingReport.css";

const MarketingReport = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/reports/marketing")
      .then((response) => response.json())
      .then((data) => setCampaigns(data))
      .catch((error) =>
        console.error("Errore nel recupero dei dati di marketing:", error)
      );
  }, []);

  return (
    <div className="marketing-report">
      <h1>Report Marketing</h1>
      <table>
        <thead>
          <tr>
            <th>Nome Campagna</th>
            <th>Canale</th>
            <th>Budget</th>
            <th>Conversioni</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.name}</td>
                <td>{campaign.channel}</td>
                <td>${campaign.budget}</td>
                <td>{campaign.conversions}</td>
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

export default MarketingReport;
