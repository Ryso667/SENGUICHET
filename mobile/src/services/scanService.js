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
// Retourne false immédiatement si HMAC_SECRET est vide (ne peut pas matcher)
async function verifierHMAC(qr) {
  if (!HMAC_SECRET) return false
  const donnees = `${qr.uuid}|${qr.transaction_ref || ''}|${qr.timestamp || ''}|${qr.event_id || ''}|${qr.category || ''}`
  const calcule = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, donnees + HMAC_SECRET)
  return comparerTempsConstant(calcule, qr.hmac)
}

// Nettoie tous les tickets qui n'appartiennent pas à l'événement du contrôleur
// Garantit qu'aucun résidu d'ancienne session ne peut être scanné
export async function nettoyerTicketsHorsEvenement(eventId) {
  const { getDb } = await import('../database/database')
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets WHERE event_id != $event_id', { $event_id: eventId })
}

// Télécharge les tickets depuis le serveur vers SQLite locale
// Lance une erreur si le réseau ou l'API échoue (le caller gère le feedback)
export async function telechargerTickets(eventId, zone) {
  const { appelAPI } = await import('./apiService')
  const tickets = await appelAPI(`/scans/tickets/${eventId}`)
  // Nettoie les tickets d'anciens événements avant d'insérer les nouveaux
  // Empêche la faille : résidu de session précédente donnant accès à un autre événement
  const { getDb } = await import('../database/database')
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets WHERE event_id != $event_id', { $event_id: eventId })
  await insererTickets(tickets)
  return tickets.length
}

// Vérification complète offline d'un billet
// Étape 1 : parsing QR → 2 : HMAC → 3 : recherche locale → 4 : événement → 5 : anti re-scan
// eventId : l'ID de l'événement auquel le contrôleur est connecté (depuis AuthContext)
export async function verifierBillet(donneesQR, eventIdControleur) {
  const qr = parserQR(donneesQR)
  if (!qr) return { resultat: RESULTATS.INCONNU, message: 'QR code invalide' }

  // Étape 1 : parsing du QR (déjà fait ci-dessus)
  // Étape 2 : vérification HMAC (signature cryptographique)
  const hmacOk = await verifierHMAC(qr)
  const num = qr.transaction_ref || null
  const eventId = eventIdControleur || qr.event_id || null

  if (!hmacOk) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.FRAUDE, num, eventId)
    return { resultat: RESULTATS.FRAUDE, message: 'QR code falsifié 🚫' }
  }

  // Étape 3 : recherche du billet dans la base SQLite locale
  let ticket = await chercherTicket(qr.uuid)
  if (!ticket) {
    await enregistrerScan(qr.uuid, qr.hmac, RESULTATS.INCONNU, num, eventId)
    return { resultat: RESULTATS.INCONNU, message: 'Billet non trouvé ❓' }
  }

  // Étape 4 : vérification que le billet appartient à l'événement du contrôleur
  // Empêche la faille : billet d'un autre événement trouvé dans la DB locale (résidu de session précédente)
  // Supprime immédiatement le billet de la DB pour éviter toute confusion future
  if (eventIdControleur && Number(ticket.event_id) !== Number(eventIdControleur)) {
    const { getDb } = await import('../database/database')
    const bd = await getDb()
    await bd.runAsync('DELETE FROM tickets WHERE uuid = $uuid', { $uuid: qr.uuid })
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
