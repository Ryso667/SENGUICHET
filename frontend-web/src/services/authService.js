// Fichier : authService.js
// Rôle : Service d'appels API pour l'authentification (inscription, connexion, admin)

import axios from "axios";
import { getToken } from "../utils/storage";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ message: "Pas de connexion internet. Vérifiez votre réseau." });
    }
    return Promise.reject(error);
  }
);

export const inscriptionOrganisateur = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/organisateur/inscription`,
      data
    );
    return response.data;
  } catch (err) {
    // On propage l'erreur pour que le caller puisse la gérer
    console.error("Erreur inscriptionOrganisateur:", err.response?.data || err.message);
    throw err;
  }
};

export const connexionOrganisateur = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/organisateur/connexion`,
      data
    );
    return response.data;
  } catch (err) {
    console.error("Erreur connexionOrganisateur:", err.response?.data || err.message);
    throw err;
  }
};

export const connexionAdmin = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/admin/connexion`,
      data
    );
    return response.data;
  } catch (err) {
    console.error("Erreur connexionAdmin:", err.response?.data || err.message);
    throw err;
  }
};

export const connexionPartenaire = async (data) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/partenaire/connexion`,
      data
    );
    return response.data;
  } catch (err) {
    console.error("Erreur connexionPartenaire:", err.response?.data || err.message);
    throw err;
  }
};

export const adminListerOrganisateurs = async () => {
  const res = await fetch(`${BASE_URL}/api/auth/admin/organisateurs`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};

export const reinitialiserMotDePasseOrganisateur = async (id, nouveauMotDePasse) => {
  const res = await fetch(`${BASE_URL}/api/auth/admin/organisateurs/${id}/reinitialiser-mot-de-passe`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ nouveau_mot_de_passe: nouveauMotDePasse }),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};
