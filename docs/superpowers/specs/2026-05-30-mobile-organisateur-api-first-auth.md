# Mobile Organisateur — Migration API-first (Phase 1 : Auth)

**Date :** 2026-05-30
**Contexte :** Le mobile organisateur utilise AsyncStorage offline-first et mock auth, alors que le web frontend et le backend Express/MySQL sont déjà connectés. Cette spec couvre la migration progressive vers une architecture API-first, en commençant par l'authentification.

---

## Architecture cible (phases)

1. **Phase 1 — Auth (cette spec)** : Remplacer le mock auth par l'API réelle
2. **Phase 2 — Événements** : Remplacer AsyncStorage events par API
3. **Phase 3 — Admin** : Ajouter dashboard admin mobile

---

---

## Phase 2 : Événements API-first

### Problème
- Les écrans organisateur utilisaient un pattern "try API, fallback AsyncStorage"
- Le formulaire de création ne gérait pas `ville` ni `dateFin` (manquants vs backend)
- Les statuts backend (`en_attente`, `actif`, etc.) n'étaient pas affichés

### Changements

### 1. `eventService.js`
- `creerEvenementAPI` et `modifierEvenementAPI` : ajout de `ville` et `dateFin` dans le body
- `dateFin` par défaut = `date` si non fourni
- `ville` par défaut = `lieu` si non fourni
- Les fonctions AsyncStorage (`creerEvenement`, `modifierEvenement`, etc.) sont conservées pour les flows acheteur/controleur qui en dépendent encore

### 2. `CreerEvenementScreen.jsx`
- **API-only** : plus de try/catch avec fallback AsyncStorage
- Ajout champ **Ville** (nouveau state `ville`)
- Ajout champ **Date de fin** avec calendrier inline (nouveau state `dateFin`)
- Recap modal mis à jour avec ville + dateFin
- Plus d'imports inutilisés (`modifierEvenement`, `ajouterAudit`, `creerEvenement`)
- Utilise `user` du context au lieu de `email`

### 3. `OrganisateurDashboardScreen.jsx`
- **API-only** : `loadData()` ne tombe plus sur `getAllEvenements()`
- Badge de statut backend coloré affiché sur chaque carte événement
- 5 statuts : `actif` (vert), `en_attente` (orange), `refuse` (rouge), `suspendu` (jaune), `annule` (gris)
- Plus d'imports inutilisés (`getAllEvenements`, `getEvenementStats`)

### 4. `GestionEvenementsScreen.jsx`
- **API-only** : `charger()` et `handleDelete()` sans fallback AsyncStorage
- Badge de statut backend affiché dans chaque carte avec couleurs
- Plus d'imports inutilisés

### 5. `VoirTicketsScreen.jsx`
- **Inchangé** : les endpoints de listing tickets backend n'existent pas encore

---

## Phase 1 : Authentification organisateur

### Problème
- `authService.js` a `MOCK_MODE = true` → retourne un mock JWT, pas de user
- `AuthContext` stocke email mais pas les infos user (id, nom, role, statut)
- `DashboardScreen` affiche `email` dans le hero
- Le backend a déjà l'endpoint `POST /api/auth/organisateur/connexion` qui retourne `{ token, user: { id, nom, telephone, email, role, statut } }`

### Changements

#### 1. `authService.js` — Suppression du mock
- Remplacer le bloc `if (MOCK_MODE)` de `connecterOrganisateur` par un vrai appel API via `appelAPI`
- Garder les autres fonctions mockées (acheteur, controleur) inchangées — hors scope

#### 2. `AuthContext.jsx` — Support du user object
- Ajouter un état `user` contenant `{ id, nom, email, telephone, role, statut }`
- `connecterOrganisateur(token, mail)` → `connecterOrganisateur(token, user)`
- Sauvegarder `user` dans AsyncStorage comme JSON
- Restaurer `user` dans `restaurerSession()`
- Nettoyer l'email stocké séparément (`STORAGE_KEY_EMAIL`) — le user JSON contient déjà l'email
- Exposer `user` dans le context value

#### 3. `ConnexionOrganisateurScreen.jsx` — Appel API réel
- Passer `reponse.user` (et non plus juste l'email) à `connecterOrganisateur()` du context
- La gestion d'erreur existe déjà (catch → alert)

#### 4. `DashboardScreen.jsx` — Afficher user.nom
- Remplacer `{ email }` par `{ user }` dans `useAuth()`
- Afficher `user?.nom || 'Organisateur'` dans le hero

### Format de réponse backend
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nom": "Moussa Diop",
    "telephone": "+221771234567",
    "email": "moussa@email.com",
    "role": "ORGANISATEUR",
    "statut": "VALIDE"
  }
}
```

### Pas de changements
- Navigation organisateur (inchangée)
- Création événement (inchangée — phase 2)
- Gestion tickets (inchangée)
