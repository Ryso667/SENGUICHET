# Connexion Acheteur → Backend + Abstraction Paiement

**Date :** 2026-05-31
**Projet :** SENGUICHET
**Statut :** Spécification approuvée

## Résumé

Connecter le flux acheteur mobile au backend Express : remplacer les données mockées par des appels API, ajouter un système d'achat de billets avec abstraction de paiement (interface générique pour providers), et préparer l'intégration future des API Orange Money, Wave, Free Money, etc.

---

## Architecture globale

```
Mobile (Acheteur)              Backend (Express :8080)           MySQL
                                
HomeScreen ──────────────→ GET /api/evenements/public  ──→ evenement (statut='actif')
EventSearch ─────────────→ GET /api/evenements/public   ──→ evenement
EventDetail ─────────────→ GET /api/evenements/public/:id ──→ evenement + categorie_ticket

Achat:
EventDetail ─────────────→ POST /api/billets/acheter    ──→ crée billet + paiement,
                              │                              initie via ProviderFactory
                              │                              retourne { billet, paiement }
                              ↓
PaiementScreen            ←── redirectUrl (ou statut immediate)
   (polling)              ──→ GET /api/paiements/:ref/statut ──→ statut paiement
                              │
                              ↓
ConfirmationAchatScreen  ←── billet actif apres REUSSI
```

---

## Nouvelles tables MySQL

### `paiement`

```sql
CREATE TABLE paiement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billet_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  devise VARCHAR(10) DEFAULT 'XOF',
  provider VARCHAR(50) NOT NULL,           -- 'SIMULATION', 'ORANGE_MONEY', 'WAVE', 'FREE_MONEY'
  reference_provider VARCHAR(255),          -- référence retournée par le provider externe
  statut ENUM('EN_ATTENTE','EN_COURS','REUSSI','ECHOUE','REMBOURSE') DEFAULT 'EN_ATTENTE',
  metadata JSON,                            -- données supplémentaires du provider
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mis_a_jour_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (billet_id) REFERENCES billet(id)
);
```

### `code_otp`

```sql
CREATE TABLE code_otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expire_le TIMESTAMP NOT NULL,
  utilise BOOLEAN DEFAULT FALSE,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modification de `billet`

Ajouter colonnes :
- `telephone VARCHAR(20)` — téléphone de l'acheteur
- `statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') DEFAULT 'EN_ATTENTE'` — initialement EN_ATTENTE, passe à ACTIF après paiement confirmé

---

## Abstraction Paiement

### Interface

```javascript
// IPaymentProvider
class IPaymentProvider {
  get nom() // string — identifiant lisible

  // Initie un paiement externe
  // Retourne { redirectUrl, referenceProvider }
  async initierPaiement({ montant, devise, reference, callbackUrl, metadata })

  // Vérifie le statut d'un paiement initié
  async verifierPaiement(referenceProvider)

  // Rembourse intégralement ou partiellement
  async rembourser(referenceProvider, montant)
}
```

### Provider Simulation (première implémentation)

- Simule une redirection avec validation automatique après 2-3 secondes
- `initierPaiement()` → retourne `{ redirectUrl: null, referenceProvider: "SIM-" + uuid }` (pas de vraie redirection externe)
- Le mobile affiche un écran "Paiement en cours..." et interroge le statut après un délai
- `verifierPaiement()` → retourne `REUSSI` après court délai
- Aucun appel réseau externe

### ProviderFactory

```javascript
class ProviderFactory {
  static getProvider(type) {
    switch(type) {
      case 'SIMULATION': return new ProviderSimulation();
      // case 'ORANGE_MONEY': return new ProviderOrangeMoney();
      // case 'WAVE': return new ProviderWave();
      default: throw new Error(`Provider ${type} non supporté`);
    }
  }
}
```

---

## Nouvelles routes backend

### Auth (OTP — préparé mais mock pour l'instant)

| Méthode | Route | Contrôleur | Auth |
|---------|-------|-----------|------|
| `POST` | `/api/auth/otp/envoyer` | `envoyerOTP` | Aucune |
| `POST` | `/api/auth/otp/verifier` | `verifierOTP` | Aucune |

### Événements publics

| Méthode | Route | Contrôleur | Auth | Description |
|---------|-------|-----------|------|-------------|
| `GET` | `/api/evenements/public` | `listerPublic` | Aucune | Événements avec `statut='actif'` et `date_fin >= NOW()` |
| `GET` | `/api/evenements/public/:id` | `detailPublic` | Aucune | Détail + catégories de billets |

### Billets

| Méthode | Route | Contrôleur | Auth | Description |
|---------|-------|-----------|------|-------------|
| `POST` | `/api/billets/acheter` | `acheter` | Aucune | Crée billet + paiement, initie via le provider, retourne les infos |
| `GET` | `/api/billets/mes-billets` | `mesBillets` | Aucune | Billets d'un téléphone (filtre côté serveur par `?telephone=`) |

### Paiements

| Méthode | Route | Contrôleur | Auth | Description |
|---------|-------|-----------|------|-------------|
| `GET` | `/api/paiements/:reference/statut` | `statutPaiement` | Aucune | Vérifie le statut (utilisé par le polling mobile) |
| `POST` | `/api/paiements/notifier` | `notifierPaiement` | Provider | Webhook/callback des providers externes |

---

## Flux d'achat complet

### Étapes

1. **Mobile** : `POST /api/billets/acheter`
   - Payload : `{ eventId, categorieId, telephone, quantite: 1, provider: "SIMULATION" }`
   - Backend : crée `billet` (statut='EN_ATTENTE'), crée `paiement` (statut='EN_ATTENTE'), appelle `ProviderFactory.getProvider('SIMULATION').initierPaiement(...)`, retourne les infos

2. **Mobile** : Reçoit `{ billet: { id, numero, prix }, paiement: { id, reference, redirectUrl }, provider: "SIMULATION" }`

3. **Mobile** : Navigue vers `PaiementScreen` — affiche "Redirection vers [provider]..."

   - Si `redirectUrl` est fourni : ouvrir dans une WebView
   - Si pas de `redirectUrl` (Simulation) : afficher animation et interroger le statut

4. **Mobile** : `GET /api/paiements/{reference}/statut` — polling toutes les 2s

5. **Backend** : Quand statut = `REUSSI`, mettre `billet.statut = 'ACTIF'`

6. **Mobile** : Navigue vers `ConfirmationAchatScreen` avec le billet + QR

---

## Modifications mobiles

### Services

**`authService.js`** :
- Remplacer `envoyerOTP()` / `verifierOTP()` mock par appels API (quand l'OTP backend sera prêt)
- Pour l'instant, garder le mock OTP (123456)

**`eventService.js`** :
- Ajouter `fetchEvenementsPublics()` → `GET /api/evenements/public`
- Ajouter `fetchEvenementDetailPublic(id)` → `GET /api/evenements/public/:id`
- Supprimer les MOCKS (ils ne seront plus utilisés par les écrans acheteur)

**Nouveau : `billetService.js`** :
- `acheterBillet(eventId, categorieId, telephone, provider)` → `POST /api/billets/acheter`
- `mesBillets(telephone)` → `GET /api/billets/mes-billets`

**Nouveau : `paiementService.js`** :
- `verifierStatut(reference)` → `GET /api/paiements/:reference/statut`

### Écrans

**`HomeScreen.js`** :
- Supprimer la constante `MOCKS`
- Remplacer par `fetchEvenementsPublics()` avec chargement/squelette
- Garder un cache local (AsyncStorage) en fallback si pas de réseau

**`EventSearchScreen.js`** :
- Même changement : remplacer `MOCKS` + AsyncStorage par API

**`EventDetailScreen.js`** :
- Remplacer l'appel à `getAllEvenements()` + migration par `fetchEvenementDetailPublic(id)`
- Supprimer `acheterTicket()` local
- Remplacer le bouton d'achat par un appel à `acheterBillet()` qui navigue vers `PaiementScreen`
- Conserver l'UI existante (sélection catégorie, téléphone, double confirmation)

**`MesTicketsScreen.jsx`** :
- Remplacer la lecture SQLite par `mesBillets(telephone)` via API
- Garder SQLite comme cache offline

### Nouveaux écrans

**`PaiementScreen.jsx`** :
- Affiche "Redirection vers [provider]..." avec animation
- Si provider = SIMULATION : animation de chargement 2-3s, puis succès
- Si provider externe : WebView avec redirectUrl
- Polling du statut ou attente du callback
- Échec → bouton "Réessayer" ou "Changer de moyen de paiement"
- Succès → navigue vers ConfirmationAchatScreen

**`ConfirmationAchatScreen.jsx`** (peut reprendre l'actuel `TicketScreen` après modifications) :
- Message de succès
- QR code du billet
- Boutons "Voir mes tickets", "Retour à l'accueil"
- Option : exporter PDF

---

## Phases d'implémentation

### Phase 1 — Backend : endpoints publics + base de l'achat

1. Ajouter la table `paiement` dans `schema.sql` et la colonne `statut`/`telephone` dans `billet`
2. Endpoints publics `GET /api/evenements/public` et `/public/:id`
3. Créer `services/PaymentService.js` (ProviderFactory + IPaymentProvider interface)
4. Créer `services/providers/ProviderSimulation.js`
5. Créer `POST /api/billets/acheter` et `GET /api/billets/mes-billets`
6. Créer `GET /api/paiements/:reference/statut`
7. Exécuter `migrate.js` pour appliquer les changements de schéma

### Phase 2 — Mobile : événements publics

1. Mettre à jour `eventService.js` : fonctions API + supprimer MOCKS
2. Modifier `HomeScreen.js` et `EventSearchScreen.js` pour utiliser l'API
3. Modifier `EventDetailScreen.js` pour utiliser l'API
4. Tester : navigation événements OK

### Phase 3 — Mobile : achat + paiement

1. Créer `billetService.js` et `paiementService.js`
2. Modifier `EventDetailScreen.js` : intégrer achat API
3. Créer `PaiementScreen.jsx`
4. Créer `ConfirmationAchatScreen.jsx`
5. Modifier `MesTicketsScreen.jsx` : API + cache offline
6. Tester : achat complet avec Simulation OK

### Phase 4 — OTP backend

1. Implémenter `POST /api/auth/otp/envoyer`
2. Implémenter `POST /api/auth/otp/verifier`
3. Connecter le mobile aux vrais endpoints OTP
4. Supprimer le mock OTP

---

## Notes techniques

- **HMAC secret** : Déplacer `'senguichet-cle-secrete-hmac'` vers les variables d'environnement (`.env`)
- **Prix des billets** : Le backend gère déjà les montants via `categorie_ticket.prix` — utiliser directement
- **Validation organisateur** : L'acheteur ne voit que les événements `statut='actif'` — la validation admin est déjà en place
- **JWT acheteur** : Pas nécessaire pour l'instant (pas de session longue). Le téléphone identifie l'acheteur.
- **Rate limiting** : Ajouter `express-rate-limit` sur les routes d'achat (max 5 tentatives/minute par téléphone)
