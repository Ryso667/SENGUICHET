// Point d'entrée unique pour les paiements
// ProviderFactory instancie le bon provider selon le type

const ProviderSimulation = require('./providers/ProviderSimulation');
const ProviderWave = require('./providers/ProviderWave');
const ProviderOrangeMoney = require('./providers/ProviderOrangeMoney');

class PaymentService {
  static getProvider(type) {
    switch (type) {
      case 'SIMULATION':
        return new ProviderSimulation();
      case 'WAVE':
        if (!process.env.WAVE_API_KEY) {
          console.warn('PaymentService: WAVE_API_KEY non configurée, fallback vers SIMULATION');
          return new ProviderSimulation();
        }
        return new ProviderWave();
      case 'ORANGE_MONEY':
        return new ProviderOrangeMoney();
      default:
        throw new Error(`Provider ${type} non supporté`);
    }
  }
}

module.exports = PaymentService;
