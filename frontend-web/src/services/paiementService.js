import API_URL from "../config/api";

export const statutPaiement = async (reference) => {
  const res = await fetch(`${API_URL}/api/paiements/${reference}/statut`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
};
