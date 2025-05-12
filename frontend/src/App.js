import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";

import StayProDashboard from "./pages/StayProDashboard";
import Bookings from "./pages/Bookings";
import Guests from "./pages/Guests";
import Rooms from "./pages/Rooms";
import Suppliers from "./pages/Suppliers";
import Marketing from "./pages/Marketing";
import Settings from "./pages/settings/Settings";
import Reports from "./pages/reports/Reports";
import BookingsReport from "./pages/reports/sections/BookingsReport";
import FinancialReport from "./pages/reports/sections/FinancialReport";
import GeneralReport from "./pages/reports/sections/GeneralReport";
import SuppliersReport from "./pages/reports/sections/SuppliersReport";
import CleaningReport from "./pages/reports/sections/CleaningReport";
import MarketingReport from "./pages/reports/sections/MarketingReport";
import CustomersReport from "./pages/reports/sections/CustomersReport";
import AIInsights from "./pages/reports/sections/AIInsightsReport";
import Notifications from "./pages/notifications/Notifications";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import AgentHub from "./pages/AgentHub";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

import AgentAccess from "./pages/AgentAccess"; // ✅ Nuovo componente

import "./App.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

// ✅ Auto-login sviluppo
if (process.env.NODE_ENV !== "production") {
  const storedUid = localStorage.getItem("user_id");
  if (!storedUid) {
    signInWithEmailAndPassword(auth, "dev@test.com", "pistacchio79")
      .then(({ user }) => {
        localStorage.setItem("user_id", user.uid);
        console.log("✅ Login automatico (dev) con:", user.uid);
      })
      .catch((err) => {
        console.error("❌ Login auto dev:", err.code);
        if (err.code === "auth/user-not-found") {
          alert(
            "⚠️ Utente dev@test.com non esiste. Registralo una volta tramite il form o emulator."
          );
        }
      });
  }
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const hideLayout = ["/login", "/signup"].includes(location.pathname);
  return hideLayout ? (
    <>{children}</>
  ) : (
    <div className="app-container" style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, paddingLeft: "220px" }}>
        <TopBar />
        {children}
        <AgentAccess /> {/* ✅ Nuova sfera IA + Chatbox */}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            {/* Pubbliche */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protette */}
            <Route
              path="/"
              element={<ProtectedRoute element={<StayProDashboard />} />}
            />
            <Route
              path="/bookings"
              element={<ProtectedRoute element={<Bookings />} />}
            />
            <Route
              path="/guests"
              element={<ProtectedRoute element={<Guests />} />}
            />
            <Route
              path="/rooms"
              element={<ProtectedRoute element={<Rooms />} />}
            />
            <Route
              path="/suppliers"
              element={<ProtectedRoute element={<Suppliers />} />}
            />
            <Route
              path="/marketing"
              element={<ProtectedRoute element={<Marketing />} />}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute element={<Settings />} />}
            />
            <Route
              path="/reports"
              element={<ProtectedRoute element={<Reports />} />}
            />
            {/* Report sezioni */}
            <Route
              path="/reports/bookings"
              element={<ProtectedRoute element={<BookingsReport />} />}
            />
            <Route
              path="/reports/financial"
              element={<ProtectedRoute element={<FinancialReport />} />}
            />
            <Route
              path="/reports/general"
              element={<ProtectedRoute element={<GeneralReport />} />}
            />
            <Route
              path="/reports/suppliers"
              element={<ProtectedRoute element={<SuppliersReport />} />}
            />
            <Route
              path="/reports/cleaning"
              element={<ProtectedRoute element={<CleaningReport />} />}
            />
            <Route
              path="/reports/marketing"
              element={<ProtectedRoute element={<MarketingReport />} />}
            />
            <Route
              path="/reports/customers"
              element={<ProtectedRoute element={<CustomersReport />} />}
            />
            <Route
              path="/reports/ai-insights"
              element={<ProtectedRoute element={<AIInsights />} />}
            />
            {/* Extra */}
            <Route
              path="/notifications"
              element={<ProtectedRoute element={<Notifications />} />}
            />
            <Route
              path="/agent-hub"
              element={<ProtectedRoute element={<AgentHub />} />}
            />
            <Route
              path="/announcements"
              element={<ProtectedRoute element={<AnnouncementsPage />} />}
            />
            <Route
              path="/admin-dashboard"
              element={<ProtectedRoute element={<AdminDashboard />} />}
            />
          </Routes>
        </LayoutWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
