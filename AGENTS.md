# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Projet SENGUICHET — État d'avancement (Mai 2026)

## Branches
- `feature/mouhtada` — branche de dev (Personne 3)
- `main` — cible des PRs, ne pas toucher directement

## Ce qui est implémenté (mobile/)

### Auth 3 rôles
- Acheteur : OTP téléphone (+221 XX XXX XX XX), code test 123456
- Contrôleur : code accès 4 chiffres (mode mock accepte tout)
- Organisateur : email + mot de passe
- AuthContext : AsyncStorage, rôle persistant, déconnexion

### AccueilChoixScreen
- 3 cartes : Acheter / Scanner / Organisateur

### Scan contrôleur (hors-ligne)
- CameraView avec détection QR
- SQLite locale (tickets + scans)
- Vérification HMAC-SHA256, 5 statuts (VALIDE/DEJA_UTILISE/EXPIRE/INCONNU/FRAUDE)
- Téléchargement tickets pour offline
- Synchronisation batch au retour connexion

### Organisateur
- Dashboard, Créer événement, Voir tickets

### Navigation
- 3 piles conditionnelles selon rôle
- Bottom tabs par rôle
- Bouton "Quitter" dans le header

### Charte graphique
- Iris & Pêche (#6366F1 Indigo, #EC4899 Rose)
- Fond #F8F9FD, dégradé Indigo→Rose sur boutons

## Dépendances installées
expo-camera, expo-sqlite, expo-crypto

## Sécurité — OWASP
- Skill chargé automatiquement pour toute tâche d'auth/sécurité : `owasp-security`
- Sources : Password Storage, Authentication, Session Management, MASVS Cheat Sheets
- Avant chaque implémentation auth : fetch les cheatsheets, extraire les recommandations

### Recommandations OWASP clés

**Stockage mots de passe (bcrypt)**
- Work factor >= 10
- Limite 72 bytes — max length 72 caractères ou pré-hacher
- Ne JAMAIS stocker en clair
- bcrypt gère le sel automatiquement

**Authentification**
- Min 8 caractères (si MFA), 15 sinon
- Max au moins 64 caractères
- Messages d'erreur génériques ("Identifiant ou mot de passe incorrect")
- Ne PAS limiter les caractères autorisés
- Rate limiting / account lockout
- Transmettre uniquement sur TLS

**Mobile (MASVS)**
- Stocker tokens JWT dans SecureStore (expo-secure-store) plutôt qu'AsyncStorage
- Effacer données sensibles à la déconnexion
- Ne pas logger mots de passe ou tokens

## Contexte mémorisé (Mai 2026)
- **Branche de travail** : `feature/mouhtada` — NE JAMAIS modifier `main`
- **bcrypt pour organisateur** : doit être intégré côté mobile avec `bcryptjs` (pur JS)
  - Inscription organisateur avec hash bcrypt stocké dans AsyncStorage
  - Connexion avec vérification via bcrypt.compare()
  - Backend existant dans `backend/` mais pas d'API — ne pas toucher
- **Authentification** : 3 rôles (Acheteur OTP, Contrôleur code 4 chiffres, Organisateur email+bcrypt)

## Commentaires dans le code
- TOUS les fichiers source doivent avoir des commentaires en français expliquant :
  - Le rôle du fichier en haut (1-2 lignes)
  - Chaque fonction exportée : ce qu'elle fait, paramètres, retour
  - Les blocs de logique non triviaux (pourquoi, pas comment)
  - Les données mockées avec la mention "Sera remplacé par API"
- Les commentaires sont obligatoires pour tout nouveau fichier ou modification
- Privilégier des commentaires concis (1-3 lignes) plutôt que des pavés

## PR
PR #3 ouverte : feature/mouhtada → main
