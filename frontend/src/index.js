// 🔹 Importa il sistema di traduzioni PRIMA di tutto
import "./i18n";

import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// 🔒 Error Boundary globale
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("❌ Errore globale:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", fontSize: "18px" }}>
          ❗ Si è verificato un errore. Ricarica la pagina o contatta il
          supporto.
        </div>
      );
    }

    return this.props.children;
  }
}

// 🌐 Avviso se offline
window.addEventListener("offline", () => {
  alert(
    "⚠️ Connessione internet assente. Alcune funzionalità potrebbero non funzionare."
  );
});

// 🐞 Debug in sviluppo: mostra info utente
if (process.env.NODE_ENV === "development") {
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("firebaseToken");

  console.log("🧪 Debug: user_id =", userId);
  if (!userId || !token) {
    console.warn("⚠️ Attenzione: user_id o token non trovati in localStorage.");
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Suspense fallback={<div className="loading">Caricamento...</div>}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Suspense>
  </React.StrictMode>
);

// 📊 Performance (opzionale)
reportWebVitals();
