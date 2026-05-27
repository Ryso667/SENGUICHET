// Couche de persistance AsyncStorage pour les événements et tickets
// Toutes les fonctions sont async car AsyncStorage est asynchrone
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { insererTicketAchete } from '../database/database'
import { getDefaultImage } from '../config/images'

const CLE_SECRETE_QR = 'senguichet-cle-secrete-hmac'

// Clés de stockage dans AsyncStorage
const EVENTS_KEY = '@senguichet_evenements'  // liste des événements créés
const TICKETS_KEY = '@senguichet_tickets'     // tous les tickets achetés

// Génère un ID unique lisible : timestamp base36 + 4 caractères aléatoires
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Formate un nombre avec padding, ex: 3 → "003"
function formatNum(n, len = 3) {
  return String(n).padStart(len, '0')
}

// Retourne tous les événements stockés, ou [] si rien
export async function getAllEvenements() {
  const raw = await AsyncStorage.getItem(EVENTS_KEY)
  return raw ? JSON.parse(raw) : []
}

// Retourne un événement par son ID, ou null
export async function getEvenement(id) {
  const events = await getAllEvenements()
  return events.find(e => e.id === id) || null
}

// Génère un code contrôleur sécurisé : 4 chiffres via expo-crypto
// Vérifie l'unicité contre les codes existants
async function genererCodeSecurise(existingCodes) {
  let code
  const bytes = new Uint8Array(2)
  do {
    Crypto.getRandomValues(bytes)
    code = String(1000 + bytes[0] % 9000)
  } while (existingCodes.includes(code))
  return code
}

// Crée un nouvel événement avec un code contrôleur 4 chiffres (crypto-sécurisé)
// Les catégories recoivent un ID unique au moment de la création
export async function creerEvenement({ nom, date, description, categorie, categories, poster, lieu, heure, email }) {
  const events = await getAllEvenements()
  const existingCodes = events.map(e => e.code)
  const defaultImg = getDefaultImage(categorie)
  const evt = {
    id: generateId(),
    nom,
    date,
    lieu: lieu || '',
    heure: heure || '',
    categorie: categorie || '',
    description: description || '',
    code: await genererCodeSecurise(existingCodes),
    categories: categories.map(c => ({ id: generateId(), nom: c.nom, prix: Number(c.prix), capacite: Number(c.capacite) })),
    poster: poster?.uri || defaultImg.poster,
    bg: defaultImg.bg,
    emoji: defaultImg.emoji,
    ticketCount: 0,
    createdAt: new Date().toISOString(),
    email: email || '',
  }
  events.push(evt)
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  await ajouterAudit('creation', { eventId: evt.id, eventNom: evt.nom, par: email || 'organisateur' })
  return evt
}

// Achète un ticket : incrémente le compteur, génère un numéro unique,
// sauvegarde le ticket et met à jour le compteur de l'événement
export async function acheterTicket(eventId, categorieId, telephone) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === eventId)
  if (idx === -1) throw new Error('Événement introuvable')
  const evt = events[idx]
  const cat = evt.categories.find(c => c.id === categorieId)
  if (!cat) throw new Error('Catégorie introuvable')

  evt.ticketCount++
  const numero = `TKT-${evt.nom.slice(0, 4).toUpperCase()}-${formatNum(evt.ticketCount)}`
  const ticketId = generateId()
  const transactionRef = `TXN-${Date.now().toString(36).toUpperCase()}`
  const timestamp = new Date().toISOString()

  // Génération d'une signature cryptographique pour le QR (anti-contrefaçon offline)
  const signaturePayload = `${ticketId}|${transactionRef}|${timestamp}|${eventId}|${cat.nom}`
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    signaturePayload + CLE_SECRETE_QR
  )

  const qrPayload = JSON.stringify({
    uuid: ticketId,
    hmac: signature,
    event_id: eventId,
    category: cat.nom,
    timestamp,
    transaction_ref: transactionRef,
  })

  const ticket = {
    id: ticketId,
    eventId,
    eventNom: evt.nom,
    eventDate: evt.date,
    eventHeure: evt.heure || null,
    eventLieu: evt.lieu || null,
    categorie: cat.nom,
    prix: cat.prix,
    telephone,
    numero,
    statut: 'valide',
    dateAchat: timestamp,
    dateScan: null,
    qrData: qrPayload,
  }

  const tickets = await getAllTickets()
  tickets.push(ticket)
  await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(tickets))
  events[idx] = evt
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  await insererTicketAchete(ticket)
  return ticket
}

// Retourne tous les tickets (utilisé par acheteur et controleur)
export async function getAllTickets() {
  const raw = await AsyncStorage.getItem(TICKETS_KEY)
  return raw ? JSON.parse(raw) : []
}

// Filtre les tickets par événement
export async function getTicketsByEvent(eventId) {
  const tickets = await getAllTickets()
  return tickets.filter(t => t.eventId === eventId)
}

// Calcule les statistiques de vente pour le dashboard organisateur :
// vendus par catégorie, scannés par catégorie, recettes totales
export async function getEvenementStats(eventId) {
  const evt = await getEvenement(eventId)
  if (!evt) return null
  const tickets = await getTicketsByEvent(eventId)

  const vendusParCategorie = evt.categories.map(cat => ({
    nom: cat.nom,
    vendus: tickets.filter(t => t.categorie === cat.nom).length,
    capacite: cat.capacite,
    prix: cat.prix,
  }))

  const scannesParCategorie = evt.categories.map(cat => ({
    nom: cat.nom,
    scannes: tickets.filter(t => t.categorie === cat.nom && t.statut === 'utilise').length,
    vendus: tickets.filter(t => t.categorie === cat.nom).length,
  }))

  const recettes = tickets.reduce((sum, t) => sum + t.prix, 0)

  return {
    totalVendus: tickets.length,
    totalScannes: tickets.filter(t => t.statut === 'utilise').length,
    recettes,
    vendusParCategorie,
    scannesParCategorie,
  }
}

// Retourne les tickets d'un acheteur par son téléphone
export async function getTicketsAcheteur(telephone) {
  const tickets = await getAllTickets()
  return tickets.filter(t => t.telephone === telephone)
}

// Clé de stockage pour les logs d'audit dans AsyncStorage
const AUDIT_KEY = '@senguichet_audit'

// Ajoute une entrée dans le journal d'audit pour tracer les actions organisateur
// action : 'creation' | 'modification' | 'suppression'
// params : { eventId, eventNom, par, changements }
export async function ajouterAudit(action, { eventId, eventNom, par, changements }) {
  const raw = await AsyncStorage.getItem(AUDIT_KEY)
  const logs = raw ? JSON.parse(raw) : []
  logs.push({
    id: generateId(),
    action,
    eventId,
    eventNom,
    par: par || 'inconnu',
    changements: changements || null,
    timestamp: new Date().toISOString(),
  })
  await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(logs))
}

// Récupère tous les logs d'audit, du plus récent au plus ancien
export async function getAuditLogs() {
  const raw = await AsyncStorage.getItem(AUDIT_KEY)
  return raw ? JSON.parse(raw).reverse() : []
}

// Modifie un événement existant en préservant son ID et son code contrôleur
// updates : { nom, date, lieu, heure, categorie, description, categories, poster, bg, emoji }
// Lance une erreur si l'ID n'existe pas
export async function modifierEvenement(id, updates) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Événement introuvable')
  const old = events[idx]
  const updated = {
    ...old,
    nom: updates.nom ?? old.nom,
    date: updates.date ?? old.date,
    lieu: updates.lieu ?? old.lieu,
    heure: updates.heure ?? old.heure,
    categorie: updates.categorie ?? old.categorie,
    description: updates.description ?? old.description,
    categories: updates.categories.map(c => ({
      id: c.id || generateId(),
      nom: c.nom,
      prix: Number(c.prix),
      capacite: Number(c.capacite),
    })),
    poster: updates.poster?.uri ?? old.poster,
    bg: updates.bg ?? old.bg,
    emoji: updates.emoji ?? old.emoji,
  }
  events[idx] = updated
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return updated
}

// Supprime un événement (soft delete) : marque supprime=true et enregistre la date
// Ne supprime pas physiquement les données dans AsyncStorage
export async function supprimerEvenement(id) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Événement introuvable')
  events[idx].supprime = true
  events[idx].deletedAt = new Date().toISOString()
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}
