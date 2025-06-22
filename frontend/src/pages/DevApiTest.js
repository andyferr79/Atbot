import React, { useEffect, useState } from "react";
import axios from "axios";

const endpointsToTest = [
  "/api/bookings",
  "/api/reports/bookings",
  "/api/backup",
  "/api/customers",
  "/api/reports-export",
  "/api/reports",
  "/api/reports-stats",
  "/api/channel-manager",
  "/api/channel-manager-sync",
  "/api/rooms",
  "/api/suppliers",
  "/api/suppliers-reports",
  "/api/notifications",
  "/api/announcements",
];

const DevApiTest = () => {
  const [results, setResults] = useState([]);
  const [token, setToken] = useState("");

  useEffect(() => {
    const loginAndTest = async () => {
      try {
        const loginRes = await axios.post(
          process.env.REACT_APP_FUNCTIONS_URL + "/login",
          {
            email: "dev@test.com",
            password: "pistacchio79",
          }
        );

        const idToken = loginRes.data.token;
        setToken(idToken);

        const testResults = await Promise.all(
          endpointsToTest.map(async (endpoint) => {
            const start = Date.now();
            try {
              const res = await axios.get(
                process.env.REACT_APP_FUNCTIONS_URL + endpoint,
                {
                  headers: { Authorization: `Bearer ${idToken}` },
                }
              );
              return {
                endpoint,
                status: res.status,
                time: Date.now() - start,
                ok: true,
              };
            } catch (err) {
              return {
                endpoint,
                status: err.response?.status || "N/A",
                message: err.response?.data?.error || err.message,
                time: Date.now() - start,
                ok: false,
              };
            }
          })
        );

        setResults(testResults);
      } catch (err) {
        console.error("❌ Login fallito:", err);
      }
    };

    loginAndTest();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🧪 Dev API Test</h1>
      <p>
        <strong>Token usato:</strong> {token.slice(0, 20)}... (lunghezza:{" "}
        {token.length})
      </p>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Status</th>
            <th>Tempo</th>
            <th>Esito</th>
            <th>Messaggio</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.endpoint}
              style={{ background: r.ok ? "#d4edda" : "#f8d7da" }}
            >
              <td>{r.endpoint}</td>
              <td>{r.status}</td>
              <td>{r.time}ms</td>
              <td>{r.ok ? "✅ OK" : "❌ Errore"}</td>
              <td>{r.message || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DevApiTest;
