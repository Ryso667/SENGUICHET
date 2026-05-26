// Couche de persistance AsyncStorage pour les événements et tickets
// Toutes les fonctions sont async car AsyncStorage est asynchrone
import AsyncStorage from '@react-native-async-storage/async-storage'
import { insererTicketAchete } from '../database/database'

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

// Crée un nouvel événement avec un code 4 chiffres généré aléatoirement
// Les catégories recoivent un ID unique au moment de la création
export async function creerEvenement({ nom, date, description, categories }) {
  const events = await getAllEvenements()
  const evt = {
    id: generateId(),
    nom,
    date,
    description: description || '',
    code: Math.floor(1000 + Math.random() * 9000).toString(),
    categories: categories.map(c => ({ id: generateId(), nom: c.nom, prix: Number(c.prix), capacite: Number(c.capacite) })),
    ticketCount: 0,
    createdAt: new Date().toISOString(),
  }
  events.push(evt)
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
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

  const ticket = {
    id: generateId(),
    eventId,
    eventNom: evt.nom,
    eventDate: evt.date,
    categorie: cat.nom,
    prix: cat.prix,
    telephone,
    numero,
    statut: 'valide',
    dateAchat: new Date().toISOString(),
    dateScan: null,
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
