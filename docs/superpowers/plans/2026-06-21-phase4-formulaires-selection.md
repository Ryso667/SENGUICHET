# Phase 4 — Formulaires et sélection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des icônes/émojis aux modales de sélection (catégories, villes, types billets) dans CreerEvenementScreen et MesDemandesScreen + centraliser blurType.

**Architecture:** Les données sources sont des tableaux de strings. On ajoute des mappings d'icônes par valeur (pas de restructuration des données). Fonction utilitaire `getBlurType` partagée.

**Tech Stack:** React Native, aucune nouvelle dépendance.

---

### Task 1: Icônes dans les modales CreerEvenementScreen

**Files:**
- Modify: `mobile/src/screens/organisateur/CreerEvenementScreen.jsx`

- [ ] **Step 1: Ajouter les mappings d'icônes après les constantes CATEGORIES/VILLES/BILLET_CATEGORIES**

```jsx
const ICONES_CATEGORIES = {
  Concert: '🎵', Festival: '🎪', Sport: '⚽',
  Theatre: '🎭', Conference: '📚', Atelier: '🔧',
}
const ICONES_VILLES = {
  Dakar: '📍', Thiès: '📍', 'Saint-Louis': '📍', Tambacounda: '📍',
  Louga: '📍', Kaolack: '📍', Ziguinchor: '📍', Mbour: '📍',
  Touba: '📍', Diourbel: '📍', Kolda: '📍', Matam: '📍',
  Kédougou: '📍', Sédhiou: '📍', Kaffrine: '📍',
}
const ICONES_BILLETS = {
  Standard: '🎟️', VIP: '🎟️', Premium: '🎟️', Or: '🥇', Argent: '🥈',
}
```

- [ ] **Step 2: Modifier les 3 renderItem dans les FlatLists de sélection**

**Catégorie (lignes 545-552):**
Remplacer:
```jsx
<Text style={[s.pickerItem, evtActiveCategory === item && s.pickerItemActive]}>
  {item}
</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, evtActiveCategory === item && s.pickerItemActive]}>
  {ICONES_CATEGORIES[item] || '📋'}  {item}
</Text>
```

**Type billet (lignes 566-576):**
Remplacer:
```jsx
<Text style={[s.pickerItem, tmpTicket.cat === item && s.pickerItemActive]}>
  {item}
</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, tmpTicket.cat === item && s.pickerItemActive]}>
  {ICONES_BILLETS[item] || '🎟️'}  {item}
</Text>
```

**Ville (lignes 590-597):**
Remplacer:
```jsx
<Text style={[s.pickerItem, tmpTicket.ville === item && s.pickerItemActive]}>
  {item}
</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, tmpTicket.ville === item && s.pickerItemActive]}>
  {ICONES_VILLES[item] || '📍'}  {item}
</Text>
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/organisateur/CreerEvenementScreen.jsx
git commit -m "feat: icones dans les modales de selection (CreerEvenementScreen)"
```

---

### Task 2: Icônes dans les modales MesDemandesScreen

**Files:**
- Modify: `mobile/src/screens/organisateur/MesDemandesScreen.jsx`

- [ ] **Step 1: Ajouter les mappings d'icônes**

```jsx
const ICONES_CATEGORIES = {
  Concert: '🎵', Festival: '🎪', Sport: '⚽',
  Theatre: '🎭', Conference: '📚', Atelier: '🔧',
}
const ICONES_VILLES = {
  Dakar: '📍', Thiès: '📍', 'Saint-Louis': '📍', Tambacounda: '📍',
  Louga: '📍', Kaolack: '📍', Ziguinchor: '📍', Mbour: '📍',
  Touba: '📍', Diourbel: '📍', Kolda: '📍', Matam: '📍',
  Kédougou: '📍', Sédhiou: '📍', Kaffrine: '📍',
}
const ICONES_BILLETS = {
  Standard: '🎟️', VIP: '🎟️', Premium: '🎟️', Or: '🥇', Argent: '🥈',
}
```

- [ ] **Step 2: Modifier le renderItem de la sélection d'événement (lignes 281-297)**

Remplacer le bloc `<Text>` principal par:
```jsx
<Text style={[s.pickerItem, selectedEvent?.id === item.id && s.pickerItemActive]}>
  {ICONES_CATEGORIES[item.categorie] || '📅'}  {item.titre || item.nom}
</Text>
```

- [ ] **Step 3: Modifier le renderItem de la sélection catégorie événement (lignes 753-760)**

Remplacer:
```jsx
<Text style={[s.pickerItem, cat === item && s.pickerItemActive]}>{item}</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, cat === item && s.pickerItemActive]}>
  {ICONES_CATEGORIES[item] || '📋'}  {item}
</Text>
```

- [ ] **Step 4: Modifier le renderItem de la sélection catégorie billet (lignes 775-784)**

Remplacer:
```jsx
<Text style={[s.pickerItem, billetCat === item && s.pickerItemActive]}>{item}</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, billetCat === item && s.pickerItemActive]}>
  {ICONES_BILLETS[item] || '🎟️'}  {item}
</Text>
```

- [ ] **Step 5: Modifier le renderItem de la sélection ville (lignes 800-807)**

Remplacer:
```jsx
<Text style={[s.pickerItem, villeItem === item && s.pickerItemActive]}>{item}</Text>
```
Par:
```jsx
<Text style={[s.pickerItem, villeItem === item && s.pickerItemActive]}>
  {ICONES_VILLES[item] || '📍'}  {item}
</Text>
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/organisateur/MesDemandesScreen.jsx
git commit -m "feat: icones dans les modales de selection (MesDemandesScreen)"
```

---

### Task 3: Centraliser blurType

**Files:**
- Create: `mobile/src/utils/themeUtils.js`
- Modify: `mobile/src/screens/organisateur/CreerEvenementScreen.jsx` (replace 3 blurType)
- Modify: `mobile/src/screens/organisateur/MesDemandesScreen.jsx` (replace 4 blurType)

- [ ] **Step 1: Créer la fonction utilitaire getBlurType**

Créer `mobile/src/utils/themeUtils.js`:
```jsx
// Fonctions utilitaires liées au thème
// getBlurType : retourne 'dark' ou 'light' selon le mode sombre
// Utilisé par les GlassContainer dans les modales

// Retourne 'dark' si mode sombre, 'light' sinon
export function getBlurType(isDark) {
  return isDark ? 'dark' : 'light'
}
```

- [ ] **Step 2: Mettre à jour CreerEvenementScreen**

Ajouter l'import:
```jsx
import { getBlurType } from '../../utils/themeUtils'
```

Remplacer les 3 occurrences de `blurType="dark"` (lignes 539, 560, 584) par:
```jsx
blurType={getBlurType(isDark)}
```

- [ ] **Step 3: Mettre à jour MesDemandesScreen**

Ajouter l'import:
```jsx
import { getBlurType } from '../../utils/themeUtils'
```

Remplacer les 4 occurrences de `blurType="dark"` (lignes 268, 747, 769, 794) par:
```jsx
blurType={getBlurType(isDark)}
```

- [ ] **Step 4: Vérifier que `isDark` est bien destructure dans les deux fichiers**

CreerEvenementScreen (ligne 39): `const { colors, isDark } = useTheme()` — déjà présent ✅
MesDemandesScreen (ligne 49): `const { colors, mode, isDark } = useTheme()` — déjà présent ✅

- [ ] **Step 5: Commit**

```bash
git add mobile/src/utils/themeUtils.js mobile/src/screens/organisateur/CreerEvenementScreen.jsx mobile/src/screens/organisateur/MesDemandesScreen.jsx
git commit -m "feat: centralise blurType via getBlurType(isDark) dans les modales"
```
