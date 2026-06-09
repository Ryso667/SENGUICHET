# Refonte UX/UI — SENGUICHET Mobile

**Date :** 09 Juin 2026
**Statut :** En révision
**Branche :** `feature/Sory`

## Résumé

Refonte complète du thème et de l'UX de l'application mobile SENGUICHET. Corrections des contrastes, nouvelle palette Warm Charcoal avec accent or/champagne, 3e version du billet (style physique blanc/crème), et micro-interactions premium.

---

## 1. Palette de couleurs — Warm Charcoal

### 1.1 Couleurs de base

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg` | `#1A1A1E` | Fond principal |
| `bgSecondary` | `#232329` | Fond alternatif (listes) |
| `surface` | `#2C2C30` | Cartes / verres |
| `surfaceLight` | `rgba(255,255,255,0.08)` | Fond verre glass |
| `text` | `#FFFFFF` | Texte principal |
| `textSecondary` | `#B0B0B8` | Texte secondaire |
| `textTertiary` | `#8A8A92` | Métadonnées |
| `accent` | `#D4A574` | CTA, badges, icônes actives |
| `accentLight` | `#E6C99A` | Version claire accent |
| `green` | `#6CD4A0` | Succès / valide |
| `red` | `#E86868` | Erreur / refus |
| `orange` | `#E8A868` | Attention / en attente |
| `violet` | `#A78BFA` | Accent secondaire |
| `inputBg` | `rgba(255,255,255,0.06)` | Fond inputs |
| `inputBorder` | `rgba(255,255,255,0.12)` | Bordure inputs |
| `inputBorderFocus` | `#D4A574` | Bordure focus |
| `placeholder` | `rgba(255,255,255,0.45)` | Placeholder |

### 1.2 Verres glass

- `glass.bg` : `rgba(255,255,255,0.08)` — reflection réduite
- `glass.darkBg` : `rgba(0,0,0,0.25)`
- `glass.border` : `rgba(255,255,255,0.12)`

### 1.3 Dégradés

- `primary` : `['#D4A574', '#C8945C']`
- `success` : `['#6CD4A0', '#5ABF8C']`
- `error` : `['#E86868', '#D45555']`

### 1.4 Effets supprimés

- `textShadow` lourd sur TOUT le texte → conservé UNIQUEMENT sur texte superposé à image
- Les ombres portées dans verres sont réduites

---

## 2. TicketScreen — Billet physique blanc/crème

Style troisième version : billet physique moderne inspiré Ticketmaster.

### Structure visuelle

- **Fond** : `#F5F2ED` (crème chaud)
- **En-tête** : bande `#D4A574` avec logo app + "Billet électronique"
- **Infos événement** : Titre 28px Outfit Bold `#1A1A1E`, date 16px `#5A5A60` avec icône calendrier, lieu 16px `#5A5A60` avec icône épingle, badge catégorie `#D4A574` sur fond crème
- **QR Code** : 200px, noir sur blanc, cadre `#E8E4DC`
- **Ligne de coupe** : pointillés horizontaux + ciseaux aux extrémités
- **Talon** : fond `#EDE8E0`, référence monospace `#8A8A8A`, prix 22px Outfit Bold `#D4A574`, mentions légales 10px `#A0A098`
- **Bouton PDF** : bordure or `#D4A574` sur fond blanc

### États

- **Utilisé** : Griffe diagonale verte `#6CD4A0` semi-transparente
- **Expiré** : Griffe diagonale rouge `#E86868`
- **Animation** : Entrée en fondu avec léger scale (printemps)

---

## 3. MesTicketsScreen — Carte dans la liste

- **Carte** : `#2C2C30`, coins 16px, bordure `rgba(255,255,255,0.08)`
- **Bande statut gauche** : 4px large, couleur selon statut
- **Ligne 1** : Nom événement — `#FFFFFF` 17px Outfit SemiBold
- **Ligne 2** : Date — `#B0B0B8` 14px avec icône calendrier
- **Ligne 3** : Lieu — `#B0B0B8` 13px
- **Badge statut** : coin supérieur droit
- **Mini QR** : 40px coin inférieur droit
- **Pull-to-refresh** : indicateur or personnalisé

---

## 4. Composants modifiés

### GlassContainer
- `glass.bg` passe de `rgba(255,255,255,0.2)` à `rgba(255,255,255,0.08)`
- Variante `"surface"` = fond `#2C2C30`
- Suppression `textShadow` automatique

### BoutonPrincipal / GlassButton
- Dégradé : `['#D4A574', '#C8945C']`
- Outline : bordure `#D4A574`, texte `#D4A574`
- Texte sur filled : `#FFFFFF`
- Animation : scale 0.96 + haptic

### StatusBadge
- ACTIF → `#D4A574` (or)
- EN_ATTENTE → `#E8A868`
- VALIDE → `#6CD4A0`
- TERMINE → `#8A8A92`
- ANNULE → `#E86868`

### Inputs (OTP, Tel, Text, Password, Masked)
- Label flottant animé (placeholder → petite étiquette en haut au focus)
- Icône gauche (email, lock, user, phone)
- Bordure : `rgba(255,255,255,0.12)` → `#D4A574` au focus
- Animation d'erreur : shake horizontal + bordure rouge
- Haptic sur erreur (notification feedback)

### GlassChip
- Inactif : fond `rgba(255,255,255,0.06)`, texte `#B0B0B8`
- Actif : fond `#D4A574`, texte `#1A1A1E`

### GlassBottomNav
- Fond : `rgba(44,44,48,0.85)` + blur
- Active : `#D4A574`
- Inactive : `#8A8A92`

---

## 5. Micro-interactions premium (UX)

### 5.1 Haptic feedback (expo-haptics)

| Action | Type Haptic |
|--------|-------------|
| Press bouton principal | `ImpactFeedbackStyle.Medium` |
| Press bouton secondaire | `ImpactFeedbackStyle.Light` |
| Erreur formulaire | `NotificationFeedbackStyle.Error` |
| Validation / succès | `NotificationFeedbackStyle.Success` |
| Scan QR valide | `NotificationFeedbackStyle.Success` |
| Scan QR invalide | `NotificationFeedbackStyle.Error` |
| Changement tab | `ImpactFeedbackStyle.Light` |
| Saisie OTP | `ImpactFeedbackStyle.Light` |
| Pull-to-refresh déclenché | `ImpactFeedbackStyle.Medium` |

### 5.2 Gestion clavier

- **Chaque écran avec input** : `KeyboardAvoidingView` + `ScrollView`
- **Dismiss clavier** sur tap hors champ (toute la zone)
- **Return key type** : "next" pour champs intermédiaires, "done" pour dernier
- **Auto-focus** : passage au champ suivant avec focus ref
- **Scroll auto** vers champ actif quand clavier ouvert

### 5.3 Transitions d'écran

- `cardStyleInterpolator` personnalisé pour chaque pile
- Slide horizontal pour navigation stack
- Fade pour modaux

### 5.4 Animations

- **Boutons** : scale 0.96 + rebond au relâchement
- **Cartes** : entrée en séquence (stagger 80ms)
- **Tickets liste** : fondu + slide-up
- **Billets détail** : scale + fondu depuis le QR
- **Scanner** : cadre qui pulse doucement, flash de couleur sur résultat
- **Erreur input** : shake horizontal (200ms)
- **Toasts** : slide depuis le haut, disparition auto

### 5.5 Formulaires — UX avancée

- **Validation temps réel** : message d'erreur sous chaque champ dès la perte de focus (pas seulement au submit)
- **Bouton submit désactivé** tant que formulaire invalide + tooltip "Remplissez tous les champs"
- **Champs OTP** : auto-focus séquentiel, haptic par chiffre, effacement individuel, validation dès le 4e/6e chiffre
- **Mot de passe** : œil toggle + validation temps réel (8+ caractères, maj, chiffre)

### 5.6 Écrans de chargement

- Skeleton shimmer améliorés : animation de vague continue
- Transition skeleton → contenu : fondu progressif
- Chargement différé : squelette immédiat, contenu dès que prêt

### 5.7 Empty states

- Icône grande et centrée (50% opacité)
- Titre `#FFFFFF` 18px
- Sous-titre `#B0B0B8` 14px
- CTA visible en bas de l'écran

---

## 6. Axe organisateur & contrôleur

- `OrganisateurLayout` / `ControleurLayout` : fond `#1A1A1E` (retrait de l'indigo)
- `ScannerScreen` : cadre or `#D4A574` au lieu de cyan
- Résultat scan : vert doux `#6CD4A0` / rouge doux `#E86868`
- `StatCard` : bordure gauche `#D4A574`
- Graphiques : légendes en `#B0B0B8`, couleurs mises à jour

---

## 7. Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `mobile/src/constants/theme.js` | Nouvelle palette + verres + dégradés |
| `mobile/src/components/GlassContainer.jsx` | Nouvelle opacité verre, variante surface |
| `mobile/src/components/GlassButton.jsx` | Nouvelle couleur, haptic |
| `mobile/src/components/BoutonPrincipal.jsx` | Nouveau dégradé, haptic |
| `mobile/src/components/StatusBadge.jsx` | Nouvelles couleurs |
| `mobile/src/components/GlassChip.jsx` | Nouvelles couleurs |
| `mobile/src/components/GlassBottomNav.jsx` | Nouvelles couleurs |
| `mobile/src/components/InputOTP.jsx` | Haptic, auto-focus, validation |
| `mobile/src/components/InputTel.jsx` | Label flottant, icône, haptic |
| `mobile/src/components/MaskedInput.jsx` | Label flottant, bordure focus |
| `mobile/src/screens/TicketScreen.js` | Nouveau design physique crème |
| `mobile/src/screens/MesTicketsScreen.jsx` | Nouvelles cartes + indicateur refresh |
| `mobile/src/screens/AccueilChoixScreen.jsx` | Couleurs mises à jour |
| `mobile/src/screens/auth/SocialAuthScreen.jsx` | Input + clavier + haptic |
| `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx` | Label flottant + clavier |
| `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx` | Label flottant + validation |
| `mobile/src/screens/auth/ConnexionControleurScreen.jsx` | Nouveau style + haptic |
| `mobile/src/screens/organisateur/*.jsx` | Couleurs mises à jour |
| `mobile/src/screens/controleur/ScannerScreen.jsx` | Cadre or, haptic, flash |
| `mobile/src/navigation/AppNavigator.js` | Nouvelles transitions |
| `mobile/src/components/BuyerLayout.jsx` | Nouveau fond |
| `mobile/src/components/OrganisateurLayout.jsx` | Fond #1A1A1E |
| `mobile/src/components/ControleurLayout.jsx` | Fond #1A1A1E |

---

## 8. Non couvert (hors scope)

- Ajout de nouvelles bibliothèques (expo-haptics sera ajouté)
- Refonte du backend
- Traduction / i18n
- Mode clair
