# Thème Clair UI/UX — Plan d'Implémentation

> **Pour agents :** REQUIRED SUB-SKILL: Utiliser `subagent-driven-development` (recommandé) ou `executing-plans`. Chaque tâche utilise des cases `- [ ]`.

**Objectif :** Migrer toute l'app du thème sombre Warm Charcoal vers un thème clair Warm Light (fond beige chaud `#F5F0EB`, accent terracotta `#C7513A`, glass translucide sur fond clair), avec amélioration ciblée de la lisibilité du carousel et de la page détail événement.

**Architecture :** Mise à jour centralisée de `theme.js` (palette), puis cascade dans les composants partagés (glass/chips/boutons/formulaires), puis écrans (acheteur/auth/layouts/navigation). Chaque tâche est un fichier ou un groupe logique de fichiers.

**Tech Stack :** React Native, Expo SDK 54, expo-blur, expo-linear-gradient, @expo/vector-icons

---

### File Structure

| Fichier | Responsabilité |
|---------|---------------|
| `mobile/src/constants/theme.js` | Palette centrale Warm Light |
| `mobile/src/components/GlassContainer.jsx` | Glass adapté au fond clair |
| `mobile/src/components/GlassButton.jsx` | Bouton glass clair |
| `mobile/src/components/BoutonPrincipal.jsx` | Dégradé terracotta |
| `mobile/src/components/GlassChip.jsx` | Chip clair |
| `mobile/src/components/GlassBottomNav.jsx` | Nav claire |
| `mobile/src/components/StatusBadge.jsx` | Màj couleurs |
| `mobile/src/components/FormInput.jsx` | Input clair |
| `mobile/src/components/AnimatedEventCard.jsx` | Overlay carousel renforcé |
| `mobile/src/screens/HomeScreen.jsx` | Fond clair + glass |
| `mobile/src/screens/EventSearchScreen.jsx` | Fond clair |
| `mobile/src/screens/EventDetailScreen.js` | Contenu clair + glass |
| `mobile/src/screens/TicketScreen.js` | Fond clair + ombre |
| `mobile/src/screens/MesTicketsScreen.jsx` | Fond clair |
| `mobile/src/screens/SupportScreen.jsx` | Fond clair |
| `mobile/src/screens/ProfilScreen.jsx` | Fond clair |
| `mobile/src/screens/AccueilChoixScreen.jsx` | Fond clair + terracotta |
| `mobile/src/screens/auth/*.jsx` (4) | Fond clair |
| `mobile/src/screens/controleur/ScannerScreen.jsx` | Fond clair |
| `mobile/src/components/BuyerLayout.jsx` | Fond clair |
| `mobile/src/components/OrganisateurLayout.jsx` | Fond clair (plus dégradé) |
| `mobile/src/components/ControleurLayout.jsx` | Fond clair (plus dégradé) |
| `mobile/src/navigation/AppNavigator.js` | Nav claire + tabs |

---

### Task 1: theme.js — Palette Warm Light

**Fichiers :**
- Modify: `mobile/src/constants/theme.js` (tout le fichier)

- [ ] **Remplacer les couleurs`colors`**

Remplacer toutes les valeurs du bloc `colors` :

```js
// Thème clair Warm Light — fond beige, accent terracotta, verre translucide
export const colors = {
  bg: '#F5F0EB',
  bgSecondary: '#EBE5DE',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  white: '#FFFFFF',
  text: '#1A1A1E',
  textSecondary: '#6B6560',
  textTertiary: '#9C9590',
  accent: '#C7513A',
  accentLight: '#F0DED8',
  green: '#2E7D5E',
  greenLight: '#E0F5EC',
  red: '#C73A3A',
  whiteMuted: '#9C9590',
  violet: '#7C6FA0',
  orange: '#D4835A',
  glassWhite: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.6)',
  glassDark: 'rgba(0,0,0,0.04)',
  textWhite: '#1A1A1E',
  textWhiteMuted: '#6B6560',
  inputBg: '#FFFFFF',
  inputBorder: '#D4CEC8',
  inputBorderFocus: '#C7513A',
}
```

- [ ] **Remplacer le bloc `glass`**

```js
export const glass = {
  bg: 'rgba(255,255,255,0.5)',
  bgLight: 'rgba(255,255,255,0.3)',
  bgHeavy: 'rgba(255,255,255,0.7)',
  border: 'rgba(255,255,255,0.6)',
  borderLight: 'rgba(255,255,255,0.4)',
  blur: 20,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.04)',
  darkBgHeavy: 'rgba(0,0,0,0.08)',
}
```

- [ ] **Remplacer le bloc `gradients`**

```js
export const gradients = {
  primary: ['#C7513A', '#B84530'],
  organisateur: ['#C7513A', '#B84530'],
  success: ['#2E7D5E', '#3A8F6E'],
  error: ['#C73A3A', '#D45050'],
}
```

- [ ] **Remplacer `textShadow`**

```js
export const textShadow = {
  textShadowColor: 'rgba(0,0,0,0)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 0,
}
```

- [ ] **Remplacer le commentaire d'en-tête**

```
// Thème clair Warm Light — fond beige #F5F0EB, accent terracotta #C7513A, verre translucide
```

- [ ] **Commit**

```bash
git add mobile/src/constants/theme.js
git commit -m "feat(theme): palette Warm Light beige + terracotta"
```

---

### Task 2: Composants partagés — glass sur fond clair

**Fichiers :**
- Modify: `mobile/src/components/GlassContainer.jsx`
- Modify: `mobile/src/components/GlassButton.jsx`
- Modify: `mobile/src/components/BoutonPrincipal.jsx`
- Modify: `mobile/src/components/GlassChip.jsx`
- Modify: `mobile/src/components/GlassBottomNav.jsx`
- Modify: `mobile/src/components/StatusBadge.jsx`
- Modify: `mobile/src/components/FormInput.jsx`

- [ ] **GlassContainer.jsx** — Version surface utilise `#FFFFFF`, version glass garde `glass.darkBg` (maintenant `rgba(0,0,0,0.04)`). Changer `blurType` par défaut de `'dark'` à `'light'`.

```jsx
// mobile/src/components/GlassContainer.jsx
export default function GlassContainer({ children, style, blurType = 'light', intensity = 70, variant = 'glass' }) {
  if (variant === 'surface') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
        {children}
      </View>
    )
  }
  return (
    <BlurView tint={blurType} intensity={intensity} style={[styles.container, style]}>
      {children}
    </BlurView>
  )
}
```

- [ ] **GlassButton.jsx** — Fond `rgba(255,255,255,0.4)`, texte `#1A1A1E`, ombre claire.

```jsx
// Dans les styles du bouton, remplacer le fond
container: {
  backgroundColor: 'rgba(255,255,255,0.4)',
  // ...reste inchangé
}
// textStyle : couleur #1A1A1E
```

- [ ] **BoutonPrincipal.jsx** — Dégradé `primary` (terracotta). Le haptique reste.

```jsx
// Le dégradé utilise déjà theme.gradients.primary, donc juste la màj theme.js suffit
```

- [ ] **GlassChip.jsx** — Inactif : fond `rgba(0,0,0,0.04)`, texte `#6B6560`, bordure `rgba(0,0,0,0.08)`. Actif : fond `#C7513A`, texte blanc.

```jsx
// Remplacer les couleurs dans les styles
inactive: {
  backgroundColor: 'rgba(0,0,0,0.04)',
  borderColor: 'rgba(0,0,0,0.08)',
},
inactiveText: {
  color: '#6B6560',
},
active: {
  backgroundColor: '#C7513A',
  borderColor: '#C7513A',
},
activeText: {
  color: '#FFFFFF',
},
```

- [ ] **GlassBottomNav.jsx** — Fond `rgba(255,255,255,0.6)` + blur. Actif `#C7513A`, inactif `#9C9590`.

```jsx
// Remplacer fond et couleurs
container: {
  backgroundColor: 'rgba(255,255,255,0.6)',
  // ...
},
activeColor: '#C7513A',
inactiveColor: '#9C9590',
```

- [ ] **StatusBadge.jsx** — Aucun changement nécessaire (couleurs déjà génériques). Vérifier que les couleurs sont cohérentes.

- [ ] **FormInput.jsx** — Fond blanc, bordure `#D4CEC8`, focus `#C7513A`. Label flottant `#6B6560` → `#C7513A`.

```jsx
// Remplacer les couleurs inline par les constantes theme
inputContainer: {
  backgroundColor: colors.inputBg,
  borderColor: colors.inputBorder,
},
focused: {
  borderColor: colors.inputBorderFocus,
},
label: {
  color: colors.textSecondary,
},
labelFocused: {
  color: colors.accent,
},
```

- [ ] **Commit**

```bash
git add mobile/src/components/GlassContainer.jsx mobile/src/components/GlassButton.jsx mobile/src/components/BoutonPrincipal.jsx mobile/src/components/GlassChip.jsx mobile/src/components/GlassBottomNav.jsx mobile/src/components/FormInput.jsx
git commit -m "feat(components): adapt composants au thème clair"
```

---

### Task 3: AnimatedEventCard — Overlay carousel renforcé

**Fichiers :**
- Modify: `mobile/src/components/AnimatedEventCard.jsx`

- [ ] **Renforcer l'overlay du carousel**

Actuellement : `colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}` sur LinearGradient.

Remplacer par un overlay plus contrasté pour garantir la lisibilité du texte blanc :

```jsx
<LinearGradient
  colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
  style={styles.overlay}
/>
```

- [ ] **Commit**

```bash
git add mobile/src/components/AnimatedEventCard.jsx
git commit -m "feat(carousel): overlay renforcé pour lisibilité texte blanc"
```

---

### Task 4: HomeScreen — Fond clair + glass

**Fichiers :**
- Modify: `mobile/src/screens/HomeScreen.jsx`

- [ ] **Remplacer les couleurs**

Changer tous les fonds `#1A1A1E` → `colors.bg` (qui vaut maintenant `#F5F0EB`) et les surfaces `#2C2C30` → `colors.surface` (`#FFFFFF`).
Remplacer `#D4A574` → `colors.accent` (`#C7513A`).
Supprimer toute référence à `textShadow`.
Vérifier qu'aucune couleur dark theme en dur ne subsiste.

- [ ] **Commit**

```bash
git add mobile/src/screens/HomeScreen.jsx
git commit -m "feat(home): fond clair + glass adapté"
```

---

### Task 5: EventSearchScreen — Fond clair

**Fichiers :**
- Modify: `mobile/src/screens/EventSearchScreen.jsx`

- [ ] **Remplacer fond et couleurs**

`#1A1A1E` → `colors.bg`, `#2C2C30` → `colors.surface`, `#D4A574` → `colors.accent`. Supprimer textShadow.

- [ ] **Commit**

```bash
git add mobile/src/screens/EventSearchScreen.jsx
git commit -m "feat(search): fond clair"
```

---

### Task 6: EventDetailScreen — Contenu clair + glass cards

**Fichiers :**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Restructurer le fond et le contenu**

Le header (image héros) reste avec overlay sombre et titre blanc.
En dessous, le ScrollView passe en fond `colors.bg` (`#F5F0EB`).
Les cartes d'info (date, lieu) deviennent des `GlassContainer` avec variant par défaut (glass clair).
Texte : `#1A1A1E`, secondaire : `#6B6560`. Les icônes : `colors.accent` (`#C7513A`).
Prix : `colors.accent`, 22px Bold.
Bouton "Acheter" : garde le dégradé primary (terracotta).

Remplacer toutes les occurrences de :
- `#1A1A1E` (fond) → `colors.bg`
- `#2C2C30` → `colors.surface`
- `#D4A574` → `colors.accent`
- `#B0B0B8` → `colors.textSecondary`
- Supprimer toute utilisation de `textShadow` dans les styles
- Supprimer `import { textShadow }` en haut du fichier

- [ ] **Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "feat(detail): fond clair + glass cards + lisibilité"
```

---

### Task 7: TicketScreen + MesTicketsScreen — Fond clair

**Fichiers :**
- Modify: `mobile/src/screens/TicketScreen.js`
- Modify: `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **TicketScreen.js** — Fond `colors.bg`. Le ticket blanc/crème se détache avec une ombre portée. Ajouter :

```jsx
// Dans le style du ticket (wrapper)
ticketWrapper: {
  backgroundColor: '#F5F2ED',
  borderRadius: 16,
  // ombre portée pour détacher du fond crème
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
}
```

Remplacer `colors.textSecondary` → `#6B6560` si utilisé en dur.

- [ ] **MesTicketsScreen.jsx** — Fond `colors.bg`. Cartes : strip `colors.accent` à gauche, fond `colors.surface`. `#D4A574` → `colors.accent`. Couleurs de statut inchangées.

- [ ] **Commit**

```bash
git add mobile/src/screens/TicketScreen.js mobile/src/screens/MesTicketsScreen.jsx
git commit -m "feat(tickets): fond clair + ombre ticket"
```

---

### Task 8: SupportScreen + ProfilScreen — Fond clair

**Fichiers :**
- Modify: `mobile/src/screens/SupportScreen.jsx`
- Modify: `mobile/src/screens/ProfilScreen.jsx`

- [ ] **SupportScreen.jsx** — `#1A1A1E` → `colors.bg`. Verifier qu'aucune couleur dark theme en dur ne subsiste.

- [ ] **ProfilScreen.jsx** — Idem + remplacer les `rgba(0,200,255,...)` résiduelles par `rgba(199,81,58,...)`.

- [ ] **Commit**

```bash
git add mobile/src/screens/SupportScreen.jsx mobile/src/screens/ProfilScreen.jsx
git commit -m "feat(support,profil): fond clair"
```

---

### Task 9: AccueilChoixScreen — Fond clair + terracotta

**Fichiers :**
- Modify: `mobile/src/screens/AccueilChoixScreen.jsx`

- [ ] **Remplacer les couleurs**

Fond : `#1A1A1E` → `colors.bg`.
Accents des cartes : Acheteur `#A78BFA` → `#7C6FA0`, Contrôleur `#D4A574` → `colors.accent`, Organisateur `#6CD4A0` → `#2E7D5E`.

- [ ] **Commit**

```bash
git add mobile/src/screens/AccueilChoixScreen.jsx
git commit -m "feat(accueil): fond clair + accents mis à jour"
```

---

### Task 10: Écrans Auth — Fond clair

**Fichiers :**
- Modify: `mobile/src/screens/auth/SocialAuthScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionControleurScreen.jsx`
- Modify: `mobile/src/components/InputOTP.jsx`

- [ ] **Chaque écran auth**

Remplacer fond `#1A1A1E` → `colors.bg`. Accent `#D4A574` → `colors.accent`.
Vérifier les glass containers : utiliser `blurType='light'`.
Chips et boutons : déjà gérés via les composants.

- [ ] **InputOTP.jsx** — Cases : fond blanc, bordure `#D4CEC8`, remplie `#C7513A`.

```jsx
// Dans les styles
cell: {
  backgroundColor: '#FFFFFF',
  borderColor: '#D4CEC8',
},
cellFilled: {
  borderColor: '#C7513A',
  backgroundColor: '#C7513A',
},
```

- [ ] **Commit**

```bash
git add mobile/src/screens/auth/SocialAuthScreen.jsx mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx mobile/src/screens/auth/ConnexionControleurScreen.jsx mobile/src/components/InputOTP.jsx
git commit -m "feat(auth): fond clair"
```

---

### Task 11: ScannerScreen — Fond clair

**Fichiers :**
- Modify: `mobile/src/screens/controleur/ScannerScreen.jsx`

- [ ] **Remplacer le fond**

`#1A1A1E` → `colors.bg`. Les overlays de scan (VALIDE/DEJA_UTILISE/EXPIRE etc.) gardent leurs couleurs actuelles (vert `#6CD4A0`, orange `#E8A868`, rouge `#E86868`).
Cadre scan : passe de `#D4A574` à `#C7513A` ou conserve doré — décision design.

- [ ] **Commit**

```bash
git add mobile/src/screens/controleur/ScannerScreen.jsx
git commit -m "feat(scanner): fond clair"
```

---

### Task 12: Layouts — Fond clair

**Fichiers :**
- Modify: `mobile/src/components/BuyerLayout.jsx`
- Modify: `mobile/src/components/OrganisateurLayout.jsx`
- Modify: `mobile/src/components/ControleurLayout.jsx`

- [ ] **BuyerLayout.jsx** — Fond `colors.bg`.

- [ ] **OrganisateurLayout.jsx** — Retirer le LinearGradient (plus de dégradé indigo). Fond `colors.bg`.

```jsx
// Avant : <LinearGradient> avec indigo
// Après : <View style={{ flex: 1, backgroundColor: colors.bg }}>
```

- [ ] **ControleurLayout.jsx** — Idem : retirer le LinearGradient, fond `colors.bg`.

- [ ] **Commit**

```bash
git add mobile/src/components/BuyerLayout.jsx mobile/src/components/OrganisateurLayout.jsx mobile/src/components/ControleurLayout.jsx
git commit -m "feat(layouts): fond clair unifié"
```

---

### Task 13: AppNavigator — Nav claire

**Fichiers :**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Remplacer les couleurs**

Tab.Bar : fond `rgba(255,255,255,0.7)` + blur. Actif `#C7513A`. Inactif `#9C9590`.
Header : fond `rgba(255,255,255,0.5)`, titre `#1A1A1E`.

Remplacer toutes les couleurs dark theme :
- `#1A1A1E` → hors de propos (plus fond header)
- `#2C2C30` → `rgba(255,255,255,0.7)` pour tab bar
- `#D4A574` → `#C7513A`
- `#8A8A92` → `#9C9590`
- `#1E1B4B` → supprimer (plus utilisé)

- [ ] **Commit**

```bash
git add mobile/src/navigation/AppNavigator.js
git commit -m "feat(nav): barre et header thème clair"
```

---

### Task 14: Vérification globale — zéro résidu dark theme

**Fichiers :**
- Search: `mobile/src/` pour les couleurs obsolètes

- [ ] **Scan des résidus**

Chercher dans `mobile/src/` les patterns :
- `#1A1A1E` (sauf dans theme.js comme valeur de `text`)
- `#D4A574` (sauf dans theme.js)
- `#0D1B2A` (ancien fond bleu nuit)
- `#00C8FF` (ancien cyan)
- `#2C2C30` (sauf dans theme.js comme valeur de `surface`)
- `rgba(0,0,0,0.25)` ou `glass.darkBg` dans les styles (doit être 0.04 en clair)
- `textShadow` dans les styles (doit être supprimé)

- [ ] **Vérifier les commentaires** — Commentaires mentionnant "sombre", "Warm Charcoal", "charbon" → "clair", "Warm Light", "beige".

- [ ] **Commit**

```bash
git add -A
git commit -m "chore: nettoyage résidus thème sombre"
```
