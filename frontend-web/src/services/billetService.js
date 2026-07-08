import { getToken } from "../utils/storage";
import API_URL from "../config/api";

export const acheterBillet = async ({ evenementId, categorieTicketId, telephone, quantite = 1, provider = "WAVE", email }) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/billets/acheter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ evenementId, categorieTicketId, telephone, quantite, provider, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur lors de l'achat");
  return data;
};

// Achète des billets de plusieurs catégories en une seule requête
// Les catégories existantes sont fusionnées en un seul appel API
// { evenementId, telephone, categories: [ { categorieTicketId, quantite } ], provider?, email? }
export const acheterBillets = async ({ evenementId, telephone, categories, provider = "WAVE", email }) => {
  const token = getToken();
  const body = { evenementId, telephone, categories, provider };
  if (email) body.email = email;
  const res = await fetch(`${API_URL}/api/billets/acheter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur lors de l'achat");
  return data;
};

export const mesBillets = async (email) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/billets/mes-billets?email=${encodeURIComponent(email)}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
};
