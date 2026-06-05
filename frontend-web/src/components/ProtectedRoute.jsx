// Fichier : ProtectedRoute.jsx
// Rôle : Route protégée — vérifie l'authentification et le rôle via le JWT (pas le localStorage)
// Note : Le rôle est extrait du payload JWT côté client, ce qui est moins sûr qu'une vérification
//        serveur, mais permet d'éviter la modification directe du localStorage

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../utils/storage";
import logo from "../assets/logo.jpg";

// Décode le payload d'un JWT sans bibliothèque externe
const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Vérification du rôle depuis le JWT plutôt que depuis le user stocké
  const token = getToken();
  const decoded = token ? decodeJwtPayload(token) : null;
  const userRole = decoded?.role || null;

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
