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

// Formate une date au format jj-mm-aaaa (billet)
export function formatDateTicket(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    return `${j.padStart(2, '0')}-${m.padStart(2, '0')}-${a}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    }
  }
  return dateStr
}

// Vérifie si une date est passée (comparaison au jour, pas à l'heure)
// Retourne true si la date est avant aujourd'hui
export function estDatePassee(dateStr) {
  if (!dateStr) return false
  let d
  if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    d = new Date(dateStr)
  } else if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    d = new Date(parseInt(a), parseInt(m) - 1, parseInt(j))
  } else {
    const parts = dateStr.split(' ')
    if (parts.length >= 3) {
      const idx = MOIS.findIndex(m => m.toLowerCase().startsWith(parts[1].toLowerCase().substring(0, 3)))
      d = new Date(parseInt(parts[2]), idx, parseInt(parts[0]))
    } else {
      return false
    }
  }
  if (isNaN(d.getTime())) return false
  const maintenant = new Date()
  const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
  return d < aujourdhui
}

// Calcule le compte à rebours pour un événement à venir dans les 7 jours
// Retourne "Aujourd'hui", "Demain", "Dans Xj Yh", ou null si >7j ou passé
export function formaterCompteRebours(dateStr) {
  if (!dateStr) return null
  let d
  if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    d = new Date(dateStr)
  } else if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    d = new Date(parseInt(a), parseInt(m) - 1, parseInt(j))
  } else {
    const parts = dateStr.split(' ')
    if (parts.length >= 3) {
      const idx = MOIS.findIndex(m => m.toLowerCase().startsWith(parts[1].toLowerCase().substring(0, 3)))
      d = new Date(parseInt(parts[2]), idx, parseInt(parts[0]))
    } else {
      return null
    }
  }
  if (isNaN(d.getTime())) return null
  const maintenant = new Date()
  const diffMs = d.getTime() - maintenant.getTime()
  if (diffMs < 0) return null
  const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffJours === 0) return "Aujourd'hui"
  if (diffJours === 1) return "Demain"
  if (diffJours > 7) return null
  const diffHeures = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `Dans ${diffJours}j ${diffHeures}h`
}

// Formate une date ISO avec heure : jj-mm-aaaa hh:mm:ss (billet scanné)
export function formatDatetimeLong(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('T')) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const jj = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const sec = String(d.getSeconds()).padStart(2, '0')
      return `${jj}-${mm}-${d.getFullYear()} ${hh}:${min}:${sec}`
    }
  }
  return dateStr
}
