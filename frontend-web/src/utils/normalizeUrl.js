/**
 * Utilitaire de normalisation des URLs d'images
 * Résout les URLs relatives (ex: /uploads/...) en URLs absolues
 * en utilisant l'URL de base du backend (VITE_API_URL)
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const normalizeImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
};

export default normalizeImageUrl;
