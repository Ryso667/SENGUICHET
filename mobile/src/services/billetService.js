// Service d'achat et consultation de billets côté acheteur
// Communique avec le backend pour les achats et la liste des billets
import { appelAPI } from './apiService'

// Achète un billet via le backend
// Appelle POST /api/billets/acheter
// body : { evenement_id, categorie_ticket_id, telephone }
// Retourne { billet: { id, uuid, numero, prix_paye, qrData, statut }, transaction: { reference, montant, statut } }
export async function acheterBillet(evenementId, categorieTicketId, telephone) {
  return await appelAPI('/billets/acheter', {
    method: 'POST',
    body: {
      evenement_id: evenementId,
      categorie_ticket_id: categorieTicketId,
      telephone,
    },
  })
}

// Récupère la liste des billets d'un acheteur par téléphone
// Appelle GET /api/billets/mes-billets?telephone=...
// Retourne un tableau de billets enrichis (nom événement, date, lieu, catégorie ticket)
export async function mesBillets(telephone) {
  const params = new URLSearchParams({ telephone })
  const data = await appelAPI(`/billets/mes-billets?${params.toString()}`)
  if (!Array.isArray(data)) return []
  return data.map(b => ({
    id: String(b.id),
    uuid: b.uuid || '',
    eventNom: b.evenement_titre || '',
    eventDate: b.date_debut || '',
    eventLieu: b.lieu || '',
    categorie: b.categorie_nom || '',
    numero: b.numero || '',
    prix: b.prix_paye || 0,
    statut: (b.statut_billet || 'EN_ATTENTE').toLowerCase(),
    telephone: b.telephone_acheteur || telephone,
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
