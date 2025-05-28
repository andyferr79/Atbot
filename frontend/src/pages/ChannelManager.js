import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";
import {
  Loader,
  RefreshCcw,
  Settings2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OTAContentChecklist from "../components/channel/OTAContentChecklist";
import "../styles/styles/ChannelManager.css";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

const OTAs = ["Booking.com", "Airbnb", "Expedia", "Agoda", "HotelRunner"];
const otaColors = {
  "Booking.com": "#2563eb",
  Airbnb: "#ef4444",
  Expedia: "#f59e0b",
  Agoda: "#10b981",
  HotelRunner: "#7c3aed",
};

const ChannelManager = () => {
  const [activeTab, setActiveTab] = useState("Booking.com");
  const [channelData, setChannelData] = useState({});
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState({});
  const [viewMode, setViewMode] = useState("monthly");
  const navigate = useNavigate();

  const fetchChannelStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/channel-manager", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const grouped = {};
      res.data.channels.forEach((channel) => {
        grouped[channel.name] = channel;
      });
      setChannelData(grouped);
    } catch (error) {
      console.error("Errore nel recupero OTA:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (ota) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/channel-manager/logs?ota=${ota}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs((prev) => ({ ...prev, [ota]: res.data.logs }));
    } catch (error) {
      console.error("Errore nel recupero log IA:", error);
    }
  };

  const handleSync = async (ota) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/channel-manager/sync",
        { channelName: ota },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchChannelStatus();
    } catch (error) {
      console.error("Errore sync:", error);
    }
  };

  useEffect(() => {
    fetchChannelStatus();
    OTAs.forEach(fetchLogs);
  }, []);

  const generateChartData = (name, mode) => {
    const bookings = channelData[name]?.bookings || [];
    if (mode === "weekly") {
      const labels = [];
      const values = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        const count = bookings.filter(
          (b) => new Date(b.date).toDateString() === date.toDateString()
        ).length;
        labels.push(label);
        values.push(count);
      }
      return {
        label: name,
        data: values,
        borderColor: otaColors[name] || "#22c55e",
        backgroundColor: (otaColors[name] || "#22c55e") + "33",
        tension: 0.3,
        fill: false,
        labels,
      };
    } else if (mode === "total") {
      const total = bookings.length;
      return {
        label: name,
        data: [total],
        borderColor: otaColors[name] || "#22c55e",
        backgroundColor: (otaColors[name] || "#22c55e") + "33",
        tension: 0.3,
        fill: false,
        labels: ["Totale"],
      };
    } else {
      const monthlyData = new Array(12).fill(0);
      bookings.forEach((b) => {
        const month = new Date(b.date).getMonth();
        monthlyData[month] += 1;
      });
      return {
        label: name,
        data: monthlyData,
        borderColor: otaColors[name] || "#22c55e",
        backgroundColor: (otaColors[name] || "#22c55e") + "33",
        tension: 0.3,
        fill: false,
        labels: [
          "Gen",
          "Feb",
          "Mar",
          "Apr",
          "Mag",
          "Giu",
          "Lug",
          "Ago",
          "Set",
          "Ott",
          "Nov",
          "Dic",
        ],
      };
    }
  };

  const generateCombinedChart = () => {
    const datasets = OTAs.map((ota) => generateChartData(ota, viewMode));
    const labels = generateChartData(OTAs[0], viewMode).labels;
    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <div className="channel-loading">
        <Loader className="loader-icon" /> Caricamento OTA...
      </div>
    );
  }

  const totalSync = OTAs.reduce(
    (acc, ota) => acc + (channelData[ota]?.status === "syncing" ? 1 : 0),
    0
  );

  return (
    <div className="channel-wrapper">
      <h1 className="channel-title">Channel Manager OTA</h1>

      <OTAContentChecklist
        progress={60}
        checklist={[
          { label: "Struttura", ok: true },
          { label: "Camere", ok: true },
          { label: "Foto", ok: false },
          { label: "Traduzioni", ok: false },
          { label: "Mappatura", ok: false },
        ]}
        onClick={() => navigate("/ota-content")}
      />

      <div className="channel-viewmode-switch">
        <label>Visualizzazione:&nbsp;</label>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <option value="weekly">Ultimi 7 giorni</option>
          <option value="monthly">Mensile</option>
          <option value="total">Totale</option>
        </select>
      </div>

      <div className="channel-overview">
        <div className="overview-box">
          <strong>{OTAs.length}</strong>
          <span>OTA collegate</span>
        </div>
        <div className="overview-box">
          <strong>{totalSync}</strong>
          <span>in sincronizzazione</span>
        </div>
        <div className="overview-box">
          <strong>{logs[activeTab]?.length || 0}</strong>
          <span>azioni recenti</span>
        </div>
      </div>

      <div
        className="channel-graph"
        style={{ marginBottom: "2rem", height: 140 }}
      >
        <h3 className="channel-graph-title">Andamento prenotazioni globale</h3>
        <Line data={generateCombinedChart()} options={chartOptions} />
      </div>

      <div className="channel-tabs">
        {OTAs.map((ota) => (
          <button
            key={ota}
            onClick={() => setActiveTab(ota)}
            className={`channel-tab ${
              activeTab === ota ? "channel-tab-active" : ""
            }`}
            style={{ borderColor: otaColors[ota], color: otaColors[ota] }}
          >
            {channelData[ota]?.error ? (
              <XCircle size={16} color="#dc2626" style={{ marginRight: 6 }} />
            ) : (
              <CheckCircle
                size={16}
                color="#16a34a"
                style={{ marginRight: 6 }}
              />
            )}
            {ota}
          </button>
        ))}
      </div>

      {OTAs.map(
        (ota) =>
          activeTab === ota && (
            <div key={ota} className="channel-card">
              <div className="channel-card-header">
                <h2 className="channel-card-title">{ota}</h2>
                <div className="channel-card-actions">
                  <button
                    className="channel-button"
                    onClick={() => handleSync(ota)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-1" /> Sync ora
                  </button>
                  <button className="channel-button channel-button-outline">
                    <Settings2 className="w-4 h-4 mr-1" /> Gestione Tariffe
                  </button>
                </div>
              </div>

              {channelData[ota] ? (
                <>
                  {channelData[ota].error && (
                    <div className="channel-error">
                      <AlertTriangle className="w-4 h-4" /> Errore sync:{" "}
                      {channelData[ota].error}
                    </div>
                  )}

                  <p className="channel-sync-info">
                    Ultima sincronizzazione:{" "}
                    {channelData[ota].lastSync || "N/A"}
                  </p>

                  <div className="channel-graph">
                    <Line
                      data={{
                        ...generateCombinedChart(),
                        datasets: [generateChartData(ota, viewMode)],
                        labels: generateChartData(ota, viewMode).labels,
                      }}
                      height={160}
                      options={chartOptions}
                    />
                  </div>

                  <div className="channel-log">
                    <h3>Log Azioni IA</h3>
                    <ul>
                      {(logs[ota] || []).map((log, i) => (
                        <li key={i}>
                          {log.details} ({log.timestamp})
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="channel-sync-info">Nessun dato disponibile.</p>
              )}
            </div>
          )
      )}
    </div>
  );
};

export default ChannelManager;
