import axios from "axios";
import API_URL from "../config/api";

const BASE_URL = API_URL;

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
    if (err.response) {
      return err.response.data;
    }
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
    if (err.response) {
      return err.response.data;
    }
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
    if (err.response) {
      return err.response.data;
    }
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
    if (err.response) {
      return err.response.data;
    }
    throw err;
  }
};

const getToken = () => localStorage.getItem("jwt_token");

export const adminListerOrganisateurs = async () => {
  const res = await fetch(`${BASE_URL}/api/auth/admin/organisateurs`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};

export const adminSupprimerOrganisateur = async (id) => {
  const res = await fetch(`${BASE_URL}/api/auth/admin/organisateurs/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};
