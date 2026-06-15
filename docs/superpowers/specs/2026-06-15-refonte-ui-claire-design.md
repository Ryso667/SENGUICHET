# Refonte UI — Thème clair & Navigation événements

**Date** : 15 juin 2026
**Contexte** : Brief client (PDF dans `.superworks/SENGUICHET_UI_Refonte_Prompt.pdf`)
**Références approuvées** : event.diotali.com, gnudem.com
**Équipes concernées** : Mobile (React Native / Expo) + Web (frontend-web/)

---

## 1. Principe général

- Supprimer le dark theme bleu nuit actuel
- Arrivée directe sur la liste des événements (pas de hero/landing)
- Fond blanc / gris très clair, couleurs douces
- Navigation bottom bar 4 onglets

---

## 2. Palette de couleurs (partagée mobile + web)

| Rôle | Hex | Usage |
|------|-----|-------|
| Fond principal | `#FFFFFF` | Toutes les screens |
| Fond secondaire | `#F9FAFB` | Cards, sections alternées |
| Primaire (accent) | `#1A56DB` | CTA, icônes actives, liens |
| Primaire clair | `#EFF6FF` | Badges, tags, hover, fonds de chips |
| Texte principal | `#111827` | Titres, corps de texte |
| Texte secondaire | `#6B7280` | Dates, métadonnées, sous-titres |
| Bordures / Dividers | `#E5E7EB` | Séparateurs, contours de cards |
| Succès / Gratuit | `#10B981` | Badge "Gratuit", confirmations |
| Payant / Prix | `#F97316` | Badge "Payant", prix |
| Inactif (icônes) | `#9CA3AF` | Icônes de la bottom nav non actives |

---

## 3. Header (partagé mobile + web)

- **Fond** : `#FFFFFF` + ombre légère (elevation 2 / shadowOpacity 0.05)
- **Hauteur** : 56–60px
- **Gauche** : Logo PNG transparent + nom "SEN" noir / "GUICHET" en `#1A56DB`
- **Droite** : Icône utilisateur (person) + lien "Contact"
- Le logo actuel avec fond coloré est remplacé par une version PNG transparente

---

## 4. Barre de navigation bottom (mobile) / Nav desktop (web)

### Mobile — Bottom Navigation Bar
- 4 onglets exactement comme Gnudem :
  1. **Accueil** (icône maison)
  2. **Recherche** (icône loupe)
  3. **Notifications** (icône cloche)
  4. **Compte** (icône personne)
- Fond blanc, bordure fine `#E5E7EB` en haut
- Onglet actif : icône en `#1A56DB`
- Onglet inactif : icône en `#9CA3AF`
- Label en dessous de chaque icône (10–11px, `#6B7280` si inactif, `#1A56DB` si actif)

### Web — Navigation Header
- Navigation horizontale en haut (inspirée Gnudem desktop) :
  - Logo à gauche
  - Liens : Accueil | Recherche | Notifications | Compte
  - Icône paramètres à droite

---

## 5. Structure de l'écran d'accueil (HomeScreen)

Ordre du haut vers le bas :

1. **Header** (fixe, 56px)
2. **Barre de recherche** : input arrondi (border-radius: 24px), placeholder "Rechercher un événement...", fond `#F3F4F6`, icône loupe
3. **Filtres par catégorie** : chips horizontaux scrollables (Concerts, Sport, Conférences, Festival…)
   - Chip actif : fond `#1A56DB` + texte blanc
   - Chip inactif : fond `#F3F4F6` + texte `#374151`
4. **Section "Événements à la une"** : EventCarousel horizontal (conservé tel quel, ne pas modifier)
5. **Section "Tous les événements"** : liste verticale de cards avec infinite scroll
6. **Bottom Navigation Bar** (fixe, en bas)

---

## 6. Structure d'une EventCard

```
┌──────────────────────────────────┐
│ ┌───────┐                        │
│ │ Image │  badge Gratuit/Payant  │
│ │       │  date (coin)           │
│ └───────┘                        │
│ Titre de l'événement             │
│ 📍 Lieu · 🕐 Date                │
│ [Payant 10 000F] ou [Gratuit]   │
└──────────────────────────────────┘
```

- **Coins arrondis** : borderRadius 12–16px
- **Ombre légère** : shadowOpacity 0.08, shadowRadius 8
- **Fond** : `#FFFFFF`
- **Image** : 16:9 ou adapté, couverture
- **Badge Gratuit** : fond `#D1FAE5`, texte `#10B981`
- **Badge Payant** : fond `#FFF7ED`, texte `#F97316`
- **Titre** : fontWeight 700, couleur `#111827`
- **Métadonnées** : date + lieu en `#6B7280`

---

## 7. Gestion des rôles

- **Par défaut** : l'app s'ouvre sur la liste des événements (rôle acheteur implicite)
- **Login** : accessible via l'onglet "Compte" de la bottom nav
- **Contrôleur / Organisateur** :
  - Lien discret "Espace organisateur" ou "Mode pro" dans l'onglet Compte (en bas de la page profil)
  - Redirige vers les écrans de connexion existants (ConnexionControleurScreen, ConnexionOrganisateurScreen)
- **Inscription organisateur** : bouton "Devenir organisateur" dans le profil
- Les fonctionnalités existantes (partenariat, achat tickets, OTP, etc.) ne sont PAS modifiées

---

## 8. Hiérarchie de navigation (mobile)

```
NavigationContainer
├── AuthStack (si rôle non défini → accès libre aux événements)
│   └── AcheteurTabs (affiché par défaut)
│       ├── Home (nouveau HomeScreen clair)
│       ├── Search → EventSearchScreen (refonte UI)
│       ├── Notifications → NotificationsScreen (à créer si besoin)
│       └── Account → ProfilScreen (adapté avec login + espace pro)
├── ControleurStack (rôle === 'controleur')
│   └── (inchangé, sauf thème clair)
└── OrganisateurStack (rôle === 'organisateur')
    └── (inchangé, sauf thème clair)
```

Les écrans de connexion (SocialAuth, ConnexionControleur, ConnexionOrganisateur, etc.) sont accessibles depuis l'onglet Compte. Leur UI est adaptée au thème clair mais leur logique reste inchangée.

---

## 9. Ce qui est supprimé / modifié

| Élément | Action |
|---------|--------|
| Hero section sombre (AccueilChoixScreen) | **Supprimé** comme écran d'entrée |
| Bouton "Devenir partenaire" en plein écran | Déplacé dans le profil |
| Bouton "Se connecter" géant | Déplacé dans le header / onglet Compte |
| Liens App Store / Play Store | **Supprimés** (app mobile) |
| Fond sombre `#0A1628` | Remplacé par `#FFFFFF` / `#F9FAFB` |
| Textes blancs sur fond sombre | Adaptés au thème clair |
| tabBar={() => null} (cache bottom nav) | Remplacé par bottom nav 4 onglets |
| Ancien header avec fond coloré | Remplacé par header blanc + logo transparent |

---

## 10. Ordre de priorité d'implémentation

1. **CRITIQUE** — Changer le thème global (dark → light). Modifier `theme.js` et tous les styles globaux
2. **CRITIQUE** — Refondre le HomeScreen (supprimer hero, afficher événements + header propre + bottom nav)
3. **HAUTE** — Nouveau header (logo PNG transparent, icône compte + Contact)
4. **HAUTE** — Bottom Navigation Bar (4 onglets avec icônes SVG)
5. **NORMALE** — EventCards stylisées (coins arrondis, ombre, badges colorés)
6. **NORMALE** — Barre de recherche + filtres par catégorie

---

## 11. Notes techniques (mobile)

- **Fichier theme.js** : remplacer les couleurs sombres par la palette ci-dessus, garder la structure existante
- **Navigation** : modifier `AppNavigator.js` — le AcheteurTabs devient l'écran par défaut, ajouter vraie bottom tab bar avec 4 onglets
- **Icônes** : utiliser `@expo/vector-icons` (Ionicons ou MaterialIcons) pour les 4 icônes de la bottom nav, ou SVG inline comme Gnudem
- **Fonts** : garder Outfit (titres) + Plus Jakarta Sans (corps)
- **Logos** : remplacer le logo existant par version PNG transparente dans `assets/`

---

## 12. Notes techniques (web)

- Appliquer la même palette de couleurs dans `frontend-web/`
- Header commun avec le mobile (logo + Contact)
- Navigation : remplacer/simplifier la nav existante pour coller au modèle Gnudem desktop
- EventCards : utiliser les mêmes specs visuelles (mêmes classes CSS si Tailwind, ou composant partagé depuis `shared/`)
