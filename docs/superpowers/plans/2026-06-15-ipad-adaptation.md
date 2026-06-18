# iPad Adaptation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Adapt the SENGUICHET mobile app for iPad (Apple Review requirement) without breaking the existing iPhone rendering.

**Architecture:** A shared `responsive.js` utility provides `scale()`, `fontScale()`, and `isPad` helpers. Each screen/component replaces hardcoded px values with these calls. `isPad` conditionals enable layout changes (e.g., 3 cards in a row). Changes are additive — existing iPhone renders identically because `scale(375) ≈ 1`.

**Tech Stack:** React Native (Expo), `Platform.isPad`, `useWindowDimensions`, `Dimensions.get('window').width`

---

### Task 1: Responsive utility (`src/utils/responsive.js`)

**Files:**
- Create: `mobile/src/utils/responsive.js`

- [ ] **Step 1: Create responsive.js**

```js
import { Dimensions, Platform } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const BASE_WIDTH = 375 // iPhone 14 base

export const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size

export const fontScale = (size) => {
  const scaled = (SCREEN_WIDTH / BASE_WIDTH) * size
  return Math.min(scaled, size * 1.3) // cap at 1.3x to avoid absurdly large fonts
}

export const isPad = Platform.isPad || (Platform.OS === 'android' && Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600)
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/utils/responsive.js
git commit -m "feat(ipad): add responsive scaling utility (scale, fontScale, isPad)"
```

---

### Task 2: TicketScreen.js — replace hardcoded px with scale()

**Files:**
- Modify: `mobile/src/screens/TicketScreen.js`

- [ ] **Step 1: Add import for responsive.js**

After line 13 (dateUtils import), add:
```js
import { scale, fontScale, isPad } from '../utils/responsive'
```

- [ ] **Step 2: Replace hardcoded values in StyleSheet**

**Line 53**: Replace `const SCREEN_WIDTH = Dimensions.get('window').width` with just retaining it for NB_DASHES calc (the existing line 53-54 is fine as-is — NB_DASHES already uses `Math.min(SCREEN_WIDTH, 340)`)

**Line 303**: Replace `maxWidth: 340` with `maxWidth: scale(340)`

**Lines 320-321**: Replace `paddingVertical: 32, paddingHorizontal: 28` with `paddingVertical: scale(32), paddingHorizontal: scale(28)`

**Lines 346, 353**: Replace `width: 38, height: 38, borderRadius: 10` with `width: scale(38), height: scale(38), borderRadius: scale(10)` idem for the smaller inline logo `width: scale(28), height: scale(28), borderRadius: scale(6)`

**Line 356**: Replace `fontSize: 10` with `fontSize: fontScale(10)`

**Line 359**: Replace `letterSpacing: 3` with `letterSpacing: scale(3)`

**Lines 365-366**: Replace `marginTop: 20, marginBottom: 18` with `marginTop: scale(20), marginBottom: scale(18)`

**Line 369**: Replace `fontSize: 22` with `fontSize: fontScale(22)`

**Line 374**: Replace `lineHeight: 28` with `lineHeight: scale(28)`

**Lines 380-382**: Replace `paddingVertical: 4, paddingHorizontal: 14, marginTop: 10` with `paddingVertical: scale(4), paddingHorizontal: scale(14), marginTop: scale(10)`

**Lines 385, 387**: Replace `fontSize: 9, letterSpacing: 2` with `fontSize: fontScale(9), letterSpacing: scale(2)`

**Line 393**: Replace `height: 24` with `height: scale(24)`

**Line 402**: Replace `paddingHorizontal: 30` with `paddingHorizontal: scale(30)`

**Lines 407-410**: Replace `width: 5, height: 2, borderRadius: 1` with `width: scale(5), height: scale(2), borderRadius: scale(1)`

**Line 415**: Replace `width: 24, height: 24, borderRadius: 12` with `width: scale(24), height: scale(24), borderRadius: scale(12)`

**Lines 419, 422, 425**: Replace `marginTop: -12, left: -12, right: -12` with `marginTop: scale(-12), left: scale(-12), right: scale(-12)`

**Lines 431-433**: Replace `paddingHorizontal: 28, paddingTop: 28, paddingBottom: 16` with `paddingHorizontal: scale(28), paddingTop: scale(28), paddingBottom: scale(16)`

**Line 447**: Replace `fontSize: 8` with `fontSize: fontScale(8)`

**Line 449**: Replace `letterSpacing: 2` with `letterSpacing: scale(2)`

**Line 451**: Replace `marginBottom: 3` with `marginBottom: scale(3)`

**Line 454**: Replace `fontSize: 14` with `fontSize: fontScale(14)`

**Line 459**: Replace `marginTop: 14` with `marginTop: scale(14)`

**Lines 462, 464**: Replace `fontSize: 8, letterSpacing: 2` with `fontSize: fontScale(8), letterSpacing: scale(2)`

**Line 466**: Replace `marginBottom: 3` with `marginBottom: scale(3)`

**Line 469**: Replace `fontSize: 13` with `fontSize: fontScale(13)`

**Line 475**: Replace `height: 1` with `height: scale(1)`

**Line 477**: Replace `marginVertical: 18` with `marginVertical: scale(18)`

**Line 480**: Replace `fontSize: 9` with `fontSize: fontScale(9)`

**Line 484**: Replace `letterSpacing: 2` with `letterSpacing: scale(2)`

**Line 485**: Replace `marginBottom: 6` with `marginBottom: scale(6)`

**Lines 489-492**: Replace `borderRadius: 14, padding: 16, marginTop: 10, marginBottom: 6` with `borderRadius: scale(14), padding: scale(16), marginTop: scale(10), marginBottom: scale(6)`

**Line 494**: Replace `borderWidth: 1` with `borderWidth: scale(1)`

**Lines 508**: Replace `width: 56, height: 56, borderRadius: 28` with `width: scale(56), height: scale(56), borderRadius: scale(28)`

**Line 515**: Replace `fontSize: 26` with `fontSize: fontScale(26)`

**Lines 523-524**: Replace `paddingVertical: 24, paddingHorizontal: 28` with `paddingVertical: scale(24), paddingHorizontal: scale(28)`

**Lines 532-533**: Replace `paddingVertical: 6, paddingHorizontal: 24` with `paddingVertical: scale(6), paddingHorizontal: scale(24)`

**Line 536**: Replace `fontSize: 9` with `fontSize: fontScale(9)`

**Line 538**: Replace `letterSpacing: 2.5` with `letterSpacing: scale(2.5)`

**Line 542**: Replace `fontSize: 28` with `fontSize: fontScale(28)`

**Line 545**: Replace `letterSpacing: -0.5` with `letterSpacing: scale(-0.5)`

**Line 549**: Replace `fontSize: 9` with `fontSize: fontScale(9)`

**Line 556**: Replace `fontSize: 8` with `fontSize: fontScale(8)`

**Line 559**: Replace `letterSpacing: 3` with `letterSpacing: scale(3)`

**Line 561**: Replace `marginTop: 4` with `marginTop: scale(4)`

**Lines 573-574**: Replace `fontSize: 60, letterSpacing: 8` with `fontSize: fontScale(60), letterSpacing: scale(8)`

**Lines 583-584**: Replace `paddingVertical: 14, paddingHorizontal: 32` with `paddingVertical: scale(14), paddingHorizontal: scale(32)`

**Line 593**: Replace `fontSize: 14` with `fontSize: fontScale(14)`

**Line 595**: Replace `letterSpacing: 1` with `letterSpacing: scale(1)`

**Line 224 (JSX)**: Replace `quietZone={16}` with `quietZone={scale(16)}`

**Line 220 (JSX)**: Replace `size={200}` with `size={scale(200)}`

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/TicketScreen.js
git commit -m "feat(ipad): responsive scaling on TicketScreen"
```

---

### Task 3: AccueilChoixScreen.jsx — iPad row layout

**Files:**
- Modify: `mobile/src/screens/AccueilChoixScreen.jsx`

- [ ] **Step 1: Add responsive + useWindowDimensions imports**

After line 9 (theme import), add:
```js
import { useWindowDimensions } from 'react-native'
import { scale, fontScale, isPad } from '../utils/responsive'
```

- [ ] **Step 2: Add isPad-based layout at top of component**

After `const insets = useSafeAreaInsets()` (around line 19), add:
```js
const { width: screenWidth } = useWindowDimensions()
```

- [ ] **Step 3: Wrap cards in a conditional row/column layout**

Replace the current card-rendering section. The 3 cards (`TouchableOpacity` for Acheter/Scanner/Organisateur) are currently rendered inside a `View style={styles.cardsContainer}`. Change the container style:

Replace the cards container View with:
```jsx
<View style={[styles.cardsContainer, isPad && { flexDirection: 'row', justifyContent: 'center', gap: scale(16) }]}>
```

And wrap each card width for iPad:
```jsx
<View style={isPad && { flex: 1, maxWidth: scale(300) }}>
  <TouchableOpacity ...>
    ...
  </TouchableOpacity>
</View>
```

- [ ] **Step 4: Replace hardcoded px values with scale()**

**Line 112**: Replace `paddingTop: 60` with `paddingTop: scale(60)`

**Line 113**: Replace `width: 88, height: 88, borderRadius: 20` with `width: scale(88), height: scale(88), borderRadius: scale(20)`

**Line 114**: Replace `fontSize: 32, letterSpacing: 1` with `fontSize: fontScale(32), letterSpacing: scale(1)`

**Line 115**: Replace `paddingBottom: 60` with `paddingBottom: scale(60)`

**Line 128**: Replace `fontSize: 20, letterSpacing: -0.3` with `fontSize: fontScale(20), letterSpacing: scale(-0.3)`

**Line 129**: Replace `fontSize: 13, marginTop: 2` with `fontSize: fontScale(13), marginTop: scale(2)`

**JSX icon sizes (lines 93, 98)**: Replace `size={32}` with `size={scale(32)}` and `size={20}` with `size={scale(20)}`

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/AccueilChoixScreen.jsx
git commit -m "feat(ipad): row layout on iPad + responsive scaling on AccueilChoixScreen"
```

---

### Task 4: EventDetailScreen, ScannerScreen, EventCarousel

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`
- Modify: `mobile/src/screens/controleur/ScannerScreen.jsx`
- Modify: `mobile/src/components/EventCarousel.jsx`

- [ ] **Step 1: Add responsive import to EventDetailScreen.js**

After the theme import (line 16), add:
```js
import { scale, fontScale, isPad } from '../utils/responsive'
```

- [ ] **Step 2: Replace hardcoded values in EventDetailScreen.js**

| Line(s) | Old Value | New Value |
|---------|-----------|-----------|
| 545 | `paddingBottom: 120` | `paddingBottom: scale(120)` |
| 554 | `fontSize: 13` | `fontSize: fontScale(13)` |
| 564-566 | `width: 40, height: 40, borderRadius: 20` | `width: scale(40), height: scale(40), borderRadius: scale(20)` |
| 582 | `fontSize: 12, letterSpacing: 3` | `fontSize: fontScale(12), letterSpacing: scale(3)` |
| 589-592 | `fontSize: 42, letterSpacing: -1.5, lineHeight: 48` | `fontSize: fontScale(42), letterSpacing: scale(-1.5), lineHeight: scale(48)` |
| 596-600 | `width: 48, height: 2, borderRadius: 1, marginVertical: 20` | `width: scale(48), height: scale(2), borderRadius: scale(1), marginVertical: scale(20)` |
| 603-605 | `width: 42, height: 42, borderRadius: 14` | `width: scale(42), height: scale(42), borderRadius: scale(14)` |
| 614-615 | `paddingVertical: 18, paddingHorizontal: 18` | `paddingVertical: scale(18), paddingHorizontal: scale(18)` |
| 625, 628-629 | `fontSize: 42, letterSpacing: -2, lineHeight: 46` | `fontSize: fontScale(42), letterSpacing: scale(-2), lineHeight: scale(46)` |
| 633, 636 | `fontSize: 14, letterSpacing: 2` | `fontSize: fontScale(14), letterSpacing: scale(2)` |
| 645 | `fontSize: 12` | `fontSize: fontScale(12)` |
| 654-655 | `paddingVertical: 14, paddingHorizontal: 16` | `paddingVertical: scale(14), paddingHorizontal: scale(16)` |
| 659 | `fontSize: 16` | `fontSize: fontScale(16)` |
| 665 | `fontSize: 11` | `fontSize: fontScale(11)` |
| 676, 679 | `fontSize: 15, lineHeight: 26` | `fontSize: fontScale(15), lineHeight: scale(26)` |
| 687, 690 | `fontSize: 14, letterSpacing: 1` | `fontSize: fontScale(14), letterSpacing: scale(1)` |
| 693 | `fontSize: 11` | `fontSize: fontScale(11)` |
| 711 | `fontSize: 16` | `fontSize: fontScale(16)` |
| 716, 718 | `fontSize: 22, letterSpacing: -0.5` | `fontSize: fontScale(22), letterSpacing: scale(-0.5)` |
| 728-732 | `paddingHorizontal: 12, paddingVertical: 5, fontSize: 10` | `paddingHorizontal: scale(12), paddingVertical: scale(5), fontSize: fontScale(10)` |
| 752-754 | `width: 36, height: 4, borderRadius: 2` | `width: scale(36), height: scale(4), borderRadius: scale(2)` |
| 761 | `fontSize: 16` | `fontSize: fontScale(16)` |
| 769-770 | `paddingVertical: 14, paddingHorizontal: 14` | `paddingVertical: scale(14), paddingHorizontal: scale(14)` |
| 776 | `fontSize: 13` | `fontSize: fontScale(13)` |
| 781 | `fontSize: 10` | `fontSize: fontScale(10)` |
| 793 | `fontSize: 14` | `fontSize: fontScale(14)` |
| 798 | `fontSize: 9` | `fontSize: fontScale(9)` |
| 804-806 | `width: 20, height: 20, borderRadius: 10` | `width: scale(20), height: scale(20), borderRadius: scale(10)` |
| 815, 818 | `fontSize: 12, letterSpacing: 1.5` | `fontSize: fontScale(12), letterSpacing: scale(1.5)` |
| 835, 840 | `fontSize: 15` | `fontSize: fontScale(15)` |
| 848, 851 | `fontSize: 14, letterSpacing: 2` | `fontSize: fontScale(14), letterSpacing: scale(2)` |
| 856-857 | `fontSize: 40, letterSpacing: -1.5` | `fontSize: fontScale(40), letterSpacing: scale(-1.5)` |
| 886, 890 | `fontSize: 10, letterSpacing: 1.5` | `fontSize: fontScale(10), letterSpacing: scale(1.5)` |
| 893, 896 | `fontSize: 28, letterSpacing: -0.5` | `fontSize: fontScale(28), letterSpacing: scale(-0.5)` |
| 900 | `borderRadius: 16` | `borderRadius: scale(16)` |
| 911 | `paddingVertical: 20` | `paddingVertical: scale(20)` |
| 914, 917 | `fontSize: 18, letterSpacing: -0.2` | `fontSize: fontScale(18), letterSpacing: scale(-0.2)` |
| 937-941 | `top: 16, right: 16, width: 32, height: 32, borderRadius: 16` | `top: scale(16), right: scale(16), width: scale(32), height: scale(32), borderRadius: scale(16)` |
| 953-954 | `paddingVertical: 18, paddingHorizontal: 20` | `paddingVertical: scale(18), paddingHorizontal: scale(20)` |
| 961-962 | `width: 36, height: 36` | `width: scale(36), height: scale(36)` |
| 966 | `fontSize: 16` | `fontSize: fontScale(16)` |
| 974 | `minHeight: 260` | `minHeight: scale(260)` |
| 978 | `fontSize: 16` | `fontSize: fontScale(16)` |
| 984 | `fontSize: 13` | `fontSize: fontScale(13)` |
| 989-991 | `width: 80, height: 80, borderRadius: 40` | `width: scale(80), height: scale(80), borderRadius: scale(40)` |
| 997 | `fontSize: 20` | `fontSize: fontScale(20)` |
| 1001-1003 | `width: 80, height: 80, borderRadius: 40` | `width: scale(80), height: scale(80), borderRadius: scale(40)` |
| 1010 | `fontSize: 20` | `fontSize: fontScale(20)` |
| 1015 | `fontSize: 12` | `fontSize: fontScale(12)` |
| 1029-1030 | `paddingHorizontal: 28, paddingVertical: 14` | `paddingHorizontal: scale(28), paddingVertical: scale(14)` |
| 1034 | `fontSize: 14` | `fontSize: fontScale(14)` |

- [ ] **Step 3: Add responsive import to ScannerScreen.jsx**

After line 13 (theme import), add:
```js
import { scale, fontScale } from '../../utils/responsive'
```

- [ ] **Step 4: Replace hardcoded values in ScannerScreen.jsx**

| Line(s) | Old Value | New Value |
|---------|-----------|-----------|
| 175 | `padding: 24` | `padding: scale(24)` |
| 176 | `fontSize: 16, marginBottom: 16` | `fontSize: fontScale(16), marginBottom: scale(16)` |
| 179 | `paddingBottom: 20` | `paddingBottom: scale(20)` |
| 180 | `fontSize: 22` | `fontSize: fontScale(22)` |
| 182 | `fontSize: 13` | `fontSize: fontScale(13)` |
| 183 | `fontSize: 12` | `fontSize: fontScale(12)` |
| 184 | `fontSize: 12` | `fontSize: fontScale(12)` |
| 186 | `width: 250, height: 250, borderRadius: 16` | `width: scale(250), height: scale(250), borderRadius: scale(16)` |
| 188 | `fontSize: 24, marginBottom: 8` | `fontSize: fontScale(24), marginBottom: scale(8)` |
| 189 | `fontSize: 14, marginBottom: 32` | `fontSize: fontScale(14), marginBottom: scale(32)` |
| 164 (JSX) | `size={64}` (icon) | `size={scale(64)}` |

- [ ] **Step 5: Add responsive import to EventCarousel.jsx**

After line 6 (spacing import), add:
```js
import { scale } from '../utils/responsive'
```

- [ ] **Step 6: Replace hardcoded values in EventCarousel.jsx**

**Line 11**: Replace `CARD_HEIGHT = 400` with `CARD_HEIGHT = scale(400)`

- [ ] **Step 7: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js mobile/src/screens/controleur/ScannerScreen.jsx mobile/src/components/EventCarousel.jsx
git commit -m "feat(ipad): responsive scaling on EventDetailScreen, ScannerScreen, EventCarousel"
```

---

### Task 5: Navbars — FloatingTabBar + GlassBottomNav

**Files:**
- Modify: `mobile/src/components/FloatingTabBar.jsx`
- Modify: `mobile/src/components/GlassBottomNav.jsx`

- [ ] **Step 1: Add responsive import to FloatingTabBar.jsx**

After line 8 (fonts import), add:
```js
import { scale, fontScale, isPad } from '../utils/responsive'
```

- [ ] **Step 2: Replace hardcoded values in FloatingTabBar.jsx**

| Line(s) | Old Value | New Value |
|---------|-----------|-----------|
| 54 (JSX) | `size={22}` (icon) | `size={scale(22)}` |
| 98-99 | `left: 16, right: 16` | `left: scale(16), right: scale(16)` |
| 100 | `borderRadius: 32` | `borderRadius: scale(32)` |
| 109 | `borderRadius: 32` | `borderRadius: scale(32)` |
| 112-113 | `paddingVertical: 4, paddingHorizontal: 6` | `paddingVertical: scale(4), paddingHorizontal: scale(6)` |
| 119-121 | `left: 12, right: 12, height: 1.5` | `left: scale(12), right: scale(12), height: scale(1.5)` |
| 128-131 | `left: 12, right: 12, height: 6` | `left: scale(12), right: scale(12), height: scale(6)` |
| 133-134 | `borderBottomLeftRadius: 3, borderBottomRightRadius: 3` | `borderBottomLeftRadius: scale(3), borderBottomRightRadius: scale(3)` |
| 141 | `paddingVertical: 4` | `paddingVertical: scale(4)` |
| 144-146 | `width: 42, height: 42, borderRadius: 21` | `width: scale(42), height: scale(42), borderRadius: scale(21)` |
| 156 | `borderRadius: 21` | `borderRadius: scale(21)` |
| 169 | `fontSize: 10` | `fontSize: fontScale(10)` |
| 172 | `letterSpacing: 0.2` | `letterSpacing: scale(0.2)` |

- [ ] **Step 3: Add responsive import to GlassBottomNav.jsx**

After line 13 (colors import), add:
```js
import { scale, fontScale } from '../utils/responsive'
```

- [ ] **Step 4: Replace hardcoded values in GlassBottomNav.jsx**

| Line(s) | Old Value | New Value |
|---------|-----------|-----------|
| 54 (JSX) | `size={20}` (icon) | `size={scale(20)}` |
| 70 | `paddingTop: 8` | `paddingTop: scale(8)` |
| 79-81 | `width: 40, height: 40, borderRadius: 20` | `width: scale(40), height: scale(40), borderRadius: scale(20)` |
| 89 | `fontSize: 10` | `fontSize: fontScale(10)` |
| 92 | `letterSpacing: 0.2` | `letterSpacing: scale(0.2)` |

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/FloatingTabBar.jsx mobile/src/components/GlassBottomNav.jsx
git commit -m "feat(ipad): responsive scaling on navbars"
```

---

### Task 6: app.json — orientation default

**Files:**
- Modify: `mobile/app.json`

- [ ] **Step 1: Change orientation**

**Line 7**: Replace `"orientation": "portrait"` with `"orientation": "default"`

- [ ] **Step 2: Commit**

```bash
git add mobile/app.json
git commit -m "feat(ipad): allow all orientations (portrait+landscape) for iPad"
```
