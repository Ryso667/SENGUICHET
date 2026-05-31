# Migration emoji → icônes vectorielles

**Date :** 31 Mai 2026  
**Contexte :** Rendu incohérent des emoji entre iOS/Android, taille/couleur non contrôlable.

## Solution

`@expo/vector-icons` (MaterialCommunityIcons + Feather) remplace les 58 emoji.

## Fichiers modifiés

| Fichier | Emoji remplacés | Icône utilisée |
|---|---|---|
| `config/images.js` | 🎶 🎪 🎭 ⚽ 🎤 🔧 🖼️ ✨ 💃 📅 | `guitar-acoustic`, `tent`, `theater`, `soccer`, `microphone`, `wrench`, `image-frame`, `star`, `dance-ballroom`, `calendar` |
| `screens/AccueilChoixScreen.jsx` | 🎟️ 📸 🎪 🎫 ✅ | Logo `Image` + `ticket-outline`, `qrcode-scan`, `calendar-star` |
| `navigation/AppNavigator.js` | 📷 📋 | `qrcode-scan`, `clipboard-text-outline` |
| `screens/organisateur/OrganisateurDashboardScreen.jsx` | 📅 🎟️ 💰 👥 ➕ 📊 ⚙️ 👋 🎪 | `calendar-check`, `ticket-outline`, `cash`, `account-group`, `plus-circle-outline`, `chart-box-outline`, `cog-outline`, `calendar-star` |
| `screens/organisateur/StatistiquesScreen.jsx` | 🎟️ 💰 📊 🎪 | `ticket-outline`, `cash`, `chart-donut`, `calendar-star` |
| `screens/controleur/ScannerScreen.jsx` | ✅ 🟠 🔴 🔴 🚨 | `check-circle`/`alert-circle`/`clock-outline`/`help-circle`/`alert-octagon` |
| `screens/controleur/ScanHistoryScreen.jsx` | 📋 | `clipboard` |
| `screens/MesTicketsScreen.jsx` | 🎫 🗑️ | `ticket`, `trash-2` |
| `screens/organisateur/GestionEvenementsScreen.jsx` | 🎪 | `tent` |
| `screens/auth/EnAttenteValidationScreen.jsx` | ✅ | `check-circle` |
| `screens/HomeScreen.js` | 🎫 | `ticket` |
| `screens/EventDetailScreen.jsx` | 🎫 dans Alert | Titre propre |
| `screens/organisateur/CreerEvenementScreen.jsx` | ✅ dans Alert | Titre propre |
| `components/EventCard.js` | emoji catégorie | `getCategoryIconName()` |
| `components/EmptyState.jsx` | string seulement | `ReactNode` ou `string` |

## API publique

```js
// config/images.js
getCategoryIconName(category) → string  // nom MaterialCommunityIcons
getCategoryDefault(category) → { emoji, color, icon }
```

`EmptyState` prop `icon` accepte désormais `ReactNode` :
```jsx
<EmptyState icon={<MaterialCommunityIcons name="tent" size={64} color="#CBD5E1" />} />
```

## Build

`npx expo export --platform web` → 997 modules, OK.
