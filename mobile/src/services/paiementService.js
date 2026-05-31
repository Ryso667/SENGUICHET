// Service de gestion des paiements côté acheteur
// Interroge le statut d'une transaction via le backend
import { appelAPI } from './apiService'

// Récupère le statut d'un paiement par référence de transaction
// Appelle GET /api/paiements/:reference/statut
// Retourne { statut, transaction, billet }
// statut possible : 'PENDING' | 'SUCCESS' | 'FAILED'
export async function statutPaiement(reference) {
  return await appelAPI(`/paiements/${reference}/statut`)
}
