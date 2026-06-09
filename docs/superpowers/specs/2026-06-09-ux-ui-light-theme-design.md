# Design UI/UX — Thème Clair (Juin 2026)

**Palette : Warm Light** — fond beige chaud, verre translucide, accent terracotta.

## Palette de couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg` | `#F5F0EB` | Fond principal — beige chaud clair |
| `bgSecondary` | `#EBE5DE` | Fond secondaire |
| `surface` | `#FFFFFF` | Cartes pleines |
| `text` | `#1A1A1E` | Texte principal — quasi noir |
| `textSecondary` | `#6B6560` | Texte secondaire — brun-gris doux |
| `textTertiary` | `#9C9590` | Texte tertiaire / placeholders |
| `accent` | `#C7513A` | Accent principal — terracotta (boutons, liens, active) |
| `accentLight` | `#F0DED8` | Fond d'éléments accent (badges, chips actifs) |
| `green` | `#2E7D5E` | Succès / VALIDE |
| `red` | `#C73A3A` | Erreur / REFUSÉ |
| `orange` | `#D4835A` | Attention / EN_ATTENTE |
| `violet` | `#7C6FA0` | Accent acheteur (soft) |
| `inputBg` | `#FFFFFF` | Fond input |
| `inputBorder` | `#D4CEC8` | Bordure input |
| `inputBorderFocus` | `#C7513A` | Bordure focus input |

### Glass

| Token | Valeur |
|-------|--------|
| `glass.bg` | `rgba(255,255,255,0.5)` |
| `glass.darkBg` | `rgba(0,0,0,0.04)` |
| `glass.border` | `rgba(255,255,255,0.6)` |

### Dégradés

- **primary** : `['#C7513A', '#B84530']`
- **success** : `['#2E7D5E', '#3A8F6E']`
- **error** : `['#C73A3A', '#D45050']`

### Ombres

Suppression de `textShadow` (plus nécessaire sur fond clair).
Ombre carte : `rgba(0,0,0,0.06)` offset (0,2) radius 8.

---

## Composants

### GlassContainer
- `variant="glass"` (défaut) : fond `rgba(255,255,255,0.5)`, bordure `rgba(255,255,255,0.6)`, blur 20px, ombre légère
- `variant="surface"` : fond blanc `#FFFFFF`, pas de blur

### GlassButton
- Fond `rgba(255,255,255,0.4)`, texte `#1A1A1E`
- Haptic light sur press
- Au press : ombre renforcée

### BoutonPrincipal
- Dégradé `primary` (terracotta), texte blanc
- Haptic medium sur press
- `disabled` / `desactive` : opacité 0.5

### GlassChip
- Inactif : fond `rgba(0,0,0,0.04)`, texte `#6B6560`, bordure `rgba(0,0,0,0.08)`
- Actif : fond `#C7513A`, texte blanc

### GlassBottomNav
- Fond `rgba(255,255,255,0.6)` + blur
- Actif : `#C7513A`
- Inactif : `#9C9590`

### StatusBadge
- Couleurs conservées : ACTIF `#2E7D5E`, EN_ATTENTE `#D4835A`, TERMINE `#9C9590`, ANNULE `#C73A3A`

### FormInput
- Fond `#FFFFFF`, bordure `#D4CEC8`, focus `#C7513A`
- Label flottant : `#6B6560` → `#C7513A` au focus
- Icône œil / validation visuelle

---

## Écrans Acheteur

### AccueilChoixScreen
- Fond `#F5F0EB`
- 3 cartes glass avec icônes, accent terracotta
- Texte `#1A1A1E` / `#6B6560`

### HomeScreen
- Fond `#F5F0EB`
- Header glass : bienvenue + nb tickets
- EventCarousel : cartes image + overlay sombre linéaire, titre blanc
- Recent tickets : cartes glass, texte `#1A1A1E`
- CTA "Explorer" : terracotta

### EventCarousel
- Carte : image fond + overlay `rgba(0,0,0,0.2)` → `rgba(0,0,0,0.4)` linéaire
- Titre blanc 22px Bold, date/lieu blanc 14px avec ombre légère
- Badge catégorie + prix en terracotta en bas
- Carte inactive : scale 0.92, opacité 0.85

### EventDetailScreen
- Header : image héros 200px + overlay + titre blanc
- Corps sur fond `#F5F0EB`
- Cartes glass date/lieu avec icônes terracotta
- Description : `#4A4440`, 15px, line-height 1.6
- Prix : terracotta, 22px Bold
- Bouton "Acheter" fixe en bas

### TicketScreen
- Fond `#F5F0EB`, ticket blanc/crème avec ombre portée
- Même structure 5 zones (talon, perforation, corps, QR, bande prix)
- Texte `#1A1A1E` sur fond `#F5F2ED`
- QR noir sur fond blanc

### MesTicketsScreen
- Fond `#F5F0EB`
- Cartes : strip terracotta à gauche, infos `#1A1A1E`, StatusBadge
- Pull-to-refresh terracotta

---

## Écrans Auth

- Fond `#F5F0EB`
- Cartes glass centrées
- Inputs blancs, bordure `#D4CEC8`
- Bouton terracotta
- OTP : cases blanches, focus terracotta

---

## Layouts

- BuyerLayout : fond `#F5F0EB`
- OrganisateurLayout : fond `#F5F0EB` (plus de dégradé indigo)
- ControleurLayout : fond `#F5F0EB`

---

## Navigation

- TabBar : fond `rgba(255,255,255,0.7)` + blur
- Actif : `#C7513A`, inactif : `#9C9590`
- Header : fond `rgba(255,255,255,0.5)`, titre `#1A1A1E`
- Animation : slide_from_right, 250ms
- Haptic sur changement de tab
