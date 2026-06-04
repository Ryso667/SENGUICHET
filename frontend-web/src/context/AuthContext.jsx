// Fichier : AuthContext.jsx
// Rôle : Contexte d'authentification — stocke le JWT, décode le payload pour extraire le rôle et les infos utilisateur
// Note : Les données utilisateur proviennent du JWT déchiffré côté client, jamais du localStorage en clair

import React, { createContext, useState, useContext, useEffect } from "react";
import { getToken, saveToken, clearAll } from "../utils/storage";

// Décode le payload d'un JWT sans bibliothèque externe
const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      const decoded = decodeJwtPayload(storedToken);
      if (decoded) {
        setToken(storedToken);
        // Les infos utilisateur sont extraites du JWT, pas du localStorage
        setUser({ email: decoded.email, role: decoded.role, nom: decoded.nom || decoded.email });
        setIsAuthenticated(true);
        setUserRole(decoded.role);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, tokenValue) => {
    saveToken(tokenValue);
    setToken(tokenValue);
    // Décoder le JWT pour obtenir les vraies infos plutôt que stocker en clair
    const decoded = decodeJwtPayload(tokenValue);
    const safeUser = decoded
      ? { email: decoded.email, role: decoded.role, nom: decoded.nom || decoded.email }
      : userData;
    setUser(safeUser);
    setIsAuthenticated(true);
    setUserRole(safeUser.role);
  };

  const logout = () => {
    clearAll();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, userRole, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
