// Service de scan : vérification offline des QR codes avec HMAC-SHA256
// 5 étapes : parsing QR → HMAC → expiration → recherche locale → anti re-scan
import * as Crypto from 'expo-crypto'
import {
  chercherTicket, marquerUtilise, enregistrerScan,
  insererTickets, scansEnAttente, marquerScansSync,
  historiqueScans, historiqueScansAvecDetails,
  compterTickets, compterScansParResultat, viderTickets,
} from '../database/database'
import { getHMACSecret } from './hmacService'

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
  const secret = await getHMACSecret()
  const donnees = `${qr.uuid}|${qr.transaction_ref}|${qr.timestamp}|${qr.event_id}|${qr.category}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + secret)
  return comparerTempsConstant(calcule, qr.hmac)
}

// Vérifie si le billet est expiré (date de validité dépassée)
function estExpire(timestamp) {
  return new Date(timestamp) < new Date()
}

// Télécharge les tickets depuis le serveur vers SQLite locale
export async function telechargerTickets(eventId, zone) {
  try {
    const { appelAPI } = await import('./apiService')
    const tickets = await appelAPI(`/evenements/${eventId}/tickets?zone=${zone}`)
    await insererTickets(tickets)
    return tickets.length
  } catch {
    return 0
  }
}

// Vérification complète offline d'un billet (5 étapes)
// Étape 1 : parsing QR → 2 : HMAC → 3 : expiration → 4 : recherche locale → 5 : anti re-scan
export async function verifierBillet(donneesQR) {
  const qr = parserQR(donneesQR)
  if (!qr) return { resultat: RESULTATS.INCONNU, message: 'QR code invalide' }

  // Étape 1 : parsing du QR (déjà fait ci-dessus)
  // Étape 2 : vérification HMAC (signature cryptographique)
  const hmacOk = await verifierHMAC(qr)
  if (!hmacOk) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.FRAUDE)
    return { resultat: RESULTATS.FRAUDE, message: 'Signature cryptographique invalide — alerte fraude' }
  }

  // Étape 3 : vérification de la date d'expiration
  if (estExpire(qr.timestamp)) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.EXPIRE)
    return { resultat: RESULTATS.EXPIRE, message: 'Billet expiré' }
  }

  // Étape 4 : recherche du billet dans la base SQLite locale
  let ticket = await chercherTicket(qr.uuid)
  if (!ticket) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.INCONNU)
    return { resultat: RESULTATS.INCONNU, message: 'Billet introuvable dans la base locale' }
  }

  // Étape 5 : vérification anti re-scan (déjà utilisé ?)
  if (ticket.statut === 'UTILISE_LOCAL') {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.DEJA_UTILISE)
    return { resultat: RESULTATS.DEJA_UTILISE, message: 'Billet déjà scanné sur cet appareil' }
  }

  // Billet valide : marquer comme utilisé et enregistrer le scan
  await marquerUtilise(qr.uuid)
  await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.VALIDE)
  return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée' }
}

// Synchronisation batch des scans offline vers le serveur (quand connexion rétablie)
export async function synchroniser() {
  const enAttente = await scansEnAttente()
  if (enAttente.length === 0) return { sync: true, message: 'Rien à synchroniser' }
  try {
    const { appelAPI } = await import('./apiService')
    await appelAPI('/scans/sync', { method: 'POST', body: enAttente })
    await marquerScansSync()
    return { sync: true, message: 'Scans synchronisés' }
  } catch {
    return { sync: false, message: 'Impossible de se connecter au serveur' }
  }
}

// Récupère l'historique des scans enrichi (event_id, category via JOIN)
export async function getHistorique() {
  return await historiqueScansAvecDetails()
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
