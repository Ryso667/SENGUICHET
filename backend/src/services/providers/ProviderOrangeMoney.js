// Provider Orange Money : simulation d'un paiement Orange Money
// En attendant l'intégration de l'API Orange Money réelle

const IPaymentProvider = require('./IPaymentProvider');
const crypto = require('crypto');

class ProviderOrangeMoney extends IPaymentProvider {
  get nom() { return 'ORANGE_MONEY' }

  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    await new Promise(r => setTimeout(r, 2000));

    const referenceOperateur = 'OM-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    return {
      redirectUrl: null,
      referenceOperateur,
    };
  }

  async verifierPaiement(referenceOperateur) {
    return { statut: 'SUCCESS' };
  }

  async rembourser(referenceOperateur, montant) {
    return true;
  }
}

module.exports = ProviderOrangeMoney;
