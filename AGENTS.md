# Projet SENGUICHET — État d'avancement (Juin 2026)

## Branches
- `feature/mouhtada` — branche de dev (Personne 3)
- `main` — cible des PRs, ne pas toucher directement

## Ce qui est implémenté

### Auth 3 rôles (mobile/)
- Acheteur : OTP email, code test 123456
- Contrôleur : code accès 4 chiffres (mode mock accepte tout)
- Organisateur : email + mot de passe (bcrypt)
- AuthContext : AsyncStorage, rôles persistants, suggestions email

### AccueilChoixScreen
- 3 cartes : Acheter / Scanner / Organisateur

### Scan contrôleur (hors-ligne)
- CameraView avec détection QR, SQLite locale, HMAC-SHA256
- 5 statuts : VALIDE/DEJA_UTILISE/EXPIRE/INCONNU/FRAUDE
- Téléchargement tickets offline, sync batch

### Organisateur
- Dashboard, Créer événement, Voir tickets

### Navigation
- 3 piles conditionnelles selon rôle, bottom tabs, bouton Quitter

### Notifications (backend/)
- Email SMTP (Gmail) : confirmation billet, code OTP, partenariat
- SMS Orange API (sandbox en attendant activation)
- Page publique `GET /api/billets/:uuid` avec HTML responsive

## Déploiement
- **API** : Vercel — https://backend-rust-sigma-64.vercel.app
- **Base de données** : TiDB Cloud Serverless (SSL requis)
  - Host: `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`
  - DB: `test`, User: `3Xf3xDmifk7jajp.root`
- **Variables d'env Vercel** : DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true, SMTP_USER, SMTP_PASS, ORANGE_CLIENT_ID, ORANGE_CLIENT_SECRET, ORANGE_SANDBOX
- `TICKET_URL` auto-détecté via `VERCEL_URL`

## Dépendances installées
expo-camera, expo-sqlite, expo-crypto, @vercel/node, nodemailer

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

## Contexte mémorisé (Juin 2026)
- **Branche de travail** : `feature/mouhtada` — NE JAMAIS modifier `main`
- **bcrypt pour organisateur** : backend hash avec bcrypt work factor 10
- **Authentification** : 3 rôles (Acheteur OTP email, Contrôleur code 4 chiffres, Organisateur email+bcrypt)
- **API déployée** sur Vercel avec base TiDB — ne pas écraser les infos de connexion
- **OTP store** : utilise la table `code_otp` en MySQL (plus de fichier JSON) — nécessaire pour Vercel serverless
- **Billet** : colonne `numero` VARCHAR(20) NOT NULL ajoutée (absent du schema initial)
- **Evenement** : les colonnes sont `affiche_url` (pas `image_url`), `titre` (pas `nom`), `capacite_totale` (pas `capacite`)
- **`simulé: true`** supprimé de la réponse OTP dans `authController.js`
- **SMTP Vercel** fonctionnel — vérifier boîte et spams
- **migrate.js** : SSL rejectUnauthorized: false, supprime CREATE DATABASE/USE, FOREIGN_KEY_CHECKS=0
- **db.js** : SSL rejectUnauthorized: false

## Commentaires dans le code
- TOUS les fichiers source doivent avoir des commentaires en français expliquant :
  - Le rôle du fichier en haut (1-2 lignes)
  - Chaque fonction exportée : ce qu'elle fait, paramètres, retour
  - Les blocs de logique non triviaux (pourquoi, pas comment)
  - Les données mockées avec la mention "Sera remplacé par API"
- Les commentaires sont obligatoires pour tout nouveau fichier ou modification
- Privilégier des commentaires concis (1-3 lignes) plutôt que des pavés

## PR mergées
- PR #3 : Module auth + scan contrôleur + 3 rôles (merged)
- PR #14 : Notifications email+SMS, page billet publique, Vercel deploy
- PR #15 : Fix connexionSociale + SSL Aiven
- PR #16 : Fix EmailService casing Linux + fonctions email partenaires
- PR #18 : Migration Aiven + SSL + OTP fichier→DB + table billet/acheteur fixes
- PR #20 : Fix affiche_url + numero column schema.sql
