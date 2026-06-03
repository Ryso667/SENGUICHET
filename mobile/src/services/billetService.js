// Service d'achat et consultation de billets côté acheteur
// Communique avec le backend pour les achats et la liste des billets
import { appelAPI } from './apiService'

// Achète un billet via le backend
// Appelle POST /api/billets/acheter
// body : { evenement_id, categorie_ticket_id, telephone, email }
// email : optionnel, permet au backend d'envoyer la confirmation
// Retourne { billet: { id, uuid, numero, prix_paye, qrData, statut }, transaction: { reference, montant, statut } }
export async function acheterBillet(evenementId, categorieTicketId, telephone, email, provider = 'SIMULATION') {
  const body = { evenementId, categorieTicketId, telephone, provider }
  if (email) body.email = email
  return await appelAPI('/billets/acheter', {
    method: 'POST',
    body,
  })
}


// Récupère la liste des billets d'un acheteur par téléphone ou email
// Appelle GET /api/billets/mes-billets?telephone=... ou ?email=...
// Retourne un tableau de billets enrichis (nom événement, date, lieu, catégorie ticket)
export async function mesBillets(identifiant) {
  const telPropre = identifiant?.replace(/[^\d+]/g, '') || ''
  const params = new URLSearchParams()
  if (telPropre.length > 3) {
    params.append('telephone', telPropre)
  } else {
    params.append('email', identifiant)
  }
  const query = params.toString()
  const data = await appelAPI(`/billets/mes-billets?${query}`)
  if (!Array.isArray(data)) return []
  return data.map(b => ({
    id: String(b.id),
    uuid: b.uuid || '',
    eventNom: b.evenement_titre || '',
    eventDate: b.date_debut || '',
    eventLieu: b.evenement_lieu || '',
    categorie: b.categorie_nom || '',
    numero: b.numero || `TKT-${b.id}`,
    prix: b.prix_paye || 0,
    statut: (b.statut || 'EN_ATTENTE').toLowerCase(),
    telephone: b.telephone_acheteur || identifiant,
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
