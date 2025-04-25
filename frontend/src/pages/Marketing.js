// 📌 Marketing.js - Gestione Marketing
import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/Marketing.css";

const Marketing = () => {
  const [connectedAccounts, setConnectedAccounts] = useState({
    facebookPageId: null,
    googleAdsId: null,
    tiktokAdsId: null,
    mailchimpApiKey: null,
  });

  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const response = await api.get("/marketing/accounts");
        const userAccount = response.data.find((acc) => acc.userId === userId);

        if (userAccount) {
          setConnectedAccounts({
            facebookPageId: userAccount.facebookPageId || null,
            googleAdsId: userAccount.googleAdsId || null,
            tiktokAdsId: userAccount.tiktokAdsId || null,
            mailchimpApiKey: userAccount.mailchimpApiKey || null,
          });
        }
      } catch (error) {
        console.error("❌ Errore nel recupero degli account collegati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedAccounts();
  }, [userId]);

  const handleConnect = async (platform) => {
    try {
      const updatedAccounts = {
        ...connectedAccounts,
        [`${platform}Id`]: `mock_${platform}_id`,
      };

      await api.post("/marketing/accounts", {
        userId,
        facebookPageId: updatedAccounts.facebookPageId,
        googleAdsId: updatedAccounts.googleAdsId,
        tiktokAdsId: updatedAccounts.tiktokAdsId,
        mailchimpApiKey: updatedAccounts.mailchimpApiKey,
      });

      setConnectedAccounts(updatedAccounts);
    } catch (error) {
      console.error(`❌ Errore nella connessione di ${platform}:`, error);
    }
  };

  return (
    <div className="marketing-page">
      <div className="marketing-header">
        <h1>Gestione Marketing</h1>
        <button className="new-campaign-button">+ Nuova Campagna</button>
      </div>

      <section className="marketing-accounts">
        <h2>🔗 Collega i tuoi Account di Marketing</h2>
        <p>
          Connetti i tuoi account pubblicitari e social per gestire tutto da
          StayPro.
        </p>

        {loading ? (
          <p>⏳ Caricamento account...</p>
        ) : (
          <div className="account-links">
            <button
              className={`connect-button ${
                connectedAccounts.facebookPageId ? "connected" : ""
              }`}
              onClick={() => handleConnect("facebookPage")}
            >
              {connectedAccounts.facebookPageId
                ? "✅ Facebook & Instagram Connessi"
                : "🔵 Collega Facebook & Instagram"}
            </button>

            <button
              className={`connect-button ${
                connectedAccounts.googleAdsId ? "connected" : ""
              }`}
              onClick={() => handleConnect("googleAds")}
            >
              {connectedAccounts.googleAdsId
                ? "✅ Google Ads Connesso"
                : "🟢 Collega Google Ads"}
            </button>

            <button
              className={`connect-button ${
                connectedAccounts.tiktokAdsId ? "connected" : ""
              }`}
              onClick={() => handleConnect("tiktokAds")}
            >
              {connectedAccounts.tiktokAdsId
                ? "✅ TikTok Ads Connesso"
                : "🟣 Collega TikTok Ads"}
            </button>

            <button
              className={`connect-button ${
                connectedAccounts.mailchimpApiKey ? "connected" : ""
              }`}
              onClick={() => handleConnect("mailchimp")}
            >
              {connectedAccounts.mailchimpApiKey
                ? "✅ Mailchimp Connesso"
                : "✉️ Collega Mailchimp"}
            </button>
          </div>
        )}
      </section>

      <section className="marketing-dashboard">
        <h2>Dashboard delle Metriche</h2>
        <div className="metrics-container">
          <div className="metric">
            <h3>ROI</h3>
            <p>Grafico interattivo qui</p>
          </div>
          <div className="metric">
            <h3>CPC</h3>
            <p>Grafico interattivo qui</p>
          </div>
          <div className="metric">
            <h3>Tasso di Conversione</h3>
            <p>Grafico interattivo qui</p>
          </div>
        </div>
      </section>

      <section className="social-media-management">
        <h2>Gestione Social Media</h2>
        <div className="social-media-tools">
          <div className="calendar">
            <h3>Calendario Post</h3>
            <p>Calendario visivo qui</p>
          </div>
          <div className="post-generator">
            <h3>Generatore di Post</h3>
            <button>Genera Post con IA</button>
          </div>
        </div>
      </section>

      <section className="ads-management">
        <h2>Gestione Campagne Ads</h2>
        <p>Wizard guidato per configurare campagne pubblicitarie.</p>
      </section>

      <section className="promotions">
        <h2>Promozioni Personalizzate</h2>
        <button>Genera Offerta</button>
      </section>

      <section className="reviews">
        <h2>Analisi e Gestione delle Recensioni</h2>
        <p>Strumento per analisi delle recensioni degli ospiti.</p>
      </section>

      <section className="influencer-collaborations">
        <h2>Collaborazioni con Influencer</h2>
        <p>Trova e gestisci collaborazioni con influencer.</p>
      </section>
    </div>
  );
};

export default Marketing;
