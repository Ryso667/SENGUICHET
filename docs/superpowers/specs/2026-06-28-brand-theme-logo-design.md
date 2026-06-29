# Thème SENGUICHET — Adaptation palette Logo Design

## Contexte

Le logo `mobile/assets/logo_design.jpeg` a été analysé. Ses couleurs dominantes sont :
- **Blanc** `#FFFFFF` — fond
- **Bleu nuit** `#0A1026` — texte / forme principale
- **Gris clair** `#EEEEF0` — accents secondaires

Le vert (`#10B981`) est défini comme **troisième couleur** de la marque.

## Décisions

| Question | Réponse |
|----------|---------|
| Rôle du vert | CTA **et** badges/statuts |
| Fond mode sombre | Bleu nuit `#0A1026` |
| Couleur des boutons CTA | Vert `#10B981` |
| Glassmorphisme | Conservé |

## Palette

### Mode clair

```js
bg:              '#FFFFFF'      // fond logo
bgSecondary:     '#F5F6F8'      // variante gris logo
surface:         '#FFFFFF'
card:            '#F5F6F8'
border:          '#E5E7EB'
text:            '#0A1026'      // bleu nuit logo — NOUVEAU
textSecondary:   '#6B7280'
textTertiary:    '#9CA3AF'
accent:          '#10B981'      // vert conservé pour CTA/badges
primary:         '#10B981'
primaryLight:    '#D1FAE5'
green:           '#047857'
greenLight:      '#D1FAE5'
navActive:       '#10B981'
navInactive:     '#9CA3AF'
// tout le reste inchangé
```

### Mode sombre

```js
bg:              '#0A1026'      // bleu nuit logo — NOUVEAU
bgSecondary:     '#151C36'
surface:         '#1A213B'
card:            '#1F2641'
border:          '#2A3150'
text:            '#F1F5F9'
textSecondary:   '#94A3B8'
textTertiary:    '#64748B'
accent:          '#34D399'      // vert plus lumineux pour dark
primary:         '#34D399'
primaryLight:    '#064E3B'
green:           '#34D399'
greenLight:      '#064E3B'
navActive:       '#34D399'
navInactive:     '#64748B'
// tout le reste inchangé
```

### Non modifié

- `gradients` (restent verts)
- `categoryGradients`
- `spacing`, `borderRadius`, `shadows`
- `fonts`, `animations`
- `glass` constants
- Structure générale du theme.js

## Compatibilité

Tous les composants utilisent `colors.*` via le `ThemeContext`. Aucun composant n'utilise de valeur hexadécimale en dur pour les couleurs de thème. Le changement de valeurs dans `theme.js` est suffisant — aucun code UI à modifier.

## Fichiers impactés

- `mobile/src/constants/theme.js` — valeurs `lightColors` et `darkColors`

## Risques

- Vérifier que `colors.text` en `#0A1026` sur fond `#F5F6F8` garde un bon contraste (ratio estimé ~12:1, OK)
- Vérifier que `colors.text` en `#F1F5F9` sur fond `#1A213B` en dark a assez de contraste (ratio estimé ~9:1, OK)
- Les composants qui utilisent `color: '#fff'` en dur (déjà corrigés dans la session précédente)
