# Intégration Wave + Orange Money — Plan d'implémentation

> **Pour les agents :** Utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche.

**Objectif :** Remplacer le provider de paiement simulé par les API réelles Wave Business (Checkout + Webhook) et Orange Money OTP Payment.

**Architecture :** Les deux providers implémentent l'interface `IPaymentProvider` existante, branchés via `PaymentService`. Le flux d'achat devient asynchrone (billet EN_ATTENTE → paiement initié → webhook/réponse → billet ACTIF). Le mobile gère la sélection du provider, une WebView pour Wave, un formulaire OTP pour Orange Money.

**Stack technique :** Node.js/Express (backend), React Native/Expo (mobile), crypto (HMAC-SHA256 natif)

---

### Task 1: ProviderWave.js

**Fichiers :**
- Créer : `backend/src/services/providers/ProviderWave.js`
- Référence : `backend/src/services/providers/IPaymentProvider.js`

- [ ] **Step 1: Écrire ProviderWave.js**

```javascript
// Provider Wave : intégration Wave Business Checkout API
// initierPaiement → POST /v1/checkout/sessions (créé une session)
// verifierPaiement → GET /v1/checkout/sessions/{id} (vérifie statut)
// rembourser → non implémenté (MVP)

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

  // Crée une session de paiement Wave Checkout
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyObj = {
      amount: String(montant),
      currency: 'XOF',
      success_url: `${process.env.API_BASE_URL || 'http://localhost:8080/api'}/paiements/wave/success/${reference}`,
      error_url: `${process.env.API_BASE_URL || 'http://localhost:8080/api'}/paiements/wave/error/${reference}`,
    };
    const body = JSON.stringify(bodyObj);
    const waveSignature = this._signRequest(body, timestamp);

    const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
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
    const timestamp = Math.floor(Date.now() / 1000);
    const body = '';
    const waveSignature = this._signRequest(body, timestamp);

    const response = await fetch(`${this.baseUrl}/checkout/sessions/${referenceOperateur}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Wave-Signature': waveSignature,
      },
    });

    if (!response.ok) {
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
    // Non implémenté MVP
    return false;
  }
}

module.exports = ProviderWave;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/providers/ProviderWave.js
git commit -m "feat: add Wave payment provider"
```

---

### Task 2: ProviderOrangeMoney.js

**Fichiers :**
- Créer : `backend/src/services/providers/ProviderOrangeMoney.js`
- Référence : `backend/src/services/providers/IPaymentProvider.js`

- [ ] **Step 1: Écrire ProviderOrangeMoney.js**

```javascript
// Provider Orange Money : intégration Orange Money OTP Payment API (Sénégal)
// initierPaiement → récupère token OAuth + clé publique RSA
// confirmerOtp → POST /v1.0/payment/otp (paiement en une étape avec OTP)
// verifierPaiement → GET /v1.0/payment/transaction/{id}

const IPaymentProvider = require('./IPaymentProvider');

class ProviderOrangeMoney extends IPaymentProvider {
  constructor() {
    super();
    this.clientId = process.env.ORANGE_CLIENT_ID;
    this.clientSecret = process.env.ORANGE_CLIENT_SECRET;
    this.merchantCode = process.env.ORANGE_MERCHANT_CODE;
    this.baseUrl = process.env.ORANGE_PRODUCTION_URL
      || 'https://api.sandbox.orange-sonatel.com';
  }

  get nom() { return 'ORANGE_MONEY' }

  async _getToken() {
    const response = await fetch(`${this.baseUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error('Orange Money: échec authentification');
    const data = await response.json();
    return data.access_token;
  }

  async _getPublicKey(token) {
    const response = await fetch(`${this.baseUrl}/v1.0/publickey`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Orange Money: échec récupération clé publique');
    const data = await response.json();
    return data.publicKey;
  }

  // Étape 1 : récupère token + clé publique
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    const token = await this._getToken();
    const publicKey = await this._getPublicKey(token);

    return {
      redirectUrl: null, // pas de redirect, formulaire OTP mobile
      referenceOperateur: reference, // la référence interne sert de lien
      metadata: { token, publicKey, accessToken: token }, // transmis au mobile via l'API, jamais loggé
    };
  }

  // Étape 2 : confirmation OTP (appelée depuis le mobile)
  async confirmerOtp({ msisdn, otp, encryptedPin, montant, reference, token }) {
    const accessToken = token || await this._getToken();

    const response = await fetch(`${this.baseUrl}/v1.0/payment/otp`, {
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

    const data = await response.json();

    return {
      transactionId: data.transactionId || null,
      status: data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      referenceOperateur: data.transactionId,
    };
  }

  async verifierPaiement(referenceOperateur) {
    try {
      const token = await this._getToken();
      const response = await fetch(
        `${this.baseUrl}/v1.0/payment/transaction/${referenceOperateur}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) return { statut: 'FAILED' };
      const data = await response.json();
      return { statut: data.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING' };
    } catch {
      return { statut: 'FAILED' };
    }
  }

  async rembourser(referenceOperateur, montant) {
    return false;
  }
}

module.exports = ProviderOrangeMoney;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/providers/ProviderOrangeMoney.js
git commit -m "feat: add Orange Money payment provider"
```

---

### Task 3: Backend — PaymentService + billetController asynchrone + webhookController

**Fichiers :**
- Modifier : `backend/src/services/PaymentService.js`
- Modifier : `backend/src/controllers/billetController.js`
- Créer : `backend/src/controllers/webhookController.js`

- [ ] **Step 1: Modifier PaymentService.js — ajouter les cases WAVE et ORANGE_MONEY**

```javascript
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
        return new ProviderWave();
      case 'ORANGE_MONEY':
        return new ProviderOrangeMoney();
      default:
        throw new Error(`Provider ${type} non supporté`);
    }
  }
}

module.exports = PaymentService;
```

- [ ] **Step 2: Modifier billetController.js — flux asynchrone**

Dans la fonction `acheter()` :

**Changement 1 :** Insert billet avec `statut = 'EN_ATTENTE'` au lieu de `'ACTIF'` (ligne 91-92 du fichier actuel) :
```javascript
      const [billetResult] = await conn.query(
        `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, payload_signature, prix_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
        [uuid, numero, evenementId, categorieTicketId, telephone, payload_signature, montantTotal]
      );
```

**Changement 2 :** Insert transaction avec `statut = 'PENDING'` au lieu de `'SUCCESS'` (ligne 107-108) :
```javascript
      await conn.query(
        `INSERT INTO transaction (reference, billet_id, montant, frais, devise, statut, moyen_paiement, telephone_payeur)
         VALUES (?, ?, ?, 0, 'FCFA', 'PENDING', ?, ?)`,
        [reference, billetId, montantTotal, provider, telephone]
      );
```

**Changement 3 :** Après l'initiation du paiement (lignes 119-139) — conserver le code existant (appelle `provider.initierPaiement()`, met à jour `reference_operateur`). Le `redirectUrl` est déjà retourné dans la réponse.

Retour API (inchangé) :
```javascript
      res.status(201).json({
        billet: { ...billet, statut: 'EN_ATTENTE' },
        paiement: {
          reference,
          redirectUrl: paymentResult.redirectUrl,
          referenceOperateur: paymentResult.referenceOperateur,
          provider,
        },
      });
```

- [ ] **Step 3: Créer webhookController.js**

```javascript
// Contrôleur des webhooks de paiement
// Reçoit les notifications Wave (checkout.session.completed) et Orange Money

const pool = require("../config/db");
const crypto = require("crypto");

const WAVE_SIGNING_SECRET = process.env.WAVE_SIGNING_SECRET;

// Vérifie la signature HMAC d'un webhook Wave
function verifierSignatureWave(signatureHeader, body, timestamp) {
  if (!WAVE_SIGNING_SECRET) return true; // pas de vérification si pas configuré
  const payload = String(timestamp) + body;
  const expected = crypto.createHmac('sha256', WAVE_SIGNING_SECRET).update(payload).digest('hex');
  const match = signatureHeader.match(/v1=([a-f0-9]+)/);
  return match && match[1] === expected;
}

// Webhook Wave : checkout.session.completed
const gererWebhookWave = async (req, res) => {
  try {
    const signatureHeader = req.headers['wave-signature'];
    if (!signatureHeader) {
      return res.status(401).json({ message: 'Signature manquante' });
    }

    const timestampMatch = signatureHeader.match(/t=(\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;

    // Vérifier que le timestamp est récent (±5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(401).json({ message: 'Signature expirée' });
    }

    const rawBody = req.body.toString(); // body brut (raw middleware)
    if (!verifierSignatureWave(signatureHeader, rawBody, timestamp)) {
      return res.status(401).json({ message: 'Signature invalide' });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.id;

      // Trouver la transaction par reference_operateur
      const [transactions] = await pool.query(
        "SELECT id, billet_id, reference FROM transaction WHERE reference_operateur = ?",
        [sessionId]
      );

      if (transactions.length === 0) {
        console.warn(`Webhook Wave : session ${sessionId} non trouvée`);
        return res.status(200).json({ message: 'Ignoré' });
      }

      const tx = transactions[0];

      // Mettre la transaction à SUCCESS
      await pool.query(
        "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE id = ?",
        [tx.id]
      );

      // Activer le billet
      await pool.query(
        "UPDATE billet SET statut = 'ACTIF' WHERE id = ?",
        [tx.billet_id]
      );

      console.log(`✅ Paiement Wave confirmé : ${tx.reference}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook Wave error:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Confirmation Orange Money (appelée par le mobile après OTP)
const gererConfirmationOrange = async (req, res) => {
  try {
    const { msisdn, otp, encryptedPin, montant, reference } = req.body;

    if (!msisdn || !otp || !encryptedPin || !reference) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    // Instancier le provider Orange Money
    const ProviderOrangeMoney = require('./providers/ProviderOrangeMoney');
    const provider = new ProviderOrangeMoney();

    // Confirmer le paiement OTP
    const resultat = await provider.confirmerOtp({
      msisdn,
      otp,
      encryptedPin,
      montant,
      reference,
    });

    if (resultat.status === 'SUCCESS') {
      // Trouver la transaction
      const [transactions] = await pool.query(
        "SELECT id, billet_id FROM transaction WHERE reference = ?",
        [reference]
      );

      if (transactions.length > 0) {
        const tx = transactions[0];

        await pool.query(
          "UPDATE transaction SET statut = 'SUCCESS', reference_operateur = ?, date_mise_a_jour = NOW() WHERE id = ?",
          [resultat.referenceOperateur || resultat.transactionId, tx.id]
        );

        await pool.query(
          "UPDATE billet SET statut = 'ACTIF' WHERE id = ?",
          [tx.billet_id]
        );

        console.log(`✅ Paiement Orange Money confirmé : ${reference}`);
      }
    }

    res.json({
      success: resultat.status === 'SUCCESS',
      transactionId: resultat.transactionId,
    });
  } catch (err) {
    console.error('Confirmation Orange error:', err);
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
};

module.exports = { gererWebhookWave, gererConfirmationOrange };
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/PaymentService.js backend/src/controllers/billetController.js backend/src/controllers/webhookController.js
git commit -m "feat: async payment flow + webhook handler"
```

---

### Task 4: Routes paiements

**Fichiers :**
- Modifier : `backend/src/routes/paiements.js`

- [ ] **Step 1: Ajouter les routes webhook**

```javascript
const express = require("express");
const router = express.Router();
const paiementController = require("../controllers/paiementController");
const webhookController = require("../controllers/webhookController");

router.get("/:reference/statut", paiementController.statutPaiement);

// Webhook Wave (body brut pour vérification HMAC)
router.post("/wave/webhook", express.raw({type: 'application/json'}), webhookController.gererWebhookWave);

// Confirmation Orange Money (JSON normal)
router.post("/orange/confirmer", express.json(), webhookController.gererConfirmationOrange);

module.exports = router;
```

- [ ] **Step 2: Ajouter les variables d'environnement dans `.env.example`**

```env
# Wave Business API
WAVE_API_KEY=
WAVE_SIGNING_SECRET=
WAVE_BASE_URL=https://api.wave.com

# Orange Money API
ORANGE_CLIENT_ID=
ORANGE_CLIENT_SECRET=
ORANGE_MERCHANT_CODE=
ORANGE_SANDBOX_URL=https://api.sandbox.orange-sonatel.com
ORANGE_PRODUCTION_URL=https://api.orange-sonatel.com

# URL publique du backend (pour les webhooks/callbacks Wave)
API_BASE_URL=http://localhost:8080/api
```

- [ ] **Step 3: Modifier paiementController.js — vérification provider réel**

Remplacer le bloc lignes 19-38 (vérification simulation uniquement) pour supporter les providers réels :

```javascript
    // Vérifier le statut via le provider si c'est un vrai provider externe
    let statut = tx.statut;
    if (tx.statut === 'PENDING' && tx.moyen_paiement !== 'SIMULATION') {
      try {
        const provider = PaymentService.getProvider(tx.moyen_paiement);
        if (provider.verifierPaiement) {
          const result = await provider.verifierPaiement(tx.reference_operateur);
          statut = result.statut;

          if (statut === 'SUCCESS') {
            await pool.query(
              "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
              [reference]
            );
            await pool.query(
              `UPDATE billet SET statut = 'ACTIF' WHERE id = (
                SELECT billet_id FROM transaction WHERE reference = ?
              )`,
              [reference]
            );
          }
        }
      } catch (err) {
        console.error("Provider verification error:", err);
      }
    } else if (tx.statut === 'PENDING' && tx.moyen_paiement === 'SIMULATION') {
      // Simulation : toujours SUCCESS
      // ... (code existant)
    }
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/paiements.js backend/src/controllers/paiementController.js backend/.env.example
git commit -m "feat: payment webhook routes + env vars"
```

---

### Task 5: Mobile — billetService + PaiementScreen (sélecteur provider)

**Fichiers :**
- Modifier : `mobile/src/services/billetService.js`
- Modifier : `mobile/src/screens/PaiementScreen.jsx`

- [ ] **Step 1: Modifier billetService.js — ajouter param provider**

```javascript
// appels API liés aux billets

import { appelAPI } from './apiService'

export const acheterBillet = async (evenementId, categorieTicketId, telephone, email, provider = 'SIMULATION') => {
  return appelAPI('/billets/acheter', {
    method: 'POST',
    body: { evenementId, categorieTicketId, telephone, email, provider },
  })
}

export const mesBillets = async (telephone, email) => {
  const params = new URLSearchParams()
  if (telephone) params.append('telephone', telephone)
  if (email) params.append('email', email)
  return appelAPI(`/billets/mes-billets?${params.toString()}`)
}

export const statutPaiement = async (reference) => {
  return appelAPI(`/paiements/${reference}/statut`)
}
```

- [ ] **Step 2: Modifier PaiementScreen.jsx — ajouter sélecteur Wave/Orange Money**

Ajouter une nouvelle étape `'choix'` après `'confirm'` et avant `'pending'` :

**Import en haut :**
```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { acheterBillet, statutPaiement } from '../services/billetService'
import BuyerLayout from '../components/BuyerLayout'
import { useAuth } from '../context/AuthContext'
```

**Dans la fonction, ajouter après la déclaration des states :**
```javascript
  const [provider, setProvider] = useState(null) // 'WAVE' | 'ORANGE_MONEY' | null
  const [referencePaiement, setReferencePaiement] = useState(null)
```

**Modifier demarrerPaiement :**
```javascript
  const demarrerPaiement = useCallback(async () => {
    setEtape('pending')
    setSpinning(true)
    const anim = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    anim.start()

    try {
      const telPropre = telephone.replace(/[^\d]/g, '')
      const telComplet = telPropre.startsWith('221') ? `+${telPropre}` : `+221${telPropre}`

      const resultat = await acheterBillet(eventId, ticket.id, telComplet, profil?.email, provider)
      anim.stop()
      setSpinning(false)

      if (!resultat || !resultat.billet) {
        throw new Error('Réponse invalide du serveur')
      }

      await definirTelephone(telComplet)

      if (provider === 'WAVE' && resultat.paiement?.redirectUrl) {
        // Naviguer vers la WebView Wave
        setReferencePaiement(resultat.paiement.reference)
        navigation.replace('WebViewWave', {
          redirectUrl: resultat.paiement.redirectUrl,
          transactionReference: resultat.paiement.reference,
          eventId,
          ticket: { ...resultat.billet, eventId },
        })
      } else if (provider === 'ORANGE_MONEY') {
        // Naviguer vers le formulaire OTP
        setReferencePaiement(resultat.paiement.reference)
        navigation.replace('PaiementOrange', {
          transactionReference: resultat.paiement.reference,
          montant: ticket.price,
          eventId,
          ticket: { ...resultat.billet, eventId },
          telephone: telComplet,
        })
      } else {
        // Simulation (fallback)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setBillet({ ...resultat.billet, eventId })
        setEtape('success')
      }
    } catch (err) {
      anim.stop()
      setSpinning(false)
      setEtape('failed')
      setError(err.message || 'Erreur de connexion au serveur')
    }
  }, [eventId, ticket, telephone, provider, spinAnim, definirTelephone, profil, navigation])
```

**Modifier handleConfirm pour rediriger vers le choix :**
```javascript
  const handleConfirm = () => {
    if (!telephone || telephone.replace(/[^\d]/g, '').length < 6) {
      return
    }
    setEtape('choix') // au lieu de 'choix' direct
  }
```

**Ajouter une étape 'choix' dans le JSX (entre confirm et pending) :**
```jsx
          {/* Étape 1.5 : Choix du moyen de paiement */}
          {etape === 'choix' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setEtape('confirm')}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <Text style={s.eventTitleMin}>{eventTitle}</Text>
              <Text style={s.ticketInfoMin}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>

              <ScrollView contentContainerStyle={s.providerSection}>
                <Text style={s.providerTitle}>Choisis ton moyen de paiement</Text>

                <TouchableOpacity
                  style={[s.providerCard, provider === 'WAVE' && s.providerCardSelected]}
                  onPress={() => { setProvider('WAVE'); demarrerPaiement() }}
                  activeOpacity={0.8}
                >
                  <View style={s.providerIcon}>
                    <Feather name="zap" size={24} color="#6366F1" />
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>Wave</Text>
                    <Text style={s.providerDesc}>Paiement rapide via l'app Wave</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mid} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.providerCard, provider === 'ORANGE_MONEY' && s.providerCardSelected]}
                  onPress={() => { setProvider('ORANGE_MONEY'); demarrerPaiement() }}
                  activeOpacity={0.8}
                >
                  <View style={s.providerIcon}>
                    <Feather name="smartphone" size={24} color="#FF6B00" />
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>Orange Money</Text>
                    <Text style={s.providerDesc}>Paiement par code OTP depuis ton téléphone</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mid} />
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
```

**Ne pas oublier d'ajouter les styles pour les cartes provider (à ajouter dans le StyleSheet) :**
```javascript
  providerSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  providerTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: colors.slate,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  providerCardSelected: {
    borderColor: '#6366F1',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: colors.slate,
  },
  providerDesc: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 11,
    color: colors.mid,
    marginTop: 2,
  },
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/services/billetService.js mobile/src/screens/PaiementScreen.jsx
git commit -m "feat: add provider selector to payment screen"
```

---

### Task 6: Mobile — WebViewWaveScreen

**Fichiers :**
- Créer : `mobile/src/screens/WebViewWaveScreen.jsx`
- Installer : `react-native-webview`

- [ ] **Step 1: Installer react-native-webview**

```bash
cd mobile && npx expo install react-native-webview
```

- [ ] **Step 2: Créer WebViewWaveScreen.jsx**

```javascript
// Écran WebView pour le paiement Wave
// Ouvre wave_launch_url dans une WebView intégrée
// Périodiquement vérifie le statut du paiement

import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { statutPaiement } from '../services/billetService'

const POLL_INTERVAL = 3000 // 3 secondes entre chaque vérification
const MAX_POLLS = 60 // 3 minutes max d'attente

export default function WebViewWaveScreen({ route, navigation }) {
  const { redirectUrl, transactionReference, eventId, ticket } = route.params
  const [statut, setStatut] = useState('PENDING') // PENDING | SUCCESS | FAILED
  const [erreur, setErreur] = useState('')
  const pollCountRef = useRef(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Polling du statut paiement
    intervalRef.current = setInterval(async () => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLLS) {
        clearInterval(intervalRef.current)
        setStatut('FAILED')
        setErreur('Le délai d\'attente a été dépassé')
        return
      }

      try {
        const resultat = await statutPaiement(transactionReference)
        if (resultat.statut === 'SUCCESS') {
          clearInterval(intervalRef.current)
          setStatut('SUCCESS')
        } else if (resultat.statut === 'FAILED') {
          clearInterval(intervalRef.current)
          setStatut('FAILED')
          setErreur('Le paiement a échoué')
        }
      } catch (err) {
        // Ignorer les erreurs de polling (réseau instable)
      }
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionReference])

  // Rediriger vers le ticket quand le paiement est confirmé
  useEffect(() => {
    if (statut === 'SUCCESS') {
      const timer = setTimeout(() => {
        navigation.replace('Ticket', { ticket })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [statut, navigation, ticket])

  if (statut === 'SUCCESS') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerBox}>
          <LinearGradient colors={['#00E5A0', '#00C8FF']} style={s.checkCircle}>
            <Feather name="check" size={36} color="#fff" />
          </LinearGradient>
          <Text style={s.successText}>Paiement réussi !</Text>
          <Text style={s.subText}>Redirection vers votre ticket...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (statut === 'FAILED') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerBox}>
          <View style={s.errorCircle}>
            <Feather name="x" size={36} color="#fff" />
          </View>
          <Text style={s.errorText}>Paiement échoué</Text>
          {erreur ? <Text style={s.subText}>{erreur}</Text> : null}
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => navigation.replace('Paiement', { eventId, eventTitle: ticket.evenement, ticket })}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.retryGradient}>
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={s.retryText}>Réessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            clearInterval(intervalRef.current)
            navigation.goBack()
          }}
        >
          <Feather name="x" size={18} color={colors.slate} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paiement Wave</Text>
        <View style={s.headerRight} />
      </View>

      <WebView
        source={{ uri: redirectUrl }}
        style={s.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={s.loadingOverlay}>
            <Text style={s.loadingText}>Chargement de Wave...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  headerTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.slate,
  },
  headerRight: { width: 36 },
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: colors.green || '#10b981',
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: '#ef4444',
  },
  subText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
  },
  retryBtn: { borderRadius: 100, overflow: 'hidden' },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  retryText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/WebViewWaveScreen.jsx
git commit -m "feat: add Wave WebView payment screen"
```

---

### Task 7: Mobile — PaiementOrangeScreen

**Fichiers :**
- Créer : `mobile/src/screens/PaiementOrangeScreen.jsx`

- [ ] **Step 1: Créer PaiementOrangeScreen.jsx**

```javascript
// Écran de paiement Orange Money (OTP)
// L'utilisateur entre son code OTP (#144#) et son PIN
// Le backend crypte le PIN avec la clé publique RSA et initie le paiement

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { appelAPI } from '../services/apiService'
import BuyerLayout from '../components/BuyerLayout'

export default function PaiementOrangeScreen({ route, navigation }) {
  const { transactionReference, montant, eventId, ticket, telephone } = route.params
  const [msisdn, setMsisdn] = useState(telephone || '')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState('saisie') // saisie | pending | success | failed
  const [erreur, setErreur] = useState('')

  const handlePaiement = async () => {
    if (!msisdn || !otp || !pin) {
      Alert.alert('Champs requis', 'Remplis tous les champs')
      return
    }

    setLoading(true)
    setEtape('pending')

    try {
      const resultat = await appelAPI('/paiements/orange/confirmer', {
        method: 'POST',
        body: {
          msisdn,
          otp,
          encryptedPin: pin, // Le backend crypte en RSA
          montant,
          reference: transactionReference,
        },
      })

      if (resultat?.success) {
        setEtape('success')
        setTimeout(() => {
          navigation.replace('Ticket', { ticket })
        }, 2000)
      } else {
        setEtape('failed')
        setErreur(resultat?.message || 'Paiement échoué')
      }
    } catch (err) {
      setEtape('failed')
      setErreur(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          {etape === 'saisie' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <View style={s.infoRow}>
                <Feather name="smartphone" size={20} color={colors.accent} />
                <View>
                  <Text style={s.infoTitle}>Orange Money</Text>
                  <Text style={s.infoSub}>{montant?.toLocaleString()} FCFA</Text>
                </View>
              </View>

              <View style={s.form}>
                <Text style={s.stepTitle}>1. Ton numéro Orange Money</Text>
                <View style={s.inputRow}>
                  <View style={s.codeBox}><Text style={s.codeText}>+221</Text></View>
                  <TextInput
                    style={s.input}
                    value={msisdn.replace('+221', '')}
                    onChangeText={t => setMsisdn('+221' + t.replace(/[^\d]/g, ''))}
                    keyboardType="phone-pad"
                    placeholder="77 XXX XX XX"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <Text style={s.stepTitle}>2. Code OTP</Text>
                <Text style={s.stepHint}>Compose #144# depuis ton téléphone Orange, saisis le code reçu</Text>
                <TextInput
                  style={s.input}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="Ex: 123456"
                  placeholderTextColor={colors.muted}
                  maxLength={8}
                />

                <Text style={s.stepTitle}>3. Code PIN Orange Money</Text>
                <TextInput
                  style={s.input}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  placeholder="Ton code secret"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  maxLength={4}
                />

                <TouchableOpacity
                  style={s.payBtn}
                  onPress={handlePaiement}
                  activeOpacity={0.9}
                  disabled={loading}
                >
                  <LinearGradient colors={['#FF6B00', '#FF8C00']} style={s.payGradient}>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.payText}>Payer {montant?.toLocaleString()} FCFA</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={s.footer}>
                <Feather name="info" size={11} color={colors.muted} />
                <Text style={s.footerText}>Le code PIN est crypté et jamais stocké</Text>
              </View>
            </>
          )}

          {etape === 'pending' && (
            <View style={s.centerBox}>
              <Feather name="loader" size={40} color="#FF6B00" />
              <Text style={s.statusText}>Paiement en cours...</Text>
              <Text style={s.statusSub}>Patientez, votre paiement est traité</Text>
            </View>
          )}

          {etape === 'success' && (
            <View style={s.centerBox}>
              <LinearGradient colors={['#00E5A0', '#00C8FF']} style={s.checkCircle}>
                <Feather name="check" size={36} color="#fff" />
              </LinearGradient>
              <Text style={s.successText}>Paiement réussi !</Text>
              <Text style={s.statusSub}>Redirection vers votre ticket...</Text>
            </View>
          )}

          {etape === 'failed' && (
            <View style={s.centerBox}>
              <View style={s.errorCircle}>
                <Feather name="x" size={36} color="#fff" />
              </View>
              <Text style={s.errorText}>Paiement échoué</Text>
              <Text style={s.statusSub}>{erreur}</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => setEtape('saisie')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FF6B00', '#FF8C00']} style={s.retryGradient}>
                  <Feather name="refresh-cw" size={14} color="#fff" />
                  <Text style={s.retryText}>Réessayer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: borderRadius.sm,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoTitle: { fontFamily: fonts.outfit.bold, fontSize: 17, color: colors.slate },
  infoSub: { fontFamily: fonts.jakarta.regular, fontSize: 13, color: colors.mid, marginTop: 2 },
  form: { gap: spacing.sm },
  stepTitle: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.slate, marginTop: spacing.md },
  stepHint: { fontFamily: fonts.jakarta.regular, fontSize: 11, color: colors.mid, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: colors.border, borderRadius: borderRadius.md,
    borderTopRightRadius: 0, borderBottomRightRadius: 0,
  },
  codeText: { fontSize: 13, fontFamily: fonts.jakarta.semiBold, color: colors.slate },
  input: {
    fontFamily: fonts.jakarta.semiBold, fontSize: 14, color: colors.slate,
    backgroundColor: colors.white, borderRadius: borderRadius.md,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  payBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: spacing.xl, ...shadows.md },
  payGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  payText: { fontFamily: fonts.outfit.bold, fontSize: 15, color: '#fff' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  statusText: { fontFamily: fonts.outfit.semiBold, fontSize: 16, color: colors.slate },
  statusSub: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.mid, textAlign: 'center' },
  checkCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  successText: { fontFamily: fonts.outfit.bold, fontSize: 20, color: '#10b981' },
  errorCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: fonts.outfit.bold, fontSize: 20, color: '#ef4444' },
  retryBtn: { marginTop: 8, borderRadius: 100, overflow: 'hidden' },
  retryGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  retryText: { fontFamily: fonts.outfit.bold, fontSize: 14, color: '#fff' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: spacing.lg, marginTop: 'auto' },
  footerText: { fontSize: 10, color: colors.muted, fontFamily: fonts.jakarta.regular },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/PaiementOrangeScreen.jsx
git commit -m "feat: add Orange Money OTP payment screen"
```

---

### Task 8: Navigation mobile — AppNavigator

**Fichiers :**
- Modifier : `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Ajouter les imports et les screens**

Dans AppNavigator.js, dans la section des imports (vers les lignes 40-70, après les autres imports de screens) :

```javascript
import WebViewWaveScreen from '../screens/WebViewWaveScreen'
import PaiementOrangeScreen from '../screens/PaiementOrangeScreen'
```

Dans la pile AcheteurStack (après les autres `<Stack.Screen>` de la stack acheteur) :

```jsx
<Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
<Stack.Screen name="PaiementOrange" component={PaiementOrangeScreen} options={{ headerShown: false }} />
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/navigation/AppNavigator.js
git commit -m "feat: add payment screens to navigation"
```

---

## Auto-review checklist

- [ ] Spec coverage : Wave provider (Task 1), Orange Money provider (Task 2), PaymentService factory (Task 3), billetController async (Task 3), webhookController (Task 3), routes (Task 4), mobile sélecteur (Task 5), WebView (Task 6), OTP screen (Task 7), navigation (Task 8)
- [ ] Placeholder scan : aucun TBD/TODO/placeholder
- [ ] Type consistency : `initierPaiement` retour `{ redirectUrl, referenceOperateur }` cohérent dans tous les providers, `confirmerOtp` utilisé dans webhookController et PaiementOrangeScreen
