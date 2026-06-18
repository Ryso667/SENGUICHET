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

export const listerEvenements = async () => {
  const res = await fetch(`${API_URL}/api/evenements`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const detailEvenement = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/${id}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminListerEvenements = async () => {
  const res = await fetch(`${API_URL}/api/evenements/admin/all`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminSuspendreEvenement = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/admin/${id}/suspendre`, {
    method: "PUT",
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminAccepterEvenement = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/admin/${id}/accepter`, {
    method: "PUT",
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminRefuserEvenement = async (id, commentaire) => {
  const res = await fetch(`${API_URL}/api/evenements/admin/${id}/refuser`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ commentaire }),
  });
  return handleResponse(res);
};

export const adminDetailEvenement = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/admin/${id}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

// ─── Demandes d'événements (workflow Organisateur → Admin) ───

export const soumettreDemandeEvenement = async (payload) => {
  const res = await fetch(`${API_URL}/api/demandes`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const listerMesDemandes = async () => {
  const res = await fetch(`${API_URL}/api/demandes`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const detailDemande = async (id) => {
  const res = await fetch(`${API_URL}/api/demandes/${id}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminListerDemandes = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/demandes/admin/all${query ? `?${query}` : ""}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminDetailDemande = async (id) => {
  const res = await fetch(`${API_URL}/api/demandes/admin/${id}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const adminTraiterDemande = async (id, action, commentaire = "") => {
  const res = await fetch(`${API_URL}/api/demandes/admin/${id}/traiter`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ action, commentaire }),
  });
  return handleResponse(res);
};

export const adminCreerEvenementDepuisDemande = async (id) => {
  const res = await fetch(`${API_URL}/api/demandes/admin/${id}/creer-evenement`, {
    method: "POST",
    headers: headers(),
  });
  return handleResponse(res);
};

export const listerCategories = async () => {
  const res = await fetch(`${API_URL}/api/evenements/categories`);
  return handleResponse(res);
};

// ─── Routes publiques ───

export const listerEvenementsPublic = async () => {
  const res = await fetch(`${API_URL}/api/evenements/public`);
  return handleResponse(res);
};

export const detailEvenementPublic = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/public/${id}`);
  return handleResponse(res);
};
