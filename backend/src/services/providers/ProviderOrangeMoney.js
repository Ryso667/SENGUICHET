// Intégration du fournisseur de paiement Orange Money (API OTP Orange Sonatel Sénégal)
// Gère l'initiation de paiement, la confirmation OTP et la vérification de statut

const IPaymentProvider = require('./IPaymentProvider');

class ProviderOrangeMoney extends IPaymentProvider {
  constructor() {
    super();
    this.clientId = process.env.ORANGE_CLIENT_ID;
    this.clientSecret = process.env.ORANGE_CLIENT_SECRET;
    this.merchantCode = process.env.ORANGE_MERCHANT_CODE;
    this.baseUrl = (process.env.ORANGE_PRODUCTION_URL || 'https://api.orange.com') + '';
  }

  get nom() { return 'ORANGE_MONEY' }

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

  // Obtient un token d'accès OAuth2 via client_credentials
  async _obtenirToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await this._fetchWithTimeout(`${this.baseUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('Orange Money - Erreur obtention token:', response.status, err);
      throw new Error(`Orange Money auth error: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  // Récupère la clé publique RSA pour le chiffrement du PIN
  async _obtenirClePublique(token) {
    const response = await this._fetchWithTimeout(`${this.baseUrl}/v1.0/publickey`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('Orange Money - Erreur obtention clé publique:', response.status, err);
      throw new Error(`Orange Money public key error: ${response.status}`);
    }

    const data = await response.json();
    return data.publicKey;
  }

  // Initie un paiement Orange Money : récupère token + clé publique pour la confirmation OTP
  // Retourne les tokens dans metadata pour éviter un second appel auth côté mobile
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    if (typeof montant !== 'number' || montant <= 0) {
      throw new Error('Montant invalide');
    }
    if (devise && devise !== 'XOF') {
      throw new Error('Orange Money ne supporte que la devise XOF');
    }
    // Orange Money gère les callbacks depuis la configuration du dashboard — le paramètre callbackUrl est accepté mais non utilisé ici
    // Sera remplacé par API
    const token = await this._obtenirToken();
    const publicKey = await this._obtenirClePublique(token);

    return {
      redirectUrl: null,
      referenceOperateur: reference,
      metadata: { publicKey },
    };
  }

  // Confirme le paiement avec le code OTP saisi par l'utilisateur
  async confirmerOtp({ msisdn, otp, encryptedPin, montant, reference }) {
    if (!msisdn || !otp || !encryptedPin || typeof montant !== 'number' || montant <= 0) {
      throw new Error('Paramètres OTP invalides');
    }

    const accessToken = await this._obtenirToken();

    const response = await this._fetchWithTimeout(`${this.baseUrl}/v1.0/payment/otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msisdn,
        otp,
        encryptedPin,
        amount: String(montant),
        merchantCode: this.merchantCode,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('Orange Money - Erreur confirmation OTP:', response.status, err);
      throw new Error(`Orange Money OTP error: ${response.status}`);
    }

    const data = await response.json();

    return {
      transactionId: data.transactionId || reference,
      status: data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      referenceOperateur: reference,
    };
  }

  // Vérifie le statut d'une transaction Orange Money
  async verifierPaiement(referenceOperateur) {
    if (!referenceOperateur) {
      throw new Error('referenceOperateur requis');
    }

    const token = await this._obtenirToken();

    const response = await this._fetchWithTimeout(`${this.baseUrl}/v1.0/payment/transaction/${referenceOperateur}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error('Orange Money - Erreur vérification paiement:', response.status);
      return { statut: 'FAILED' };
    }

    const data = await response.json();

    const mapping = {
      SUCCESS: 'SUCCESS',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
    };

    return { statut: mapping[data.status] || 'PENDING' };
  }

  // Remboursement non disponible en MVP
  async rembourser(referenceOperateur, montant) {
    return false;
  }
}

module.exports = ProviderOrangeMoney;
