// Provider Simulation : simule un paiement réussi sans appel externe
// Utilisé en phase de dev/test avant intégration des vrais providers

const IPaymentProvider = require('./IPaymentProvider');
const { v4: uuidv4 } = require('uuid');

class ProviderSimulation extends IPaymentProvider {
  get nom() { return 'SIMULATION' }

  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    // Simule un délai de traitement de 2 secondes
    await new Promise(r => setTimeout(r, 2000));

    const referenceOperateur = 'SIM-' + uuidv4().slice(0, 8).toUpperCase();

    return {
      redirectUrl: null, // pas de redirection externe
      referenceOperateur,
    };
  }

  async verifierPaiement(referenceOperateur) {
    return { statut: 'SUCCESS' }; // toujours réussi en simulation
  }

  async rembourser(referenceOperateur, montant) {
    return true;
  }
}

module.exports = ProviderSimulation;
