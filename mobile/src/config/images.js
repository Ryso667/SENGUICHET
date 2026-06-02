// Configuration des icônes et couleurs par défaut pour chaque catégorie d'événement
// Utilise MaterialCommunityIcons pour les icônes vectorielles
// Les images de fond sont des URLs directes Unsplash (photos de fête)
// Sera remplacé par une API de gestion d'images
import { colors } from '../constants/theme'

// Images de fête Unsplash en URLs directes (sans API key)
const CATEGORY_IMAGES = {
  Concert: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
  Festival: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  Théâtre: 'https://images.unsplash.com/photo-1503095396548-64d3e381df58?auto=format&fit=crop&w=800&q=80',
  Theatre: 'https://images.unsplash.com/photo-1503095396548-64d3e381df58?auto=format&fit=crop&w=800&q=80',
  Sport: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?auto=format&fit=crop&w=800&q=80',
  Conference: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  Conférence: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  Atelier: 'https://images.unsplash.com/photo-1519742765956-3d6e8a8e0c0f?auto=format&fit=crop&w=800&q=80',
  Exposition: 'https://images.unsplash.com/photo-1531913764164-f85c35d4b3f4?auto=format&fit=crop&w=800&q=80',
  'Club / Soirée': 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?auto=format&fit=crop&w=800&q=80',
  Gala: 'https://images.unsplash.com/photo-1511795404834-ef07a831a7ad?auto=format&fit=crop&w=800&q=80',
}

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
