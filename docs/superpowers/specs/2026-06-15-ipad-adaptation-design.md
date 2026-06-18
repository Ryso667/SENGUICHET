# iPad Adaptation — Design Spec

## Objectif
Adapter l'app mobile SENGUICHET pour iPad (Apple Review) sans casser le rendu iPhone existant.

## Approche retenue : Scaling + Adaptive Layout (Option C)

### 1. Utilitaire de scaling (`src/utils/responsive.js`)

- `scale(size)` — multiplie par `screenWidth / 375` (base iPhone 14)
- `fontScale(size)` — pareil, plafonné à 1.3× max (évite polices démesurées)
- `isPad` — `Platform.isPad` (iOS) + détection tablette Android

### 2. Fichiers à adapter (ordre prioritaire)

| Fichier | Adaptation |
|---|---|
| `TicketScreen.js` | `maxWidth: 340` → `scale(340)`, polices → `fontScale()`, paddings → `scale()` |
| `AccueilChoixScreen.jsx` | 3 cartes en colonne → 3 cartes en ligne si `isPad` |
| `EventDetailScreen.js` | hero 42px → `fontScale(42)`, layout large |
| `ScannerScreen.jsx` | scan frame 250 → `scale(250)` |
| `EventCarousel.jsx` | `CARD_HEIGHT: 400` → `scale(400)` |
| `FloatingTabBar.jsx` / `GlassBottomNav.jsx` | icônes → `scale()` |
| `app.json` | `orientation: "portrait"` → `"default"` |

### 3. Rollout progressif (6 commits)

1. `responsive.js` utilitaire
2. `TicketScreen.js`
3. `AccueilChoixScreen.jsx` (layout ligne iPad)
4. `EventDetailScreen.js` + `ScannerScreen.jsx` + `EventCarousel.jsx`
5. navbars
6. `orientation: "default"` dans `app.json`

### 4. Principe

- `scale(375) ≈ 1` sur iPhone standard → 0 risque de régression
- Les `isPad` blocks sont isolés et ne touchent pas au rendu iPhone
- Chaque commit est déployable indépendamment
