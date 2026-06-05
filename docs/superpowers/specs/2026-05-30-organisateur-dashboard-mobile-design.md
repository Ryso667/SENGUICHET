# Spécification : Dashboard organisateur mobile (lecture seule)

**Date :** 30 mai 2026  
**Projet :** SENGUICHET  
**Branche :** feature/mouhtada  
**Contexte :** Parité fonctionnelle entre le dashboard web et mobile pour le rôle organisateur, avec une contrainte lecture seule sur mobile.

---

## 1. Architecture de navigation

### Drawer navigation

Remplacement des 4 bottom tabs (`OrganisateurTabs`) par un **DrawerNavigator** (`OrganisateurDrawer`) :

```
Drawer.Navigator
├── 📊 Vue d'ensemble        → OrganisateurDashboardScreen
├── 📅 Mes événements         → EvenementsStack
│   ├── GestionEvenementsScreen    (liste avec tabs + recherche)
│   ├── DetailEvenementScreen      (Nouveau)
│   └── VoirTicketsScreen          (amélioré)
├── 📈 Statistiques           → StatistiquesScreen (Nouveau)
├── ⚙️ Paramètres             → ParametresScreen (Nouveau)
└── 🚪 Déconnexion            → deconnecter() + navigation vers AccueilChoix
```

### Header

Chaque écran du drawer affiche :
- Icône menu (hamburger) à gauche → ouvre le drawer
- Titre de l'écran au centre
- Bouton "Quitter" à droite (déconnexion, conservé depuis l'existant)

### Drawer personnalisé

- En-tête : avatar avec initiale + nom complet + email de l'utilisateur
- Items avec icône et label
- Item actif : fond indigo + bordure gauche
- Fond : blanc avec ombre, reprend la charte graphique mobile (light)

---

## 2. Écrans

### 2.1 OrganisateurDashboardScreen (MODIFIÉ)

**Fichier :** `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

**Changements :**
- Hero banner gardé (dégradé Indigo→Rose, "Salut {nom}")
- Stats : passe de 3 à 4 cartes animées :
  - Événements actifs
  - Billets vendus (total)
  - Revenus (total FCFA)
  - Taux de remplissage moyen (%)
- Actions rapides : remplacer "Créer" / "Tickets" / "Gérer" par "Voir événements" / "Statistiques" / "Paramètres"
- Liste des événements récents (top 3) :
  - Carte avec barre de progression (remplis/capacité)
  - Badge de statut (Actif/En attente/Terminé)
  - Tap → navigation vers DetailEvenement
- Supprimer : bouton "Créer un événement", bouton "Se déconnecter" (déconnexion dans le header)
- Pull-to-refresh conservé
- Skeletons pendant chargement conservés

### 2.2 GestionEvenementsScreen (MODIFIÉ)

**Fichier :** `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`

**Changements :**
- Ajouter tabs : Tous / Actifs / Terminés
- Ajouter barre de recherche (filtre par nom)
- Supprimer les boutons Modifier / Supprimer par événement
- Supprimer swipe-to-delete
- Conserver pull-to-refresh
- Tap sur un événement → navigation vers DetailEvenementScreen avec `{ eventId }`
- État vide conservé

### 2.3 DetailEvenementScreen (NOUVEAU)

**Fichier :** `mobile/src/screens/organisateur/DetailEvenementScreen.jsx`

**Contenu :**
- Header avec nom de l'événement + badge statut
- Grille d'infos : Date, Lieu, Ville, Capacité totale
- Barre de progression (billets vendus / capacité)
- Section Description
- Section Tickets :
  - Liste des catégories de billets avec nom, prix, quantité vendue
  - Bouton "Voir tous les billets" → navigation vers VoirTicketsScreen avec `{ eventId }`
- Bouton retour dans le header

**Données :** `fetchEvenementDetailAPI(id)` → `{ evenement, tickets }`

### 2.4 VoirTicketsScreen (MODIFIÉ)

**Fichier :** `mobile/src/screens/organisateur/VoirTicketsScreen.jsx`

**Changements :**
- Supprimer la recherche par code événement (on arrive avec un `eventId`)
- Afficher le nom de l'événement en haut
- Liste des tickets : numéro, catégorie, téléphone acheteur, prix, statut (Valide/Utilisé/Expiré)
- État vide si aucun ticket

### 2.5 StatistiquesScreen (NOUVEAU)

**Fichier :** `mobile/src/screens/organisateur/StatistiquesScreen.jsx`

**Dépendance :** `victory-native`

**Contenu :**
- Sélecteur de période : 7 jours / 30 jours / 3 mois / Tout
- Cartes stats (4) : Billets vendus, Revenus, Taux remplissage, Événements
- Graphique en barres : Évolution des ventes
- Graphique camembert : Répartition par événement
- Chargement avec skeletons

**Données :** Les stats sont calculées côté client à partir de `fetchEvenementsAPI()`.
- Ventes quotidiennes générées aléatoirement (comme le web en attendant un endpoint stats dédié)
- Répartition par événement calculée à partir des événements réels

### 2.6 ParametresScreen (NOUVEAU)

**Fichier :** `mobile/src/screens/organisateur/ParametresScreen.jsx`

**Contenu (lecture seule) :**
- Section Profil : Nom, Email, Téléphone (affichage)
- Section Sécurité : option "Changer le mot de passe" → lien vers version web
- Section Notifications : 3 toggles (SMS ventes, Email récap, Alertes stock) — stockés localement
- Bouton "Se déconnecter"

---

## 3. Données et services

### API utilisée
Tous les appels passent par `eventService.js` existant (déjà migré vers API backend) :
- `fetchEvenementsAPI()` → liste complète
- `fetchEvenementDetailAPI(id)` → détail + tickets
- `appelAPI()` via `apiService.js` (JWT, timeout 10s)

### Calcul des stats
Les statistiques sont calculées client-side à partir des événements chargés :
- Nombre d'événements actifs
- Somme des `billets_vendus`
- Somme des `recettes`
- Moyenne des taux de remplissage

---

## 4. Dépendances à installer

```bash
npx expo install @react-navigation/drawer victory-native
```

`react-native-gesture-handler` et `react-native-reanimated` sont déjà installés (présents dans package.json).

---

## 5. Fichiers modifiés / créés

| Action | Fichier |
|--------|---------|
| NOUVEAU | `mobile/src/navigation/OrganisateurDrawer.js` |
| NOUVEAU | `mobile/src/screens/organisateur/DetailEvenementScreen.jsx` |
| NOUVEAU | `mobile/src/screens/organisateur/StatistiquesScreen.jsx` |
| NOUVEAU | `mobile/src/screens/organisateur/ParametresScreen.jsx` |
| MODIFIÉ | `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx` |
| MODIFIÉ | `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx` |
| MODIFIÉ | `mobile/src/screens/organisateur/VoirTicketsScreen.jsx` |
| MODIFIÉ | `mobile/src/navigation/AppNavigator.js` |
| MODIFIÉ | `mobile/src/constants/theme.js` (ajout couleurs pour stats) |
| SUPPRIMÉ | `mobile/src/navigation/OrganisateurTabs.js` (remplacé par Drawer) |

---

## 6. Contraintes

- **Lecture seule** : aucune action d'écriture (création, modification, suppression, annulation)
- **Thème light** mobile conservé (indigo + rose)
- **Navigation** : Drawer latéral, pas de bottom tabs
- **Backend requis** : pas de fallback offline pour l'organisateur
