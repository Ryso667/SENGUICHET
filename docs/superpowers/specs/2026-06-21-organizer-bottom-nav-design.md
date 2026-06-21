# Refonte navigation organisateur — Bottom Tabs

## Objectif

Remplacer l'actuel `OrganizerDrawer` (stack unique avec grille "Navigation rapide" sur le Dashboard) par une navigation par onglets en bas (bottom tabs) cohérente avec l'acheteur.

## Architecture

On remplace `OrganizerDrawer.jsx` par un fichier `OrganizerTabs.jsx` qui contient un `createBottomTabNavigator` avec 4 stacks imbriquées.

```
BottomTabNavigator (OrganizerTabs)
├── AccueilStack (headerShown: false)
│   └── Dashboard → OrganisateurDashboardScreen
├── EvenementsStack (headerShown: false)
│   ├── Evenements  → GestionEvenementsScreen (header: "Mes événements")
│   ├── DetailEvenement → DetailEvenementScreen (header: "Détails")
│   ├── VoirTickets → VoirTicketsScreen (header: "Billets")
│   └── Statistiques → StatistiquesScreen (header: "Statistiques")
├── DemandesStack (headerShown: false)
│   └── Demandes → MesDemandesScreen (header: "Demandes")
└── ProfilStack (headerShown: false)
    ├── Profil      → ParametresScreen (header: "Paramètres")
    ├── Notifications → NotificationsScreen (header: "Notifications")
    ├── Support     → SupportScreen (header: "Support")
    └── ChangerMotDePasse → ChangerMotDePasseScreen (header hidden)
```

## Onglets (Approche B validée)

| Onglet | Icône | Écran racine |
|--------|-------|-------------|
| Accueil | `Feather home` | OrganisateurDashboardScreen |
| Événements | `MaterialCommunityIcons calendar-month` | GestionEvenementsScreen |
| Demandes | `MaterialCommunityIcons file-document-outline` | MesDemandesScreen |
| Profil | `Feather user` | ParametresScreen |

## Style de la tab bar

- Même design que `MainTabs` de l'acheteur : fond `colors.surface`, bordure `colors.border`, hauteur 56px
- `tabBarActiveTintColor: colors.navActive`
- `tabBarInactiveTintColor: colors.navInactive`
- Label style: `fonts.jakarta.semiBold`, 10px
- Icônes: 20-21px

## Changements concrets

1. **Nouveau fichier** `mobile/src/navigation/OrganizerTabs.jsx` — contient le tab navigator + les 4 stacks
2. **Modification** `AppNavigator.js` ligne 168 : remplacer `OrganizerDrawer` par `OrganizerTabs`
3. **Suppression** `OrganizerDrawer.jsx` (plus utilisé)
4. **Modification** `OrganisateurDashboardScreen.jsx` — retirer la section "Navigation rapide" (remplacée par les tabs)

## Gestion des headers

- Sur les écrans racines des tabs : `headerShown: false` (le contenu occupe tout l'écran)
- Sur les sous-écrans (DetailEvenement, VoirTickets, etc.) : header visible avec titre + bouton retour, style `colors.surface` / `colors.accent` / `fonts.outfit.bold 18px`
- `ChangerMotDePasseScreen` garde `headerShown: false` (plein écran)

## Dépendances

Déjà dans `package.json` : `@react-navigation/bottom-tabs` est utilisé par `MainTabs` de l'acheteur — aucune nouvelle dépendance.
