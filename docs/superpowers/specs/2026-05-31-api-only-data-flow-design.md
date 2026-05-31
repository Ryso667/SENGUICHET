# API-Only Data Flow — Suppression du stockage local mock

## Contexte
Les tickets "Dakar Festival Music" apparaissent dans "Mes tickets" alors qu'ils n'existent pas en base MySQL. Cause : AsyncStorage/SQLite local contenant des données de test.

## Objectif
Toutes les données du mobile doivent venir exclusivement de MySQL via l'API backend. Supprimer tout le code AsyncStorage/SQLite mort.

## Changements

### 1. HomeScreen — section "Mes tickets"
- Remplacer `useTickets()` hook (SQLite) par appel API `mesBillets(telephone)`
- Garder le même rendu visuel (ticketCard, statuts, etc.)

### 2. Supprimer `useTickets` hook
- Supprimer `mobile/src/hooks/useTickets.js`
- Supprimer les imports de `useTickets` partout

### 3. Nettoyer `eventService.js`
- Supprimer les fonctions AsyncStorage mortes : `getAllEvenements`, `getEvenement`, `creerEvenement`, `acheterTicket`, `getAllTickets`, `getTicketsByEvent`, `getEvenementStats`, `modifierEvenement`, `supprimerEvenement`, etc.
- Garder uniquement les fonctions API : `fetchEvenementsAPI`, `creerEvenementAPI`, `fetchEvenementDetailAPI`, `modifierEvenementAPI`, `annulerEvenementAPI`, `fetchEvenementsPublics`, `fetchEvenementDetailPublic`

### 4. Nettoyer `database/database.js`
- Supprimer les fonctions utilisées uniquement par acheteur (tables `buyer_tickets`)
- Garder uniquement les fonctions SQLite pour le scan contrôleur offline (tables `tickets` et `scans`)

### 5. Vider AsyncStorage/SQLite stale
- Ajouter une migration one-shot dans AuthContext : effacer `@senguichet_tickets`, `@senguichet_evenements`, `@senguichet_migrated_db_*`

### 6. Garder SQLite contrôleur offline
- Le scan offline (téléchargement tickets + vérification HMAC + sync batch) reste inchangé

## Fichiers modifiés
- `mobile/src/screens/HomeScreen.js`
- `mobile/src/hooks/useTickets.js` (supprimé)
- `mobile/src/services/eventService.js`
- `mobile/src/database/database.js`
- `mobile/src/context/AuthContext.js` (nettoyage one-shot)

## Tests
- HomeScreen : plus de tickets mock, que les vrais tickets API
- MesTicketsScreen : toujours API (inchangé)
- Organisateur : toujours API (inchangé)
- Scan contrôleur : toujours SQLite offline (inchangé)
