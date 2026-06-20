import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { getToken, getUser, saveToken, saveUser, clearAll } from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsAuthenticated(true);
      setUserRole(storedUser.role);
    }
    setIsLoading(false);
  }, []);

  const login = (userData, tokenValue) => {
    saveToken(tokenValue);
    saveUser(userData);
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
    setUserRole(userData.role);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("@senguichet_acheteur_email");
    localStorage.removeItem("@senguichet_acheteur_email_suggestion");
    localStorage.removeItem("@senguichet_role");
    sessionStorage.removeItem("@senguichet_jwt");
    localStorage.removeItem("@senguichet_profil");
    clearAll();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
  }, []);

  const connecterAcheteurOTP = useCallback((email, code) => {
    return new Promise(async (resolve, reject) => {
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const res = await fetch(`${BASE_URL}/api/auth/acheteur/verifier-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Code invalide");
        const userData = { id: data.user.id, email: data.user.email, role: "ACHETEUR" };
        login(userData, data.token);
        localStorage.setItem("@senguichet_role", "acheteur");
        localStorage.setItem("@senguichet_acheteur_email", email);
        localStorage.setItem("@senguichet_acheteur_email_suggestion", email);
        sessionStorage.setItem("@senguichet_jwt", data.token);
        localStorage.setItem("@senguichet_profil", JSON.stringify({ nom: "", email }));
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  }, [login]);

  // Crée une session acheteur légère sans OTP (utilisé après paiement)
  // Permet à l'utilisateur de voir ses billets sans passer par la connexion OTP
  const setBuyerSession = useCallback((email) => {
    const token = "buyer_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const userData = { id: null, email, role: "ACHETEUR" };
    login(userData, token);
    localStorage.setItem("@senguichet_role", "acheteur");
    localStorage.setItem("@senguichet_acheteur_email", email);
    localStorage.setItem("@senguichet_acheteur_email_suggestion", email);
    sessionStorage.setItem("@senguichet_jwt", token);
    localStorage.setItem("@senguichet_profil", JSON.stringify({ nom: "", email }));
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, userRole, isLoading, userEmail: user?.email || null, login, logout, connecterAcheteurOTP, setBuyerSession }}>
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
