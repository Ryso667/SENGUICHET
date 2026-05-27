// Utilitaires d'affichage de dates lisibles en français

const MOIS = ['janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre']

// Convertit une date stockée (dd/mm/yyyy ou "24 Mai 2026") en format lisible "24 mai 2026"
export function formaterDateLisible(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    return `${parseInt(j)} ${MOIS[parseInt(m) - 1]} ${a}`
  }
  const parts = dateStr.split(' ')
  if (parts.length >= 3) {
    const [j, m, a] = parts
    return `${parseInt(j)} ${m.toLowerCase()} ${a}`
  }
  return dateStr
}

// Extrait le jour et le mois abrégé pour le badge d'un EventCard
export function formaterBadgeDate(dateStr) {
  const lisible = formaterDateLisible(dateStr)
  if (!lisible) return { day: '', month: '' }
  const [j, m] = lisible.split(' ')
  return { day: j, month: m ? m.substring(0, 3).toUpperCase() : '' }
}
