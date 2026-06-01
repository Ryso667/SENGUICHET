// Intégration du fournisseur de paiement Wave (Business Checkout API)
// Gère la création de session, la vérification de statut et la signature HMAC

const IPaymentProvider = require('./IPaymentProvider');
const crypto = require('crypto');

class ProviderWave extends IPaymentProvider {
  constructor() {
    super();
    this.apiKey = process.env.WAVE_API_KEY;
    this.signingSecret = process.env.WAVE_SIGNING_SECRET;
    this.baseUrl = (process.env.WAVE_BASE_URL || 'https://api.wave.com') + '/v1';
  }

  get nom() { return 'WAVE' }

  // Calcule le header Wave-Signature : t={timestamp},v1={hmac}
  _signRequest(body, timestamp) {
    const payload = String(timestamp) + body;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  // Effectue une requête fetch avec timeout via AbortController
  async _fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Crée une session de paiement Wave Checkout
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    if (typeof montant !== 'number' || montant <= 0) {
      throw new Error('Montant invalide');
    }
    if (devise && devise !== 'XOF') {
      throw new Error('Wave ne supporte que la devise XOF');
    }
    const baseUrl = callbackUrl || process.env.API_BASE_URL || 'http://localhost:8080/api';
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyObj = {
      amount: String(montant),
      currency: 'XOF',
      success_url: `${baseUrl}/paiements/wave/success/${reference}`,
      error_url: `${baseUrl}/paiements/wave/error/${reference}`,
    };
    if (metadata) {
      bodyObj.metadata = metadata;
    }
    const body = JSON.stringify(bodyObj);
    const waveSignature = this._signRequest(body, timestamp);

    const response = await this._fetchWithTimeout(`${this.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Wave-Signature': waveSignature,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Wave API error: ${err.code || response.status} ${err.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      redirectUrl: data.wave_launch_url,
      referenceOperateur: data.id,
    };
  }

  // Vérifie le statut d'une session Wave
  async verifierPaiement(referenceOperateur) {
    if (!referenceOperateur) {
      throw new Error('referenceOperateur requis');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const body = '';
    const waveSignature = this._signRequest(body, timestamp);

    const response = await this._fetchWithTimeout(`${this.baseUrl}/checkout/sessions/${referenceOperateur}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Wave-Signature': waveSignature,
      },
    });

    if (!response.ok) {
      console.warn('Wave API error:', response.status, response.statusText);
      return { statut: 'FAILED' };
    }

    const data = await response.json();

    const mapping = {
      completed: 'SUCCESS',
      failed: 'FAILED',
      cancelled: 'FAILED',
    };

    return { statut: mapping[data.status] || 'PENDING' };
  }

  async rembourser(referenceOperateur, montant) {
    return false;
  }
}

module.exports = ProviderWave;
