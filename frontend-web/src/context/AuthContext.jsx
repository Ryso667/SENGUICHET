import React, { createContext, useState, useContext, useEffect } from "react";
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
