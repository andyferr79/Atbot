import React from "react";
import "../styles/StayProDashboard.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";

// 📊 Dati statici per i grafici
const prenotazioniGiornaliere = [
  { giorno: "Lun", prenotazioni: 12 },
  { giorno: "Mar", prenotazioni: 18 },
  { giorno: "Mer", prenotazioni: 15 },
  { giorno: "Gio", prenotazioni: 20 },
  { giorno: "Ven", prenotazioni: 25 },
  { giorno: "Sab", prenotazioni: 30 },
  { giorno: "Dom", prenotazioni: 28 },
];

const entrateMensili = [
  { mese: "Gen", entrate: 12000 },
  { mese: "Feb", entrate: 15000 },
  { mese: "Mar", entrate: 18000 },
  { mese: "Apr", entrate: 21000 },
];

const tassoOccupazione = [
  { tipo: "Singola", valore: 35 },
  { tipo: "Doppia", valore: 50 },
  { tipo: "Suite", valore: 15 },
];

const fontiPrenotazione = [
  { fonte: "Booking", ricavi: 5000 },
  { fonte: "Expedia", ricavi: 3500 },
  { fonte: "Sito Web", ricavi: 7000 },
];

const cancellazioniVsConfermate = [
  { mese: "Gen", confermate: 120, cancellazioni: 20 },
  { mese: "Feb", confermate: 140, cancellazioni: 25 },
  { mese: "Mar", confermate: 160, cancellazioni: 30 },
  { mese: "Apr", confermate: 180, cancellazioni: 40 },
];

const recensioniClienti = [
  {
    nome: "Andrea R.",
    rating: 5,
    commento: "Servizio impeccabile, tutto perfetto!",
  },
  {
    nome: "Giulia M.",
    rating: 4,
    commento: "Ottima esperienza, ci tornerò sicuramente!",
  },
  {
    nome: "Luca T.",
    rating: 3,
    commento: "Buona struttura, ma c'è spazio per migliorare.",
  },
  {
    nome: "Martina B.",
    rating: 5,
    commento: "Hotel favoloso, personale gentile e disponibile!",
  },
  {
    nome: "Riccardo P.",
    rating: 4,
    commento: "Molto bene, solo qualche dettaglio da migliorare.",
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// ⭐ FIX — Componente corretto che restituisce elementi React validi
const RatingStars = ({ rating }) => {
  return (
    <span className="stars">
      {[...Array(5)].map((_, index) => (
        <span key={index}>{index < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
};

const RecensioniClienti = () => (
  <section className="reviews-box">
    <h3>Ultime Recensioni dei Clienti</h3>
    <div className="reviews-list">
      {recensioniClienti.map((recensione, index) => (
        <div className="review" key={index}>
          <h4>{recensione.nome}</h4>
          <RatingStars rating={recensione.rating} />
          <p>"{recensione.commento}"</p>
        </div>
      ))}
    </div>
  </section>
);

const KeyStats = () => (
  <section className="key-stats">
    <div className="stat">
      <h2>Entrate</h2>
      <p>€12,000</p>
    </div>
    <div className="stat">
      <h2>Tasso di Occupazione</h2>
      <p>75%</p>
    </div>
    <div className="stat">
      <h2>Prenotazioni</h2>
      <p>120</p>
    </div>
  </section>
);

const Charts = () => (
  <section className="charts">
    <h2>Tendenze e Previsioni</h2>

    {/* Prenotazioni Giornaliere */}
    <div className="chart-box">
      <h3>Prenotazioni Giornaliere</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={prenotazioniGiornaliere}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="giorno" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="prenotazioni" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Entrate Mensili */}
    <div className="chart-box">
      <h3>Entrate Mensili</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={entrateMensili}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mese" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="entrate" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Fonti di Prenotazione */}
    <div className="chart-box">
      <h3>Fonti di Prenotazione</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={fontiPrenotazione}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fonte" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="ricavi" fill="#ff7300" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Tasso di Occupazione */}
    <div className="chart-box">
      <h3>Tasso di Occupazione per Tipo di Camera</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={tassoOccupazione}
            dataKey="valore"
            nameKey="tipo"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {tassoOccupazione.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Cancellazioni vs Confermate */}
    <div className="chart-box">
      <h3>Cancellazioni vs Prenotazioni Confermate</h3>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={cancellazioniVsConfermate}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mese" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="confermate" fill="#0088FE" />
          <Bar dataKey="cancellazioni" fill="#FF0000" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const StayProDashboard = () => (
  <div className="dashboard-container">
    <header className="dashboard-header">
      <h1>Dashboard StayPro</h1>
    </header>
    <KeyStats />
    <Charts />
    <RecensioniClienti />
  </div>
);

export default StayProDashboard;
