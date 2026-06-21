// Utilitaire de recherche : normalise les chaînes pour une recherche insensible aux accents
// Utilise la normalisation Unicode NFD pour supprimer les diacritiques (é → e, à → a, etc.)

/**
 * Normalise une chaîne pour la comparaison :
 * retire les accents, passe en minuscules, et supprime les espaces superflus
 * @param {string|null|undefined} str - Chaîne à normaliser
 * @returns {string} Chaîne normalisée (vide si l'entrée est vide/null/undefined)
 */
export function normalizeSearch(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
