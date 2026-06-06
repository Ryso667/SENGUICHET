/**
 * Utilitaire de normalisation des URLs d'images
 * Résout les URLs relatives (ex: /uploads/...) en URLs absolues
 * en utilisant l'hôte de la requête ou l'URL de base configurée
 */

const normalizeImageUrl = (url, req = null) => {
  if (!url) return null;
  // Déjà absolue
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative → construire l'URL absolue
  if (url.startsWith("/")) {
    if (req) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.get("host");
      if (host) return `${protocol}://${host}${url}`;
    }
    // Fallback : utiliser BACKEND_URL si défini, sinon retourner tel quel
    if (process.env.BACKEND_URL) return `${process.env.BACKEND_URL}${url}`;
  }
  return url;
};

module.exports = { normalizeImageUrl };
