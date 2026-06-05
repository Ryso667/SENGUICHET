# Intégration Wave + Orange Money — Spécification technique

**Date :** 2026-06-01
**Projet :** SENGUICHET
**Contexte :** Migration du provider paiement simulé vers les vrais API Wave Business + Orange Money OTP Payment

---

## 1. Architecture générale

Le flux passe de synchrone (simulation) à asynchrone :

```
Avant :  Achat → billet ACTIF → paiement simulé → retour immédiat
Après :  Achat → billet EN_ATTENTE → initier paiement → wave_launch_url →
         WebView Wave (ou OTP Orange) → webhook → billet ACTIF
```

### Changements clés
- Billet créé `EN_ATTENTE` (plus `ACTIF`)
- Transaction créée `PENDING` (plus `SUCCESS`)
- Mobile reçoit `redirectUrl` (Wave) ou gère formulaire OTP (Orange)
- Webhook Wave (ou réponse Orange) → transaction → `SUCCESS`, billet → `ACTIF`

### Protection anti-abus
- Places déduites immédiatement (empêche la survente même en pending)
- Si paiement échoue ou expire (24h), un job batch remet les places et annule le billet

---

## 2. Backend — Providers

### 2.1. ProviderWave.js

**Fichier :** `backend/src/services/providers/ProviderWave.js`

Implémente `IPaymentProvider`.

```
initierPaiement({ montant, devise, reference, callbackUrl, metadata })
→ POST /v1/checkout/sessions
→ Headers: Authorization: Bearer {apiKey}, Wave-Signature: t={ts},v1={hmac}
→ Body: { amount: "X", currency: "XOF", success_url, error_url }
→ Retour: { redirectUrl: wave_launch_url, referenceOperateur: sessionId }
```

- HMAC-SHA256 calculé avec `timestamp + body` via `crypto.createHmac('sha256', signingSecret)`
- Validation du timestamp : ±5 minutes

```
verifierPaiement(referenceOperateur)
→ GET /v1/checkout/sessions/{id} (pas de body, body = "")
→ Retour: { statut: 'PENDING'|'SUCCESS'|'FAILED' }

rembourser(referenceOperateur, montant)
→ MVP non implémenté, retourne false
```

### 2.2. ProviderOrangeMoney.js

**Fichier :** `backend/src/services/providers/ProviderOrangeMoney.js`

Implémente `IPaymentProvider`.

```
initierPaiement({ montant, devise, reference, callbackUrl, metadata })
→ POST /oauth2/v1/token → récupère access_token
→ GET /v1.0/publickey → récupère clé publique RSA
→ Retour: { redirectUrl: null, referenceOperateur: null, publicKey }
```

L'initiation Orange Money est en 2 étapes :
1. `initierPaiement()` → récupère token + clé publique RSA
2. `confirmerOtp(msisdn, otp, encryptedPin, referenceOperateur)` → POST `/v1.0/payment/otp` → paiement effectif

```
confirmerOtp(msisdn, otp, encryptedPin, montant, reference)
→ POST /v1.0/payment/otp
→ Body: { msisdn, otp, encryptedPin, amount, merchantCode }
→ Retour: { transactionId, status }
```

```
verifierPaiement(transactionId)
→ GET /v1.0/payment/transaction/{transactionId}
→ Retour: { statut: 'PENDING'|'SUCCESS'|'FAILED' }
```

### 2.3. PaymentService.js

Ajouter les cases :
```js
case 'WAVE': return new ProviderWave();
case 'ORANGE_MONEY': return new ProviderOrangeMoney();
```

---

## 3. Backend — Contrôleurs

### 3.1. billetController.js — modification de `acheter()`

| Étape | Changement |
|---|---|
| Insert billet | `statut: 'EN_ATTENTE'` (avant `'ACTIF'`) |
| Insert transaction | `statut: 'PENDING'` (avant `'SUCCESS'`) |
| Déduction places | Inchangé |
| Initier paiement | Appelle `provider.initierPaiement()`, retourne `redirectUrl` |
| Retour API | `{ billet: {...}, paiement: { reference, redirectUrl, referenceOperateur, provider } }` |

### 3.2. webhookController.js — nouveau

**Fichier :** `backend/src/controllers/webhookController.js`

#### 3.2.1. gererWebhookWave(req, res)
- Lire header `Wave-Signature` → extraire `t={timestamp},v1={signature}`
- Lire body raw (JSON string)
- Vérifier HMAC-SHA256 avec `signingSecret`
- Parser `event.type` :
  - `checkout.session.completed` → trouver transaction par `reference_operateur`
  - Mettre transaction → `SUCCESS`, billet → `ACTIF`
  - Logguer le succès
- Retourner `200 OK`

#### 3.2.2. gererConfirmationOrange(req, res)
- Recevoir `{ msisdn, otp, encryptedPin, transactionReference, montant }`
- Appeler `ProviderOrangeMoney.confirmerOtp()`
- Si succès → transaction → `SUCCESS`, billet → `ACTIF`
- Retourner le résultat

---

## 4. Backend — Routes

**Fichier :** `backend/src/routes/paiements.js`

```js
const webhookController = require('../controllers/webhookController');

router.get("/:reference/statut", paiementController.statutPaiement);
router.post("/wave/webhook", express.raw({type: 'application/json'}), webhookController.gererWebhookWave);
router.post("/orange/confirmer", webhookController.gererConfirmationOrange);
```

Note : le middleware `express.raw({type: 'application/json'})` est nécessaire pour le webhook Wave (signature HMAC calculée sur le body brut, pas parsé).

---

## 5. Mobile — Modifications

### 5.1. PaiementScreen.jsx

Ajouter une nouvelle étape `choix` entre `confirm` et `pending` :

```
Étapes actuelles :  saisie → confirm → pending → success/fail
Nouvelles étapes :  saisie → confirm → choix (Wave/OM) → pending → success/fail
```

- Afficher 2 cartes : "Wave" (icône Wave) et "Orange Money" (icône OM)
- Au tap → appeler `acheterBillet(eventId, ticketId, phone, email, provider)`
- **Wave :** si `redirectUrl` présent → naviguer vers `WebViewWaveScreen`
- **Orange Money :** naviguer vers `PaiementOrangeScreen`

### 5.2. WebViewWaveScreen.jsx — nouveau

```
Props : { redirectUrl, transactionReference, eventId, ticket }
```

- Ouvrir `redirectUrl` dans `react-native-webview`
- Démarrer polling toutes les 3s : `GET /api/paiements/{reference}/statut`
- Quand `statut === 'SUCCESS'` → naviguer vers `TicketScreen`
- Quand `statut === 'FAILED'` → afficher erreur, bouton réessayer
- WebView fermée par l'utilisateur → vérifier une dernière fois le statut

### 5.3. PaiementOrangeScreen.jsx — nouveau

```
Props : { transactionReference, montant, eventId, ticket }
```

- Champ téléphone (MSISDN) pré-rempli
- Champ code OTP (généré via #144#)
- Champ code PIN (masqué)
- Bouton "Payer {montant} FCFA"
- Appelle `POST /api/paiements/orange/confirmer` avec `{ msisdn, otp, encryptedPin, transactionReference, montant }`
- Polling ou réponse synchrone → redirection vers TicketScreen

### 5.4. billetService.js

Modifier `acheterBillet()` pour accepter `provider` :
```js
export const acheterBillet = async (evenementId, categorieTicketId, telephone, email, provider = 'SIMULATION') => {
  return appelAPI('/billets/acheter', {
    method: 'POST',
    body: { evenementId, categorieTicketId, telephone, email, provider },
  });
};
```

### 5.5. AppNavigator.js

Ajouter dans la pile `AcheteurStack` :
```js
import WebViewWaveScreen from '../screens/WebViewWaveScreen';
import PaiementOrangeScreen from '../screens/PaiementOrangeScreen';

<Stack.Screen name="WebViewWave" component={WebViewWaveScreen} />
<Stack.Screen name="PaiementOrange" component={PaiementOrangeScreen} />
```

---

## 6. Configuration

### Variables d'environnement backend (.env)

```env
# Wave Business API
WAVE_API_KEY=wave_sn_prod_XXXXXXXXXXXXXXXXXXXXXXXX
WAVE_SIGNING_SECRET=wave_sn_AKS_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WAVE_BASE_URL=https://api.wave.com

# Orange Money API
ORANGE_CLIENT_ID=xxxxxxxx
ORANGE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
ORANGE_MERCHANT_CODE=xxxxxxxx
ORANGE_SANDBOX_URL=https://api.sandbox.orange-sonatel.com
ORANGE_PRODUCTION_URL=https://api.orange-sonatel.com
```

### Installation dépendance supplémentaire

Backend : `crypto` (built-in Node.js, déjà disponible)

Mobile : `react-native-webview` (pour WebView Wave)
```bash
cd mobile && npx expo install react-native-webview
```

---

## 7. Fichiers modifiés/créés

| Fichier | Action |
|---|---|
| `backend/src/services/providers/ProviderWave.js` | ✨ Nouveau |
| `backend/src/services/providers/ProviderOrangeMoney.js` | ✨ Nouveau |
| `backend/src/services/PaymentService.js` | ✏️ Ajouter cases WAVE, ORANGE_MONEY |
| `backend/src/controllers/billetController.js` | ✏️ Statut EN_ATTENTE/PENDING |
| `backend/src/controllers/webhookController.js` | ✨ Nouveau |
| `backend/src/routes/paiements.js` | ✏️ Ajouter routes webhook |
| `backend/.env.example` | ✏️ Ajouter vars Wave + OM |
| `mobile/src/screens/PaiementScreen.jsx` | ✏️ Ajout sélecteur provider |
| `mobile/src/screens/WebViewWaveScreen.jsx` | ✨ Nouveau |
| `mobile/src/screens/PaiementOrangeScreen.jsx` | ✨ Nouveau |
| `mobile/src/services/billetService.js` | ✏️ Ajouter param provider |
| `mobile/src/navigation/AppNavigator.js` | ✏️ Ajouter screens |
| `mobile/package.json` | ✏️ Ajouter react-native-webview |

---

## 8. Tests

### Backend (curl / Postman)
```bash
# Créer session Wave
curl -X POST http://localhost:8080/api/billets/acheter \
  -H "Content-Type: application/json" \
  -d '{"evenementId":1, "categorieTicketId":1, "telephone":"+221771234567", "provider":"WAVE"}'
# Réponse attendue : { billet: {...}, paiement: { reference, redirectUrl, ... } }

# Vérifier statut
curl http://localhost:8080/api/paiements/PAI-XXX/statut

# Simuler webhook Wave (en test)
curl -X POST http://localhost:8080/api/paiements/wave/webhook \
  -H "Wave-Signature: t=...,v1=..." \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"id":"sess_xxx"}}'
```

### Mobile
- Tester sélecteur Wave / Orange Money
- WebView Wave avec ngrok (backend exposé en HTTPS)
- OTP Orange avec numéros sandbox

---

## 9. Limitations MVP

- `ProviderWave.rembourser()` → non implémenté (retourne false)
- Pas d'expiration automatique des billets `EN_ATTENTE` (à faire dans un job séparé)
- Orange Money : pas de webhook, le mobile doit attendre la réponse API synchrone
- Wave : gestion des erreurs réseau côté WebView à améliorer
- Les logs de paiement sont consignés dans la console, pas de dashboard admin
