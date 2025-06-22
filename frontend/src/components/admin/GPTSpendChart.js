// 📂 E:/ATBot/frontend/src/components/admin/GPTSpendChart.js

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import api from "../../services/api";

const GPTSpendChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSpending = async () => {
      try {
        const res = await api.get("/api/admin/ia/spending-today"); // ✅ rotta corretta
        setData(res.data);
      } catch (err) {
        console.error("❌ Errore nel recupero spesa GPT:", err);
      }
    };

    fetchSpending();
  }, []);

  if (!data) return <p>⏳ Caricamento spesa GPT...</p>;

  const chartData = {
    labels: ["Oggi"],
    datasets: [
      {
        label: "Token Usati",
        data: [data.total_tokens],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <Card>
      <CardContent>
        <p>📅 {data.date}</p>
        <h3>💰 Spesa GPT stimata: ${data.estimated_cost_usd}</h3>
        <Bar data={chartData} />
      </CardContent>
    </Card>
  );
};

export default GPTSpendChart;
