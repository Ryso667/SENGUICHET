// Utilitaires de formatage des événements pour l'affichage
import { getDefaultImage } from '../config/images'
import { formaterBadgeDate } from './dateUtils'

// Formate un événement de l'API au format attendu par les cartes d'affichage
export function formaterPourEventCard(e) {
  const def = getDefaultImage(e.category)
  const { day, month } = formaterBadgeDate(e.date)
  const time = e.date ? new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
  const priceLabel = e.priceMin > 0
    ? `${e.priceMin.toLocaleString()}F${e.priceMax > e.priceMin ? ` – ${e.priceMax.toLocaleString()}F` : ''}`
    : '—'
  return {
    ...e,
    month, day, bg: def.bg, emoji: def.emoji, time, priceLabel,
  }
}
