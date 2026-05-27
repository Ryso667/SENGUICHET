// Utilitaires d'affichage de dates lisibles en français

const MOIS = ['janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre']

// Convertit une date stockée (dd/mm/yyyy, "24 Mai 2026" ou ISO) en format lisible "24 mai 2026"
export function formaterDateLisible(dateStr) {
  if (!dateStr) return ''
  // ISO (2026-05-24 ou 2026-05-24T...)
  if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
  }
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

// Affiche une date ISO complète avec l'heure : "26 mai 2026 à 14:30"
export function formaterDateHeure(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} à ${hh}:${mm}`
}

// Extrait le jour et le mois abrégé pour le badge d'un EventCard
export function formaterBadgeDate(dateStr) {
  const lisible = formaterDateLisible(dateStr)
  if (!lisible) return { day: '', month: '' }
  const [j, m] = lisible.split(' ')
  return { day: j, month: m ? m.substring(0, 3).toUpperCase() : '' }
}
