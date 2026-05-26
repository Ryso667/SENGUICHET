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

## PR
PR #3 ouverte : feature/mouhtada → main
