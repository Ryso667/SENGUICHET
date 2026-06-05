import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center gap-6">
        <img
          src={logo}
          alt="SENGUICHET"
          style={{
            height: 100, width: "auto",
            animation: "pulseLogo 2s ease-in-out infinite",
          }}
        />
        <p style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.875rem" }}>
          Chargement...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
