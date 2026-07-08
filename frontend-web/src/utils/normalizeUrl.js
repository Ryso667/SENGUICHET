/**
 * Utilitaire de normalisation des URLs d'images
 * Résout les URLs relatives (ex: /uploads/...) en URLs absolues
 * en utilisant l'URL de base du backend (VITE_API_URL)
 */
import API_URL from "../config/api";
const API_BASE = API_URL;

export const normalizeImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
};

export default normalizeImageUrl;
