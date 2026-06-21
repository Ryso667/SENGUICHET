import { appelAPI } from './apiService'

// Récupère les données du reçu d'achat groupé (tous les billets d'une transaction)
// Appelle GET /api/billets/recu/:reference/data
// Retourne { evenement, groupes (par catégorie), tickets[], nbTickets, montantTotal }
export async function fetcherRecuAchat(reference) {
  return await appelAPI(`/billets/recu/${reference}/data`)
}

// Récupère tous les billets vendus pour un événement (organisateur)
// Appelle GET /api/billets/evenement/:id
// Retourne un tableau de billets avec nom, email, téléphone, catégorie, prix, statut, date
export async function fetchBilletsEvenementAPI(eventId) {
  const data = await appelAPI(`/billets/evenement/${eventId}`)
  if (!Array.isArray(data)) return []
  return data.map(b => ({
    id: String(b.id),
    uuid: b.uuid || '',
    numero: b.numero || '',
    nom: b.nom_acheteur || '',
    email: b.email_acheteur || '',
    telephone: b.telephone_acheteur || '',
    categorie: b.categorie_nom || '',
    prix: b.prix_paye || 0,
    statut: (b.statut || '').toLowerCase(),
    dateAchat: b.date_creation || '',
  }))
}

// Service d'achat et consultation de billets côté acheteur + organisateur
// Communique avec le backend pour les achats et la liste des billets

// Achète un ou plusieurs billets via le backend
// Appelle POST /api/billets/acheter
// body : { evenement_id, categorie_ticket_id, telephone, email, quantite }
// email : optionnel, permet au backend d'envoyer la confirmation
// quantite : nombre de billets à créer (default 1)
// Retourne { billet, billets[], quantite, lien, paiement }
export async function acheterBillet(evenementId, categorieTicketId, telephone, email, provider = 'WAVE', quantite = 1, promoId = null) {
  const body = { evenementId, categorieTicketId, telephone, quantite, provider }
  if (email) body.email = email
  if (promoId) body.promoId = promoId
  return await appelAPI('/billets/acheter', {
    method: 'POST',
    body,
  })
}


// Récupère la liste des billets d'un acheteur par téléphone ou email
// Appelle GET /api/billets/mes-billets?telephone=...&email=...
// Accepte téléphone + email séparément pour unionner les résultats côté API
// Empêche la perte de tickets si l'identifiant utilisé pour la requête change en cours de session
// Retourne un tableau de billets enrichis (nom événement, date, lieu, catégorie ticket)
export async function mesBillets(telephone, email) {
  const params = new URLSearchParams()
  if (telephone) {
    const telPropre = telephone.replace(/[^\d+]/g, '')
    if (telPropre.length > 3) params.append('telephone', telPropre)
  }
  if (email) {
    params.append('email', email)
  }
  const query = params.toString()
  if (!query) return []
  const data = await appelAPI(`/billets/mes-billets?${query}`)
  if (!Array.isArray(data)) return []
  return data.map(b => ({
    id: String(b.id),
    uuid: b.uuid || '',
    eventId: b.evenement_id,
    eventNom: b.evenement_titre || '',
    eventDate: b.date_debut || '',
    eventHeure: b.heure_debut || b.event_heure || (() => { try { return new Date(b.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } })(),
    eventLieu: b.evenement_lieu || '',
    categorie: b.categorie_nom || '',
    numero: b.numero || `TKT-${b.id}`,
    prix: b.prix_paye || 0,
    statut: (b.statut || 'EN_ATTENTE').toLowerCase(),
    telephone: b.telephone_acheteur || telephone || email,
    dateAchat: b.date_creation || '',
    qrData: b.payload_signature ? JSON.stringify({
      uuid: b.uuid,
      hmac: b.payload_signature,
      event_id: b.evenement_id,
      category: b.categorie_nom,
      timestamp: b.date_creation,
      transaction_ref: b.numero,
    }) : null,
  }))
}
