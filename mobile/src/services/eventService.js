// Couche API backend pour les événements et catégories
// Toutes les données viennent exclusivement du backend (aucun stockage local)
import { getDefaultImage } from '../config/images'
import { appelAPI } from './apiService'

// URL racine du backend (sans /api) pour reconstruire les URLs d'affiche relatives
const API_ORIGIN = 'https://backend-rust-sigma-64.vercel.app'

// Transforme une URL d'affiche relative en URL absolue
// Retourne null si aucune URL fournie
function normaliserAfficheUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`
  return url
}

// ===== Fonctions organisateur =====

// Récupère la liste des événements depuis le backend
// Retourne un tableau formaté pour le frontend
export async function fetchEvenementsAPI() {
  const data = await appelAPI('/evenements/')
  if (!Array.isArray(data)) return []
  return data.map(e => {
    const rawStatut = e.statut || 'en_attente'
    let statut = rawStatut
    if (statut === 'active') statut = 'actif'
    if (statut === 'sold-out') statut = 'actif'
    return {
      id: String(e.id),
      nom: e.nom || '',
      affiche_url: normaliserAfficheUrl(e.affiche_url),
      date: e.date || '',
      lieu: e.lieu || '',
      categorie: e.categorie || '',
      code: e.code || '',
      statut,
      remplis: e.remplis || 0,
      capacite: e.capacite || 0,
      revenus: e.revenus || '0 FCFA',
    }
  })
}

// Crée un événement via le backend
// data : { nom, date, dateFin, lieu, ville, heure, categorie, description, categories }
export async function creerEvenementAPI(data) {
  const capacite = data.categories.reduce((sum, c) => sum + Number(c.capacite), 0)
  const body = {
    titre: data.nom,
    description: data.description || '',
    lieu: data.lieu || '',
    ville: data.ville || data.lieu || '',
    categorie: data.categorie,
    dateDebut: data.date,
    dateFin: data.dateFin || data.date,
    heureDebut: data.heure || '00:00',
    capacite,
    affiche_url: data.poster || null,
    ticketTypes: data.categories.map(c => ({
      nom: c.nom,
      description: '',
      prix: Number(c.prix),
      quantite: Number(c.capacite),
    })),
  }
  return await appelAPI('/evenements/', { method: 'POST', body })
}

// Récupère le détail d'un événement depuis le backend
export async function fetchEvenementDetailAPI(id) {
  const data = await appelAPI(`/evenements/${id}`)
  if (!data || !data.evenement) return data
  const e = data.evenement
  const s = data.stats || {}
  return {
    evenement: {
      id: String(e.id),
      nom: e.titre || '',
      affiche_url: normaliserAfficheUrl(e.affiche_url),
      date: e.date_debut || '',
      lieu: e.lieu || '',
      categorie: e.categorie || '',
      capacite: e.capacite_totale || 0,
      code: e.scan_code || '',
      statut: e.statut || 'en_attente',
      description: e.description || '',
      remplis: s.remplis ?? 0,
      revenus: s.revenus ?? 0,
      taux_remplissage: s.taux_remplissage ?? 0,
      places_restantes: s.places_restantes ?? 0,
      billets_vendus: s.billets_vendus ?? 0,
    },
    tickets: (data.tickets || []).map(t => ({
      id: String(t.id),
      nom: t.nom,
      prix: t.prix,
      capacite: t.capacite,
      places_disponibles: t.places_disponibles,
      statut: 'valide',
      description: t.description || '',
    })),
  }
}

// Modifie un événement via le backend
export async function modifierEvenementAPI(id, data) {
  const capacite = data.categories.reduce((sum, c) => sum + Number(c.capacite), 0)
  const body = {
    titre: data.nom,
    description: data.description || '',
    lieu: data.lieu || '',
    ville: data.ville || data.lieu || '',
    categorie: data.categorie,
    dateDebut: data.date,
    dateFin: data.dateFin || data.date,
    heureDebut: data.heure || '00:00',
    capacite,
    affiche_url: data.poster || null,
    ticketTypes: data.categories.map(c => ({
      nom: c.nom,
      description: '',
      prix: Number(c.prix),
      quantite: Number(c.capacite),
    })),
  }
  return await appelAPI(`/evenements/${id}`, { method: 'PUT', body })
}

// Annule un événement via le backend
export async function annulerEvenementAPI(id) {
  return await appelAPI(`/evenements/${id}/annuler`, { method: 'PUT' })
}

// Récupère la liste des demandes de l'organisateur
export async function listerMesDemandes() {
  const data = await appelAPI('/demandes/')
  if (!Array.isArray(data)) return []
  return data
}

// Soumet une nouvelle demande (création, modification, suppression)
export async function soumettreDemandeEvenement(payload) {
  return await appelAPI('/demandes/', { method: 'POST', body: payload })
}

// ===== Fonctions acheteur =====

// Récupère la liste des événements publics (acheteur) avec filtres optionnels
export async function fetchEvenementsPublics(filtres = {}) {
  const params = new URLSearchParams()
  if (filtres.categorie) params.append('categorie', filtres.categorie)
  if (filtres.prixMax) params.append('prix_max', filtres.prixMax)
  if (filtres.dateMin) params.append('date_min', filtres.dateMin)
  if (filtres.dateMax) params.append('date_max', filtres.dateMax)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await appelAPI(`/evenements/public${query}`)
  if (!Array.isArray(data)) return []
  const now = new Date()
  return data.map(e => {
    const dateFin = e.date_fin ? new Date(e.date_fin) : null
    return {
      id: String(e.id),
      title: e.titre || e.nom || '',
      affiche_url: normaliserAfficheUrl(e.affiche_url),
      date: e.date_debut || e.date || '',
      location: e.lieu || '',
      category: e.categorie || '',
      desc: e.description || '',
      estPasse: dateFin && dateFin < now,
      tickets: (e.categories || []).map(c => ({
        id: String(c.id),
        name: c.nom,
        price: c.prix,
        desc: c.description || '',
      })),
      priceMin: e.prix_min || 0,
      priceMax: e.prix_max || 0,
    }
  })
}

// Récupère le détail public d'un événement par son ID
export async function fetchEvenementDetailPublic(eventId) {
  const data = await appelAPI(`/evenements/public/${eventId}`)
  if (!data || !data.evenement) return null
  const e = data.evenement
  return {
    id: String(e.id),
    title: e.titre || '',
    date: e.date_debut || '',
    location: e.lieu || '',
    category: e.categorie || '',
    desc: e.description || '',
    affiche_url: normaliserAfficheUrl(e.affiche_url),
    bg: e.categorie ? getDefaultImage(e.categorie).bg : '#E0F7FF',
    emoji: e.categorie ? getDefaultImage(e.categorie).emoji : '🎉',
    tickets: (data.categories || []).map(c => ({
      id: String(c.id),
      name: c.nom,
      price: c.prix,
      desc: c.description || '',
    })),
    time: e.date_debut ? e.date_debut.slice(11, 16) : '',
    priceMin: e.prix_min || 0,
    priceMax: e.prix_max || 0,
  }
}
