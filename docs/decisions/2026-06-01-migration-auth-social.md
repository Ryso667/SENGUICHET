# Migration Auth : Téléphone OTP → Connexion Sociale (Google/Apple)

**Date :** 2026-06-01
**Auteur :** Équipe technique
**Statut :** Proposition à valider

---

## 1. Contexte

### Situation actuelle
- L'authentification des acheteurs est basée sur le numéro de téléphone + code OTP
- Implémentation initiale : mock "123456", puis tentative d'intégration Firebase Phone Auth
- Firebase Phone Auth nécessite **un envoi SMS réel** via l'infrastructure Firebase

### Constat
Après implémentation et tests, plusieurs obstacles sont apparus :

| Problème | Détail |
|----------|--------|
| **Coût** | Firebase Phone Auth n'est pas gratuit — chaque SMS coûte entre 0,01€ et 0,06€ selon le pays. Pour une plateforme à fort volume, les coûts deviennent significatifs |
| **Fiabilité** | La livraison SMS au Sénégal n'est pas garantie (réseau, délais, saturation). Un utilisateur qui ne reçoit pas son code = vente perdue |
| **reCAPTCHA** | Obligatoire pour l'envoi SMS Firebase. Ajoute de la friction et des bugs cross-platform (WebView vs natif) |
| **Compte facturation** | Firebase exige un compte de facturation (Google Cloud) même pour utiliser l'offre gratuite limitée |
| **Friction utilisateur** | Saisir son numéro, attendre le SMS, recopier le code = ~30 secondes de friction. Taux d'abandon élevé |
| **Région** | Certains opérateurs sénégalais peuvent être bloqués par les fournisseurs SMS internationaux |

---

## 2. Solution proposée : Google + Apple Sign-In

### Pourquoi ce choix

| Critère | Phone OTP | Google/Apple Sign-In |
|---------|-----------|---------------------|
| **Coût** | Payant par SMS | Gratuit, illimité |
| **Vitesse** | ~10-30s (attente SMS) | Instantané (1 tap) |
| **Fiabilité** | Dépend du réseau mobile | Dépend d'Internet (déjà requis pour l'app) |
| **Sécurité** | OTP interceptable (SIM swap, phishing) | OAuth 2.0 + JWT signé |
| **UX** | 2 écrans, 3 étapes | 1 tap, 1 écran |
| **Compatibilité** | Complexe cross-platform | SDK natif + Web |

### Avantages business
- **0€ de coût d'authentification** quel que soit le volume d'utilisateurs
- **Taux de conversion amélioré** : un tap vs saisie de numéro + code
- **Données utilisateur riches** : nom, email, photo de profil (optionnel)
- **Compatible App Store** : règle d'Apple satisfaite

---

## 3. Changements dans la base de données

### Table `acheteur` — Modifications

```sql
ALTER TABLE acheteur
  MODIFY telephone VARCHAR(20) DEFAULT NULL,  -- Devient optionnel
  ADD COLUMN auth_provider VARCHAR(20) DEFAULT NULL,  -- 'google', 'apple'
  ADD COLUMN provider_id VARCHAR(100) DEFAULT NULL,    -- ID unique du fournisseur
  ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL,      -- Photo de profil
  ADD UNIQUE INDEX idx_acheteur_provider (auth_provider, provider_id);
```

### Table `billet` — Aucun changement
- `telephone_acheteur` reste pour le contact pratique
- Si téléphone non fourni, ce champ peut être NULL

### Nouveau flux
1. L'acheteur se connecte via Google/Apple → `acheteur` est créé avec `auth_provider` + `provider_id`
2. Au moment du paiement, on peut demander le téléphone (optionnel) pour contact
3. Les billets sont liés à `acheteur.id`

---

## 4. Architecture technique

```
[App Mobile (Expo)]
       │
       ├── Google Sign-In → Firebase Auth → ID Token
       ├── Apple Sign-In  → Firebase Auth → ID Token
       │
       ▼
[Backend Express]
       │
       ├── Vérification du Firebase ID Token
       ├── Création/Mise à jour de l'acheteur
       └── Génération du JWT de session
```

### Côté mobile
- **Bibliothèque** : `expo-auth-session` pour Google (fonctionne dans Expo Go)
- **Bibliothèque** : `expo-apple-authentication` pour Apple (inclus dans Expo Go iOS)
- **Firebase Auth** côté mobile : création de credential → `signInWithCredential()`
- **Remplacé** : `EntrerNumeroScreen` + `EntrerOTPScreen` → `SocialAuthScreen` avec boutons Google/Apple
- **Phone optionnel** : demandé dans le flow de paiement (PaiementScreen)

### Côté backend
- **Nouvel endpoint** : `POST /api/auth/social` — reçoit le Firebase ID Token, vérifie, crée/lie l'acheteur
- **JWT** : généré côté backend après vérification du token Firebase

---

## 5. Impact sur les rôles

| Rôle | Changement |
|------|-----------|
| **Acheteur** | 🔴 **Impact majeur** — Suppression du flow phone+OTP, remplacement par Google/Apple |
| **Contrôleur** | 🟢 Aucun — garde son code 4 chiffres (mode mock) |
| **Organisateur (mobile)** | 🟢 Aucun pour l'instant — garde email+mdp |
| **Organisateur (web)** | 🟡 **Ajout optionnel** — Google/Apple viendra en alternative à email+mdp (phase ultérieure) |

---

## 6. Planning de migration

### Phase 1 — Base de données (30 min)
- Modifier la table `acheteur` (rendre phone nullable, ajouter colonnes auth)

### Phase 2 — Backend (2h)
- Ajouter `POST /api/auth/social` avec vérification Firebase ID Token
- Tester avec des tokens de test

### Phase 3 — Mobile (4h)
- Installer `expo-auth-session`, `expo-apple-authentication`
- Créer `SocialAuthScreen` avec boutons Google + Apple
- Adapter `AuthContext` pour stocker le profil utilisateur
- Modifier le flow de paiement pour demander le téléphone (optionnel)
- Adapter la navigation (supprimer écrans phone/OTP)

### Phase 4 — Tests (2h)
- Tester le flow complet sur iOS (Expo Go)
- Tester la création de compte + achat billet
- Touverifier la persistence de session

**Total estimé : ~1 journée de développement**

---

## 7. Alternatives écartées

| Alternative | Raison de l'abandon |
|------------|-------------------|
| **Conserver Phone OTP + payer** | Coût récurrent non justifié pour une startup. Chaque SMS = argent perdu |
| **OTP via API alternative (Twilio, etc.)** | Même problème de coût, plus complexité d'intégration supplémentaire |
| **Email + mot de passe uniquement** | Pas adapté aux acheteurs (friction, mot de passe à retenir) |
| **Numéro + code sans SMS (généré localement)** | Aucune sécurité — le mock actuel |

---

## 8. Conclusion

La migration vers Google/Apple Sign-In est **le choix le plus pragmatique** :
- **0€ de coût** d'authentification
- **Meilleure UX** (1 tap vs 3 étapes)
- **Plus sécurisé** (OAuth 2.0 vs SMS)
- **Plus fiable** (pas de dépendance au réseau mobile)
- **Prépare l'avenir** (données utilisateur riches)

Le numéro de téléphone reste disponible **optionnellement** au moment du paiement, pour les cas où l'organisateur a besoin de contacter l'acheteur.
