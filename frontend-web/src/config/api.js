/**
 * Configuration centralisée de l'URL de l'API backend
 * Détection automatique : production → URL Vercel, développement → localhost
 */
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://backend-beta-six-39.vercel.app"
    : "http://localhost:8080");

export default API_URL;
