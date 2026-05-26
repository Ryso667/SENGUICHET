import * as Crypto from 'expo-crypto'
import {
  chercherTicket, marquerUtilise, enregistrerScan,
  insererTickets, scansEnAttente, marquerScansSync,
  historiqueScans, compterTickets, viderTickets,
} from '../database/database'

const MOCK_MODE = true
const CLE_SECRETE = 'senguichet-cle-secrete-hmac'

const RESULTATS = {
  VALIDE: 'VALIDE',
  DEJA_UTILISE: 'DEJA_UTILISE',
  EXPIRE: 'EXPIRE',
  INCONNU: 'INCONNU',
  FRAUDE: 'FRAUDE',
}

function parserQR(donnees) {
  try {
    return typeof donnees === 'string' ? JSON.parse(donnees) : donnees
  } catch {
    return null
  }
}

async function verifierHMAC(qr) {
  if (MOCK_MODE) return true
  const donnees = `${qr.uuid}|${qr.transaction_ref}|${qr.timestamp}|${qr.event_id}|${qr.category}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + CLE_SECRETE)
  return calcule === qr.hmac
}

function estExpire(timestamp) {
  return new Date(timestamp) < new Date()
}

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

  // const { data } = await axios.get(`/api/controleur/tickets?event_id=${eventId}&zone=${zone}`)
  // await insererTickets(data.tickets)
  // return data.tickets.length
  return 0
}

export async function verifierBillet(donneesQR) {
  const qr = parserQR(donneesQR)
  if (!qr) return { resultat: RESULTATS.INCONNU, message: 'QR code invalide' }

  const hmacOk = await verifierHMAC(qr)
  if (!hmacOk) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.FRAUDE)
    return { resultat: RESULTATS.FRAUDE, message: 'Signature cryptographique invalide — alerte fraude' }
  }

  if (estExpire(qr.timestamp)) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.EXPIRE)
    return { resultat: RESULTATS.EXPIRE, message: 'Billet expiré' }
  }

  const ticket = await chercherTicket(qr.uuid)
  if (!ticket) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.INCONNU)
    return { resultat: RESULTATS.INCONNU, message: 'Billet introuvable dans la base locale' }
  }

  if (ticket.statut === 'UTILISE_LOCAL') {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.DEJA_UTILISE)
    return { resultat: RESULTATS.DEJA_UTILISE, message: 'Billet déjà scanné sur cet appareil' }
  }

  await marquerUtilise(qr.uuid)
  await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.VALIDE)
  return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée' }
}

export async function synchroniser() {
  if (MOCK_MODE) {
    await marquerScansSync()
    return { sync: true, message: 'Scans synchronisés (mode mock)' }
  }

  const enAttente = await scansEnAttente()
  if (enAttente.length === 0) return { sync: true, message: 'Rien à synchroniser' }

  // const { data } = await axios.post('/api/controleur/sync', { scans: enAttente })
  // await marquerScansSync()
  // return data
  return { sync: true, message: 'Scans synchronisés' }
}

export async function getHistorique() {
  return await historiqueScans()
}

export async function getStats() {
  return { ticketsLocaux: await compterTickets() }
}

export async function reinitialiser() {
  await viderTickets()
}
