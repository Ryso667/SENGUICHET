# EventDetailScreen — Redesign approche A (Clean minimal)

## Problèmes identifiés
- Glass trop flou et lourd (`intensity={70}` sur fond sombre)
- Modal de paiement avec fond dégradé plein écran écrasant
- Champ téléphone dans la page principale, peu visible, gênant avec le clavier
- Hero section utilise un thème bleu (#2563EB) incompatible avec le terracotta de l'app (#C7513A)

## Changements

### 1. Hero section — alignement couleurs app
- `heroCategory` : `#06B6D4` → `colors.accent` (#C7513A)
- `heroDivider` : `#2563EB` → `colors.accent`
- `heroIconBadge` bg : `hexToRgba('#2563EB', 0.15)` → `hexToRgba(colors.accent, 0.15)`
- Titre `MaskedView` gradient : `['#2563EB', '#06B6D4']` → `['#C7513A', '#D4835A']` (accent → orange clair)
- Bouton Acheter gradient : `['#2563EB', '#06B6D4']` → `['#C7513A', '#B84530']` (dégradé primary du theme)
- Checkmark sheet : `#2563EB` → `colors.accent`
- Sheet item selected : `rgba(37,99,235,0.2)` / `#2563EB` → `hexToRgba(colors.accent, 0.2)` / `colors.accent`
- PayAmountCard borderColor : `hexToRgba('#2563EB', 0.27)` → `hexToRgba(colors.accent, 0.27)`
- PayAmountValue : `#1AB3E5` → `colors.textWhite` (le prix en blanc, pas en bleu)

### 2. Glass plus léger
- Tous les `GlassContainer` de la page passent de `intensity={70}` à `intensity={30}`
- Le flou est réduit, le fond par catégorie reste visible, rendu plus aéré
- Le `BlurView` de la `bottomBar` garde `intensity={90}` (nécessaire pour lisibilité du CTA)

### 3. Champ téléphone déplacé dans le modal
- Supprimé de la page principale : `formLabel`, `formPhoneRow`, `formCodeText`, `formPhoneInput`, icône smartphone
- Ajouté dans le modal de paiement, entre le montant et le bouton Wave
- Design : grand label "Ton téléphone" + input dans une carte glass avec fond légèrement plus opaque
- `KeyboardAvoidingView` déjà présent, on ajuste le `keyboardVerticalOffset`

### 4. Modal de paiement — overlay simple
- `LinearGradient` plein écran supprimé du modal
- Remplacé par `rgba(0,0,0,0.6)` simple overlay
- La carte glass garde son style mais avec `intensity={30}`

## Fichiers modifiés
- `mobile/src/screens/EventDetailScreen.js`

## Non-modifié (hors scope)
- Composants partagés (`GlassContainer`, `BlurBackground`, `GlassBottomNav`)
- Autres écrans
- Logique métier (achat, API, stockage local)
