// Configuration des icônes et couleurs par défaut pour chaque catégorie d'événement
// Utilise MaterialCommunityIcons pour les icônes vectorielles
// Sera remplacé par une API de gestion d'images
import { colors } from '../constants/theme'

const DEFAULTS = {
  Concert: { bg: '#6d28d9', icon: 'music', emoji: '🎶', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/concert' },
  Festival: { bg: '#059669', icon: 'tent', emoji: '🎪', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/festival' },
  Théâtre: { bg: '#b91c1c', icon: 'theater-masks', emoji: '🎭', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/theatre' },
  Sport: { bg: '#2563eb', icon: 'soccer', emoji: '⚽', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/sport' },
  Conférence: { bg: '#1e293b', icon: 'microphone', emoji: '🎤', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/conference' },
  Atelier: { bg: '#d97706', icon: 'wrench', emoji: '🔧', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/atelier' },
  Exposition: { bg: '#7c3aed', icon: 'image-frame', emoji: '🖼️', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/exposition' },
  'Club / Soirée': { bg: '#db2777', icon: 'star', emoji: '✨', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/soiree' },
  Gala: { bg: '#ca8a04', icon: 'dance-ballroom', emoji: '💃', poster: 'https://res.cloudinary.com/demo/image/upload/v1/senguichet/defaults/gala' },
}

const FALLBACK = { bg: colors.accent, icon: 'calendar', emoji: '📅', poster: '' }

// Retourne la configuration (bg, icon, emoji, poster) par défaut pour une catégorie donnée
// icon : nom MaterialCommunityIcons — préféré aux emoji pour les composants UI
// emoji : conservé pour la rétrocompatibilité (mocks, migration)
export function getDefaultImage(categorie) {
  return DEFAULTS[categorie] || FALLBACK
}

// Retourne uniquement le nom MaterialCommunityIcons de la catégorie
export function getCategoryIconName(categorie) {
  return getDefaultImage(categorie).icon
}
