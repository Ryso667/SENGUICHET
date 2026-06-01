// Intégration du fournisseur de paiement PayDunya (API PSR avec redirection)
// PayDunya agrège Wave, Orange Money, Free Money, cartes, etc. — une seule API pour tous les moyens

const IPaymentProvider = require('./IPaymentProvider');

class ProviderPayDunya extends IPaymentProvider {
  constructor() {
    super();
    this.masterKey = process.env.PAYDUNYA_MASTER_KEY;
    this.privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    this.token = process.env.PAYDUNYA_TOKEN;
    this.baseUrl = process.env.PAYDUNYA_BASE_URL || 'https://app.paydunya.com/sandbox-api/v1';
    this.checkoutBaseUrl = process.env.PAYDUNYA_CHECKOUT_URL || 'https://app.paydunya.com/sandbox-checkout';
    this.storeName = process.env.PAYDUNYA_STORE_NAME || 'SENGUICHET';
  }

  get nom() { return 'PAYDUNYA' }

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

  // Crée une facture PayDunya → renvoie l'URL de redirection et le token PayDunya
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    if (typeof montant !== 'number' || montant <= 0) {
      throw new Error('Montant invalide');
    }

    const apiBase = callbackUrl || process.env.API_BASE_URL || 'http://localhost:8080/api';

    const body = {
      invoice: {
        total_amount: montant,
        description: `Paiement billet SENGUICHET - Ref: ${reference}`,
        customer: {
          name: metadata?.customerName || 'Client',
          email: metadata?.customerEmail || '',
          phone: metadata?.customerPhone || '',
        },
      },
      store: {
        name: this.storeName,
      },
      custom_data: {
        reference,
        eventId: metadata?.eventId || '',
      },
      actions: {
        cancel_url: `${apiBase}/paiements/paydunya/cancel/${reference}`,
        return_url: `${apiBase}/paiements/paydunya/return/${reference}`,
        callback_url: `${apiBase}/paiements/paydunya/ipn`,
      },
    };

    const response = await this._fetchWithTimeout(`${this.baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': this.masterKey,
        'PAYDUNYA-PRIVATE-KEY': this.privateKey,
        'PAYDUNYA-TOKEN': this.token,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('PayDunya - Erreur création facture:', response.status, err);
      throw new Error(`PayDunya invoice error: ${response.status}`);
    }

    const data = await response.json();
    if (data.response_code !== '00') {
      throw new Error(`PayDunya error: ${data.response_text}`);
    }

    // Sera remplacé par API
    return {
      redirectUrl: data.response_text,
      referenceOperateur: data.token,
    };
  }

  // Vérifie le statut d'une transaction PayDunya via l'API Confirm
  async verifierPaiement(referenceOperateur) {
    if (!referenceOperateur) {
      return { statut: 'INCONNU' };
    }

    const response = await this._fetchWithTimeout(
      `${this.baseUrl}/checkout-invoice/confirm/${referenceOperateur}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': this.masterKey,
          'PAYDUNYA-PRIVATE-KEY': this.privateKey,
          'PAYDUNYA-TOKEN': this.token,
        },
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('PayDunya - Erreur vérification:', response.status, err);
      return { statut: 'INCONNU' };
    }

    const data = await response.json();
    if (data.response_code !== '00') {
      return { statut: 'INCONNU' };
    }

    switch (data.status) {
      case 'completed':
        return { statut: 'SUCCESS', raw: data };
      case 'pending':
        return { statut: 'PENDING', raw: data };
      case 'cancelled':
        return { statut: 'ANNULE', raw: data };
      case 'failed':
        return { statut: 'ECHEC', raw: data };
      default:
        return { statut: 'PENDING', raw: data };
    }
  }

  async rembourser(referenceOperateur, montant) {
    return false;
  }
}

module.exports = ProviderPayDunya;
