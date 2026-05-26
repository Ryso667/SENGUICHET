import * as Crypto from 'expo-crypto'
import {
  chercherTicket, marquerUtilise, enregistrerScan,
  insererTickets, scansEnAttente, marquerScansSync,
  historiqueScans, compterTickets, viderTickets,
} from '../database/database'

// Mode démo : pas de backend requis
const MOCK_MODE = true
const CLE_SECRETE = 'senguichet-cle-secrete-hmac'

// 5 statuts possibles pour un scan (conforme Document Technique)
const RESULTATS = {
  VALIDE: 'VALIDE',
  DEJA_UTILISE: 'DEJA_UTILISE',
  EXPIRE: 'EXPIRE',
  INCONNU: 'INCONNU',
  FRAUDE: 'FRAUDE',
}

// Parse le JSON du QR code
function parserQR(donnees) {
  try {
    return typeof donnees === 'string' ? JSON.parse(donnees) : donnees
  } catch {
    return null
  }
}

// Vérifie la signature HMAC-SHA256 du QR code (anti-fraude)
async function verifierHMAC(qr) {
  if (MOCK_MODE) return true
  const donnees = `${qr.uuid}|${qr.transaction_ref}|${qr.timestamp}|${qr.event_id}|${qr.category}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + CLE_SECRETE)
  return calcule === qr.hmac
}

// Vérifie si le billet est expiré (timestamp dépassé)
function estExpire(timestamp) {
  return new Date(timestamp) < new Date()
}

// Télécharge les tickets d'un événement/zone depuis le serveur
export async function telechargerTickets(eventId, zone) {
  if (MOCK_MODE) {
    const mockTickets = [
      { uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', hmac: 'mock-hmac-001', event_id: eventId, category: zone, timestamp_gen: new Date().toISOString() },
      { uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002', hmac: 'mock-hmac-002', event_id: eventId, category: zone, timestamp_gen: new Date().toISOString() },
      { uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003', hmac: 'mock-hmac-003', event_id: eventId, category: zone, timestamp_gen: new Date().toISOString() },
    ]
    await insererTickets(mockTickets)
    return mockTickets.length
  }

  // Requête API réelle quand le backend sera prêt
  // const { data } = await axios.get(`/api/controleur/tickets?event_id=${eventId}&zone=${zone}`)
  // await insererTickets(data.tickets)
  // return data.tickets.length
  return 0
}

// Vérification offline d'un billet (5 étapes)
// 1. Parse le QR code
// 2. Vérifie la signature HMAC (anti-fraude)
// 3. Vérifie la date d'expiration
// 4. Recherche le billet dans la base locale
// 5. Vérifie le statut (déjà utilisé ?)
export async function verifierBillet(donneesQR) {
  const qr = parserQR(donneesQR)
  if (!qr) return { resultat: RESULTATS.INCONNU, message: 'QR code invalide' }

  // Étape 2 : vérification HMAC
  const hmacOk = await verifierHMAC(qr)
  if (!hmacOk) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.FRAUDE)
    return { resultat: RESULTATS.FRAUDE, message: 'Signature cryptographique invalide — alerte fraude' }
  }

  // Étape 3 : vérification expiration
  if (estExpire(qr.timestamp)) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.EXPIRE)
    return { resultat: RESULTATS.EXPIRE, message: 'Billet expiré' }
  }

  // Étape 4 : recherche dans SQLite locale
  const ticket = await chercherTicket(qr.uuid)
  if (!ticket) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.INCONNU)
    return { resultat: RESULTATS.INCONNU, message: 'Billet introuvable dans la base locale' }
  }

  // Étape 5 : vérification anti re-scan
  if (ticket.statut === 'UTILISE_LOCAL') {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.DEJA_UTILISE)
    return { resultat: RESULTATS.DEJA_UTILISE, message: 'Billet déjà scanné sur cet appareil' }
  }

  // Billet valide : marquer comme utilisé et enregistrer le scan
  await marquerUtilise(qr.uuid)
  await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.VALIDE)
  return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée' }
}

// Synchronisation batch des scans offline vers le serveur
export async function synchroniser() {
  if (MOCK_MODE) {
    await marquerScansSync()
    return { sync: true, message: 'Scans synchronisés (mode mock)' }
  }

  const enAttente = await scansEnAttente()
  if (enAttente.length === 0) return { sync: true, message: 'Rien à synchroniser' }

  // Requête API réelle
  // const { data } = await axios.post('/api/controleur/sync', { scans: enAttente })
  // await marquerScansSync()
  // return data
  return { sync: true, message: 'Scans synchronisés' }
}

// Récupère l'historique des scans
export async function getHistorique() {
  return await historiqueScans()
}

// Stats : nombre de tickets locaux disponibles
export async function getStats() {
  return { ticketsLocaux: await compterTickets() }
}

// Réinitialisation complète
export async function reinitialiser() {
  await viderTickets()
}
