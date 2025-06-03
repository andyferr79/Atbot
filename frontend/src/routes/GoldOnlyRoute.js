import React from "react";
import { Navigate } from "react-router-dom";

const GoldOnlyRoute = ({ children }) => {
  const userPlan = localStorage.getItem("plan");

  if (userPlan !== "gold") {
    alert("🔒 Questa funzione è disponibile solo per gli utenti Gold.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GoldOnlyRoute;
