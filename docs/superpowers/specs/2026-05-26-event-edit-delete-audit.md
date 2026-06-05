# Modification et suppression d'événements (organisateur) + Traçabilité

## Objectif
Permettre à l'organisateur de modifier ou supprimer ses événements depuis l'app mobile, avec un journal d'audit local pour le futur administrateur web.

## Contraintes
- Stockage local AsyncStorage uniquement (pas de backend)
- Pas de rôle admin sur mobile (web uniquement plus tard)
- L'organisateur est identifié par son email

## Fonctionnalités

### 1. Modification d'événement
- Réutilisation de l'écran `CreerEvenementScreen` en mode édition
- Si `route.params.event` est fourni → pré-remplir tous les champs
- Bouton "Modifier l'événement" au lieu de "Créer l'événement"
- Conserver l'ID et le code contrôleur existants
- Les catégories existantes gardent leur ID, les nouvelles reçoivent un ID frais
- Validation identique à la création

### 2. Suppression d'événement
- Soft delete : marque `supprime: true` + `deletedAt: timestamp`
- L'événement disparaît du dashboard organisateur
- Reste dans AsyncStorage pour l'audit web
- Bouton "Supprimer" avec confirmation Alert

### 3. Traçabilité (audit log)
- Nouvelle clé AsyncStorage : `@senguichet_audit`
- Chaque entrée : `{ id, action, eventId, eventNom, par (email), changements?, timestamp }`
- Actions loggées : `creation`, `modification`, `suppression`
- Pour les modifications, `changements` est un diff des champs modifiés

## Modifications de code

### eventService.js
- `modifierEvenement(id, updates)` — fusionne les données, préserve id/code/createdAt
- `supprimerEvenement(id)` — soft delete
- `ajouterAudit(action, data)` — écrit une entrée dans le journal
- `getAuditLogs()` — retourne tous les logs triés (utilisé plus tard par le web)

### CreerEvenementScreen.jsx
- Mode édition si `route.params?.event` existe
- Pré-remplissage : nom, catégorie, date, lieu, horaire, description, catégories, poster
- Changement de titre et texte du bouton
- Appelle `modifierEvenement()` au lieu de `creerEvenement()`
- Logguer l'action dans l'audit

### OrganisateurDashboardScreen.jsx
- Dans la zone dépliée de chaque événement : boutons "✏️ Modifier" et "🗑️ Supprimer"
- "Modifier" → navigation.navigate('CreerEvenement', { event: evt })
- "Supprimer" → Alert confirmation → soft delete → reload → audit log
- `loadData()` filtre les événements avec `!e.supprime`

## Fichiers à modifier
| Fichier | Nature |
|---------|--------|
| `mobile/src/services/eventService.js` | Existant à modifier |
| `mobile/src/screens/organisateur/CreerEvenementScreen.jsx` | Existant à modifier |
| `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx` | Existant à modifier |
