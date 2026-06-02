// Configuration des icônes et couleurs par défaut pour chaque catégorie d'événement
// Utilise MaterialCommunityIcons pour les icônes vectorielles
// Les images de fond sont des URLs directes Unsplash (photos de fête)
// Sera remplacé par une API de gestion d'images
import { colors } from '../constants/theme'

// Images de fête Unsplash en URLs directes — atmosphère chaleureuse, nuit, fête africaine
const CATEGORY_IMAGES = {
  Concert: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
  Festival: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80',
  Théâtre: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  Theatre: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  Sport: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  Conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  Conférence: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  Atelier: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  Exposition: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'Club / Soirée': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
  Gala: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'

const DEFAULTS = {
  Concert: { bg: '#6d28d9', icon: 'music', emoji: '🎶' },
  Festival: { bg: '#059669', icon: 'tent', emoji: '🎪' },
  Théâtre: { bg: '#b91c1c', icon: 'theater-masks', emoji: '🎭' },
  Sport: { bg: '#2563eb', icon: 'soccer', emoji: '⚽' },
  Conférence: { bg: '#1e293b', icon: 'microphone', emoji: '🎤' },
  Atelier: { bg: '#d97706', icon: 'wrench', emoji: '🔧' },
  Exposition: { bg: '#7c3aed', icon: 'image-frame', emoji: '🖼️' },
  'Club / Soirée': { bg: '#db2777', icon: 'star', emoji: '✨' },
  Gala: { bg: '#ca8a04', icon: 'dance-ballroom', emoji: '💃' },
}

const FALLBACK = { bg: colors.accent, icon: 'calendar', emoji: '📅', poster: '' }

// Retourne l'URL de l'image de fond Unsplash pour une catégorie donnée
export function getCategoryImageUrl(categorie) {
  return CATEGORY_IMAGES[categorie] || FALLBACK_IMAGE
}

// Retourne la configuration (bg, icon, emoji) par défaut pour une catégorie donnée
// icon : nom MaterialCommunityIcons — préféré aux emoji pour les composants UI
// emoji : conservé pour la rétrocompatibilité (mocks, migration)
export function getDefaultImage(categorie) {
  return DEFAULTS[categorie] || FALLBACK
}

// Retourne uniquement le nom MaterialCommunityIcons de la catégorie
export function getCategoryIconName(categorie) {
  return getDefaultImage(categorie).icon
}
