// 📂 E:\\ATBot\\frontend\\src\\App.js
// ✅ Correzione completa per la visibilità della Sidebar

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
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
import Chatbox from "./pages/Chatbox";
import Notifications from "./pages/notifications/Notifications";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: "flex" }}>
        <Sidebar />
        <div className="main-content" style={{ flex: 1, paddingLeft: "220px" }}>
          <TopBar />
          <Routes>
            <Route path="/" element={<StayProDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/bookings" element={<BookingsReport />} />
            <Route path="/reports/financial" element={<FinancialReport />} />
            <Route path="/reports/general" element={<GeneralReport />} />
            <Route path="/reports/suppliers" element={<SuppliersReport />} />
            <Route path="/reports/cleaning" element={<CleaningReport />} />
            <Route path="/reports/marketing" element={<MarketingReport />} />
            <Route path="/reports/customers" element={<CustomersReport />} />
            <Route path="/reports/ai-insights" element={<AIInsights />} />
            <Route path="/chatbox" element={<Chatbox />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

/* 📂 Nota: Il layout è stato corretto con flexbox per garantire la visibilità della Sidebar. */
