// Service de scan : vérification offline des QR codes avec HMAC-SHA256
// 4 étapes : parsing QR → HMAC → recherche locale → anti re-scan
import * as Crypto from 'expo-crypto'
import {
  chercherTicket, marquerUtilise, enregistrerScan,
  insererTickets, scansEnAttente, marquerScansSync,
  historiqueScans, historiqueScansAvecDetails,
  compterTickets, compterScansParResultat, viderTickets, viderScansEvenement,
} from '../database/database'
import { HMAC_SECRET } from '../config'

// 5 statuts possibles pour un scan (conforme Document Technique v1.0)
const RESULTATS = {
  VALIDE: 'VALIDE',
  DEJA_UTILISE: 'DEJA_UTILISE',
  EXPIRE: 'EXPIRE',
  INCONNU: 'INCONNU',
  FRAUDE: 'FRAUDE',
}

// Compare deux chaînes en temps constant pour éviter les attaques temporelles
function comparerTempsConstant(a, b) {
  if (a.length !== b.length) return false
  let resultat = 0
  for (let i = 0; i < a.length; i++) {
    resultat |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return resultat === 0
}

// Parse le JSON du QR code (string ou objet déjà parsé)
function parserQR(donnees) {
  try {
    return typeof donnees === 'string' ? JSON.parse(donnees) : donnees
  } catch {
    return null
  }
}

// Vérifie la signature HMAC-SHA256 (anti-contrefaçon)
// Concatène les champs dans l'ordre défini puis compare avec le HMAC du QR
async function verifierHMAC(qr) {
  const donnees = `${qr.uuid}|${qr.transaction_ref || ''}|${qr.timestamp || ''}|${qr.event_id || ''}|${qr.category || ''}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + HMAC_SECRET)
  return comparerTempsConstant(calcule, qr.hmac)
}

// Télécharge les tickets depuis le serveur vers SQLite locale
// Lance une erreur si le réseau ou l'API échoue (le caller gère le feedback)
export async function telechargerTickets(eventId, zone) {
  const { appelAPI } = await import('./apiService')
  const tickets = await appelAPI(`/scans/tickets/${eventId}`)
  await insererTickets(tickets)
  return tickets.length
}

// Vérification complète offline d'un billet (5 étapes, conforme Document Technique v1.0)
// Étape 1 : parsing QR → 2 : HMAC → 3 : expiration → 4 : recherche locale → 5 : anti re-scan
export async function verifierBillet(donneesQR) {
  const qr = parserQR(donneesQR)
  if (!qr) return { resultat: RESULTATS.INCONNU, message: 'QR code invalide' }

  // Étape 1 : parsing du QR (déjà fait ci-dessus)
  // Étape 2 : vérification HMAC (signature cryptographique)
  const hmacOk = await verifierHMAC(qr)
  const num = qr.transaction_ref || null
  const eventId = qr.event_id || null

  if (!hmacOk) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.FRAUDE, num, eventId)
    return { resultat: RESULTATS.FRAUDE, message: 'QR code falsifié 🚫' }
  }

  // Étape 3 : vérification expiration (anti-replay, tolérance 60s comme le serveur)
  if (qr.timestamp) {
    const age = Date.now() - new Date(qr.timestamp).getTime()
    if (age > 60000) {
      await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.EXPIRE, num, eventId)
      return { resultat: RESULTATS.EXPIRE, message: 'QR code expiré ⏳' }
    }
  }

  // Étape 4 : recherche du billet dans la base SQLite locale
  let ticket = await chercherTicket(qr.uuid)
  if (!ticket) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.INCONNU, num, eventId)
    return { resultat: RESULTATS.INCONNU, message: 'Billet non trouvé ❓' }
  }

  // Étape 5 : vérification anti re-scan (déjà utilisé ?)
  if (ticket.statut === 'UTILISE_LOCAL') {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.DEJA_UTILISE, num, eventId)
    return { resultat: RESULTATS.DEJA_UTILISE, message: 'Déjà scanné ⚠️' }
  }

  // Billet valide : marquer comme utilisé et enregistrer le scan
  await marquerUtilise(qr.uuid)
  await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.VALIDE, num, eventId)
  return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée ✅' }
}

// Synchronisation batch des scans offline vers le serveur (quand connexion rétablie)
export async function synchroniser() {
  try {
    const enAttente = await scansEnAttente()
    if (enAttente.length === 0) return { sync: true, message: 'Rien à synchroniser' }
    const { appelAPI } = await import('./apiService')
    await appelAPI('/scans/sync', { method: 'POST', body: enAttente })
    await marquerScansSync()
    return { sync: true, message: 'Scans synchronisés' }
  } catch {
    return { sync: false, message: 'Impossible de se connecter au serveur' }
  }
}

// Récupère l'historique des scans enrichi, filtré par événement si eventId fourni
export async function getHistorique(eventId) {
  return await historiqueScansAvecDetails(eventId)
}

// Statistiques détaillées : tickets locaux + répartition des résultats de scan
export async function getStats() {
  const ticketsLocaux = await compterTickets()
  const parResultat = await compterScansParResultat()
  const stats = { ticketsLocaux }
  for (const r of parResultat) {
    stats[r.resultat] = r.nombre
  }
  return stats
}

// Réinitialisation complète de la base SQLite
export async function reinitialiser() {
  await viderTickets()
}

// Réinitialisation des scans d'un événement spécifique
// Efface les scans et remet les tickets à DISPONIBLE pour l'eventId donné
export async function reinitialiserEvenement(eventId) {
  await viderScansEvenement(eventId)
}
