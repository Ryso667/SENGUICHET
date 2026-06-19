const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const statutPaiement = async (reference) => {
  const res = await fetch(`${API_URL}/api/paiements/${reference}/statut`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
};
