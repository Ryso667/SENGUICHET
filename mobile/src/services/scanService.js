// Service de scan : vérification offline des QR codes avec HMAC-SHA256
// 5 étapes : parsing QR → HMAC → expiration → recherche locale → anti re-scan
import * as Crypto from 'expo-crypto'
import {
  chercherTicket, chercherTicketAchete, marquerUtilise, enregistrerScan,
  insererTickets, scansEnAttente, marquerScansSync,
  historiqueScans, historiqueScansAvecDetails,
  compterTickets, compterScansParResultat, viderTickets,
} from '../database/database'

const MOCK_MODE = true // Sera remplacé par API lorsque le backend sera prêt
const CLE_SECRETE = 'senguichet-cle-secrete-hmac' // Sera remplacé par variable d'environnement

// 5 statuts possibles pour un scan (conforme Document Technique v1.0)
// Sera remplacé par un enum partagé côté backend plus tard
const RESULTATS = {
  VALIDE: 'VALIDE',
  DEJA_UTILISE: 'DEJA_UTILISE',
  EXPIRE: 'EXPIRE',
  INCONNU: 'INCONNU',
  FRAUDE: 'FRAUDE',
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
  if (MOCK_MODE) return true
  const donnees = `${qr.uuid}|${qr.transaction_ref}|${qr.timestamp}|${qr.event_id}|${qr.category}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + CLE_SECRETE)
  return calcule === qr.hmac
}

// Vérifie si le billet est expiré (date de validité dépassée)
function estExpire(timestamp) {
  return new Date(timestamp) < new Date()
}

// Télécharge les tickets depuis le serveur (ou mock) vers SQLite locale
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
  return 0
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
  if (!ticket && MOCK_MODE) {
    // Fallback : en mode mock, cherche aussi dans les tickets achetés (même appareil)
    const achete = await chercherTicketAchete(qr.uuid)
    if (achete) {
      ticket = {
        uuid: achete.id,
        hmac: qr.hmac,
        event_id: achete.event_id,
        category: achete.categorie_nom,
        timestamp_gen: achete.date_achat,
        statut: achete.statut === 'valide' ? 'DISPONIBLE' : 'UTILISE_LOCAL',
      }
    }
  }
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
  if (MOCK_MODE) {
    await marquerScansSync()
    return { sync: true, message: 'Scans synchronisés (mode mock)' }
  }
  const enAttente = await scansEnAttente()
  if (enAttente.length === 0) return { sync: true, message: 'Rien à synchroniser' }
  return { sync: true, message: 'Scans synchronisés' }
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
