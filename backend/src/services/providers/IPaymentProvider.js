// Interface contract for payment providers
// Each provider implements initierPaiement, verifierPaiement, and rembourser

class IPaymentProvider {
  get nom() { throw new Error('Not implemented') }

  // Initie un paiement externe
  // @param {Object} params - { montant, devise, reference, callbackUrl, metadata }
  // @returns {Promise<{ redirectUrl: string|null, referenceOperateur: string }>}
  async initierPaiement(params) { throw new Error('Not implemented') }

  // Vérifie le statut d'un paiement initié
  // @param {string} referenceOperateur - reference retournée par initierPaiement
  // @returns {Promise<{ statut: string }>} - 'PENDING'|'SUCCESS'|'FAILED'
  async verifierPaiement(referenceOperateur) { throw new Error('Not implemented') }

  // Rembourse un paiement
  // @param {string} referenceOperateur
  // @param {number} montant
  // @returns {Promise<boolean>}
  async rembourser(referenceOperateur, montant) { throw new Error('Not implemented') }
}

module.exports = IPaymentProvider;
