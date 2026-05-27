// Configuration des images et emojis par défaut pour chaque catégorie d'événement
// Sera remplacé par une API de gestion d'images
import { colors } from '../constants/theme'

const DEFAULTS = {
  Concert: { bg: '#6d28d9', emoji: '🎶', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/concert' },
  Festival: { bg: '#059669', emoji: '🎪', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/festival' },
  Théâtre: { bg: '#b91c1c', emoji: '🎭', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/theatre' },
  Sport: { bg: '#2563eb', emoji: '⚽', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/sport' },
  Conférence: { bg: '#1e293b', emoji: '🎤', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/conference' },
  Atelier: { bg: '#d97706', emoji: '🔧', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/atelier' },
  Exposition: { bg: '#7c3aed', emoji: '🖼️', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/exposition' },
  'Club / Soirée': { bg: '#db2777', emoji: '✨', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/soiree' },
  Gala: { bg: '#ca8a04', emoji: '💃', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/gala' },
}

const FALLBACK = { bg: colors.accent, emoji: '📅', poster: '' }

// Retourne la configuration (bg, emoji, poster) par défaut pour une catégorie donnée
// Si la catégorie n'existe pas, retourne FALLBACK (accent violet + 📅)
export function getDefaultImage(categorie) {
  return DEFAULTS[categorie] || FALLBACK
}
