/**
 * Service d'appels API pour les demandes de partenariat
 * Communique avec le backend sur /api/partenaires
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const getToken = () => localStorage.getItem("jwt_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};

/**
 * Soumet une demande de partenariat (public)
 * @param {Object} payload - Données du formulaire
 * @returns {Promise<Object>} { message, id }
 */
export const soumettreDemande = async (payload) => {
  const res = await fetch(`${API_URL}/api/partenaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * Liste toutes les demandes (admin)
 * @param {string} statut - Filtre optionnel
 * @returns {Promise<Array>}
 */
export const listerDemandes = async (statut) => {
  const qs = statut ? `?statut=${statut}` : "";
  const res = await fetch(`${API_URL}/api/partenaires${qs}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

/**
 * Détail d'une demande (admin)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const detailDemande = async (id) => {
  const res = await fetch(`${API_URL}/api/partenaires/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

/**
 * Traite une demande (admin)
 * @param {number} id
 * @param {Object} payload - { statut, note_admin }
 * @returns {Promise<Object>}
 */
export const traiterDemande = async (id, payload) => {
  const res = await fetch(`${API_URL}/api/partenaires/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * Statistiques des demandes (admin)
 * @returns {Promise<Object>}
 */
export const statsDemandes = async () => {
  const res = await fetch(`${API_URL}/api/partenaires/stats`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

/**
 * Crée des identifiants de connexion pour un partenaire (admin)
 * @param {Object} payload - { demande_id, email, mot_de_passe }
 * @returns {Promise<Object>} { message, id, email }
 */
export const creerIdentifiantsPartenaire = async (payload) => {
  const res = await fetch(`${API_URL}/api/partenaires/creer-identifiants`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * Liste les comptes partenaires créés (admin)
 * @returns {Promise<Array>}
 */
export const listerIdentifiants = async () => {
  const res = await fetch(`${API_URL}/api/partenaires/identifiants`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

/**
 * Réinitialise le mot de passe d'un partenaire (admin)
 * @param {number} id
 * @param {Object} payload - { nouveau_mot_de_passe }
 * @returns {Promise<Object>}
 */
export const reinitialiserMotDePasse = async (id, payload) => {
  const res = await fetch(`${API_URL}/api/partenaires/${id}/reinitialiser-mot-de-passe`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};
