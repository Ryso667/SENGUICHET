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

export const creerEvenement = async (payload) => {
  const res = await fetch(`${API_URL}/api/evenements`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
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

export const modifierEvenement = async (id, payload) => {
  const res = await fetch(`${API_URL}/api/evenements/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const annulerEvenement = async (id) => {
  const res = await fetch(`${API_URL}/api/evenements/${id}/annuler`, {
    method: "PUT",
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
