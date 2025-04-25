// 📂 src/pages/StayProDashboard.js
import React, { useEffect, useState } from "react";
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
import { getDashboardOverview } from "../services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const RatingStars = ({ rating }) => (
  <span className="stars">
    {[...Array(5)].map((_, index) => (
      <span key={index}>{index < rating ? "★" : "☆"}</span>
    ))}
  </span>
);

const RecensioniClienti = ({ recensioni }) => (
  <section className="reviews-box">
    <h3>Ultime Recensioni dei Clienti</h3>
    <div className="reviews-list">
      {recensioni.length === 0 ? (
        <p>Nessuna recensione disponibile al momento.</p>
      ) : (
        recensioni.map((recensione, index) => (
          <div className="review" key={index}>
            <h4>{recensione.nome}</h4>
            <RatingStars rating={recensione.rating} />
            <p>"{recensione.commento}"</p>
          </div>
        ))
      )}
    </div>
  </section>
);

const KeyStats = ({ stats }) => (
  <section className="key-stats">
    <div className="stat">
      <h2>Entrate</h2>
      <p>€{stats.totalRevenue.toLocaleString()}</p>
    </div>
    <div className="stat">
      <h2>Tasso di Occupazione</h2>
      <p>{stats.occupancyRate}%</p>
    </div>
    <div className="stat">
      <h2>Prenotazioni</h2>
      <p>{stats.totalBookings}</p>
    </div>
    <div className="stat">
      <h2>Clienti Attivi</h2>
      <p>{stats.activeCustomers}</p>
    </div>
  </section>
);

const Charts = ({ charts }) => (
  <section className="charts">
    <h2>Tendenze e Previsioni</h2>

    <div className="chart-box">
      <h3>Prenotazioni Giornaliere</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={charts.dailyBookings}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="giorno" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="prenotazioni" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="chart-box">
      <h3>Entrate Mensili</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={charts.monthlyRevenue}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mese" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="entrate" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="chart-box">
      <h3>Fonti di Prenotazione</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={charts.bookingSources}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fonte" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="ricavi" fill="#ff7300" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="chart-box">
      <h3>Tasso di Occupazione per Tipo di Camera</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={charts.roomOccupancy}
            dataKey="valore"
            nameKey="tipo"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {charts.roomOccupancy.map((entry, index) => (
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

    <div className="chart-box">
      <h3>Cancellazioni vs Prenotazioni Confermate</h3>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={charts.cancellationsVsConfirmed}>
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

const StayProDashboard = () => {
  const [overview, setOverview] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const { data } = await getDashboardOverview(userId);
        setOverview(data);
      } catch (error) {
        console.error("Errore nel caricamento della dashboard:", error);
      }
    };
    if (userId) fetchOverview();
  }, [userId]);

  if (!overview) return <div className="loading">Caricamento dashboard...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard StayPro</h1>
        <p>Benvenuto! Qui trovi un riepilogo completo della tua attività.</p>
      </header>
      <KeyStats stats={overview} />
      <Charts charts={overview} />
      <RecensioniClienti recensioni={overview.reviews || []} />
    </div>
  );
};

export default StayProDashboard;
