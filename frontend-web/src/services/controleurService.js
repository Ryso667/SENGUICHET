const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const getToken = () => localStorage.getItem("jwt_token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};

export const adminListerEvenementsControleurs = async () => {
  const res = await fetch(`${API_URL}/api/controleurs/evenements`, { headers: headers() });
  return handleResponse(res);
};

export const adminListerCodeControleur = async (evenementId) => {
  const res = await fetch(`${API_URL}/api/controleurs/${evenementId}`, { headers: headers() });
  return handleResponse(res);
};

export const adminRegenererCode = async (evenementId) => {
  const res = await fetch(`${API_URL}/api/controleurs/${evenementId}/regenerer`, { method: "POST", headers: headers() });
  return handleResponse(res);
};

export const adminDesactiverCode = async (evenementId) => {
  const res = await fetch(`${API_URL}/api/controleurs/${evenementId}/desactiver`, { method: "POST", headers: headers() });
  return handleResponse(res);
};
