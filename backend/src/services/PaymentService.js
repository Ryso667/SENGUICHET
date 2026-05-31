// Point d'entrée unique pour les paiements
// ProviderFactory instancie le bon provider selon le type

const ProviderSimulation = require('./providers/ProviderSimulation');

class PaymentService {
  static getProvider(type) {
    switch (type) {
      case 'SIMULATION':
        return new ProviderSimulation();
      // case 'ORANGE_MONEY': return new ProviderOrangeMoney();
      // case 'WAVE': return new ProviderWave();
      // case 'FREE_MONEY': return new ProviderFreeMoney();
      default:
        throw new Error(`Provider ${type} non supporté`);
    }
  }
}

module.exports = PaymentService;
