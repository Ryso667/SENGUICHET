// Point d'entrée unique pour les paiements
// ProviderFactory instancie le bon provider selon le type

const ProviderSimulation = require('./providers/ProviderSimulation');
const ProviderWave = require('./providers/ProviderWave');

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
      default:
        throw new Error(`Provider ${type} non supporté`);
    }
  }
}

module.exports = PaymentService;
