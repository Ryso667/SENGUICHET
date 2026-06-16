# Refonte UI — Thème clair & Navigation (v2, mobile)

**Date** : 16 juin 2026
**Contexte** : Décisions issues du brainstorming du 16/06 — précisions sur la navigation 4 tabs, l'accès contrôleur, et le flow acheteur
**Base** : V1 spec `2026-06-15-refonte-ui-claire-design.md`

---

## 1. Principe général

- Thème clair uniquement (suppression du dark theme bleu nuit)
- Fond blanc `#FFFFFF` / gris clair `#F9FAFB`
- Arrivée directe sur la liste des événements (pas de AccueilChoixScreen hero)
- Bottom navigation bar 4 onglets

---

## 2. Palette de couleurs

| Rôle | Hex | Usage |
|------|-----|-------|
| Fond principal | `#FFFFFF` | Toutes les screens |
| Fond secondaire | `#F9FAFB` | Cards, sections alternées |
| Primaire (accent) | `#1A56DB` | CTA, icônes actives, liens |
| Primaire clair | `#EFF6FF` | Badges, tags, chips inactifs |
| Texte principal | `#111827` | Titres, corps de texte |
| Texte secondaire | `#6B7280` | Dates, métadonnées, sous-titres |
| Texte tertiaire | `#9CA3AF` | Placeholders, icônes inactives |
| Bordures / Dividers | `#E5E7EB` | Séparateurs, contours de cards |
| Succès / Gratuit | `#10B981` | Badge "Gratuit", confirmations |
| Payant / Prix | `#F97316` | Badge "Payant", prix |

`colors.textWhite` et `colors.textWhiteMuted` sont supprimés du thème (remplacés par `colors.text`, `colors.textSecondary`, `colors.textTertiary`).

---

## 3. Navigation (4 tabs)

```
NavigationContainer
└── AcheteurTabs (toujours affiché, rôle modifie le contenu des tabs)
    ├── Accueil → HomeScreen (refonte claire)
    ├── Explorer → EventSearchScreen
    ├── Mes billets → MesTicketsScreen
    └── Compte → ProfilScreen
```

- **Par défaut** : l'app s'ouvre sur Accueil (rôle acheteur implicite)
- **Accès organisateur** : lien dans l'onglet Compte → ConnexionOrganisateurScreen
- **Accès contrôleur** : lien dans l'onglet Compte → ConnexionControleurScreen
- **Scan contrôleur** : accessible uniquement depuis l'onglet Compte (pas de tab dédiée)
- **Onglets** : icône + label, actif = `#1A56DB`, inactif = `#9CA3AF`
- Bottom bar : fond blanc, bordure supérieure `#E5E7EB`
- Arrivée directe sur un événement (QR, lien, notification) : modale/sheet empilée par-dessus les tabs

---

## 4. Flow acheteur

- **Invité** : peut parcourir, rechercher, voir les événements et acheter sans compte
- **Compte** (optionnel) : OTP email, permet de retrouver l'historique
- Inscription rapide : email → OTP → connecté
- Pas de mot de passe pour l'acheteur

---

## 5. HomeScreen (Task 3)

- Header blanc avec logo + icône compte/déconnexion
- Barre de recherche arrondie (placeholder "Rechercher un événement...")
- Filtres par catégorie : chips horizontaux scrollables (blancs ou gris, actif = `#1A56DB`)
- **Carousel "À la une" conservé** (inchangé, mêmes animations)
- Grille/liste "Tous les événements" en cards blanches avec ombre
- Fond blanc, pas de BlurBackground

---

## 6. Adaptations par écran

### Auth screens (ConnexionControleur, ConnexionOrganisateur, InscriptionOrganisateur, EnAttenteValidation, SocialAuth)
- Fond blanc, suppression de BlurBackground
- Cards : fond `#FFFFFF` + ombre légère (au lieu de GlassContainer)
- Texte : `colors.text` (#111827) — inverser les #FFFFFF qu'on avait mis

### Organsateur screens (Dashboard, DetailEvenement, VoirTickets, CreerEvenement, Support, Notifications, GestionEquipe, ChangerMotDePasse)
- Fond blanc, suppression de OrganisateurLayout
- Cards : fond `#FFFFFF` + ombre
- Texte : `colors.text` / `colors.textSecondary`
- Back buttons conservés (cercle `rgba(0,0,0,0.04)` + icône #111827)

### Contrôleur screens (Dashboard, Scan)
- Fond blanc
- ScanDashboard : intégrer le QR scanner sur fond blanc

### EventDetail / Ticket
- Fond blanc, photo large en haut
- Prix et infos : cards blanches avec ombre
- **TicketScreen** : forme visuelle conservée, couleurs adaptées au fond blanc
- Paiement Wave/Orange : modal blanc

### MesTicketsScreen
- Fond blanc, suppression du BlurBackground gradient
- Cartes tickets en blanc avec ombre et bande latérale colorée (comme actuellement mais en blanc)

---

## 7. Ce qui est supprimé / modifié

| Élément | Action |
|---------|--------|
| `AccueilChoixScreen` comme écran d'entrée | **Supprimé** |
| `BlurBackground` sur tous les écrans | **Supprimé** (fond blanc partout) |
| `OrganisateurLayout` | **Supprimé** |
| `colors.textWhite` / `colors.textWhiteMuted` | **Supprimés** du thème |
| `colors.bg = #0A1628` | Devient `#FFFFFF` |
| Textes blancs (#FFFFFF) sur fonds sombres | Inversés : `colors.text` (#111827) |
| GlassContainer flouté | Remplace par card blanche + ombre |
| Tab bar cachée (`tabBar={() => null}`) | Remplacé par bottom nav 4 onglets |
| Carousel animations HomeScreen | **Conservé** |
| Forme visuelle du ticket | **Conservée** (couleurs adaptées) |
| Flow organisateur (inscription → admin → login) | **Inchangé** |

---

## 8. Priorité d'implémentation

1. **CRITIQUE** — Réécrire `theme.js` (palette claire, suppression tokens sombres)
2. **CRITIQUE** — Refondre `AppNavigator.js` (4 tabs, suppression stacks séparées)
3. **HAUTE** — Refondre `HomeScreen` (header blanc, recherche, catégories, conserver carousel)
4. **HAUTE** — Adapter les écrans d'auth au thème clair
5. **NORMALE** — Adapter les écrans organisateur/contrôleur
6. **NORMALE** — Adapter EventDetail, Ticket, MesTickets

---

## 9. Notes techniques

- **theme.js** : garder la structure existante, remplacer les valeurs
- **AppNavigator.js** : créer `AcheteurTabs` avec 4 écrans, rendre par défaut
- **Icônes** : `@expo/vector-icons` (Ionicons/Feather) pour les tabs
- **Fonts** : Outfit (titres) + Plus Jakarta Sans (corps) — inchangé
- **Back buttons** : pattern cercle 36×36, `rgba(0,0,0,0.04)`, icône feather arrow-left en `colors.text`
