# Phase 5 — Accessibilité et polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WCAG AA compliance on tap targets (44×44pt) and contrast (textTertiary), plus Dashboard stat hierarchy fix.

**Architecture:** 3 small atomic changes — theme.js constant, GlassChip style, Dashboard style, EventDetailScreen style.

**Tech Stack:** React Native, 0 new dependencies.

---

### Task 1: Contrast — textTertiary light mode

**Files:**
- Modify: `mobile/src/constants/theme.js`

- [ ] **Step 1: Change light mode textTertiary color**

Find `textTertiary: '#9CA3AF'` in the light palette (around line 13). Change to:
```js
textTertiary: '#6B7280',
```
(Cette valeur est identique à textSecondary — elle garantit 4.6:1 sur fond blanc)

- [ ] **Step 2: Commit**

```bash
git add mobile/src/constants/theme.js
git commit -m "fix: contraste textTertiary mode clair #9CA3AF→#6B7280 (WCAG AA)"
```

---

### Task 2: Tap targets — GlassChip minHeight

**Files:**
- Modify: `mobile/src/components/GlassChip.jsx`

- [ ] **Step 1: Add minHeight to chip style**

Find the `chip:` style block. Add:
```js
minHeight: 44,
minWidth: 44,
```
Justify the content with flex-center, so the chip sizes itself but the tap target is always ≥44×44.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/GlassChip.jsx
git commit -m "fix: taille tactile minimale 44pt sur GlassChip"
```

---

### Task 3: Tap targets — Quantity buttons minHeight

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Step 1: Ensure quantity buttons have minHeight/minWidth**

Find the `quantiteBtn` style (around line 1264). Currently uses `width: scale(44)`. Add a guard:
```js
minWidth: 44,
minHeight: 44,
```
This ensures the button is never below 44×44 even when `scale()` reduces it on small screens.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "fix: taille tactile minimale 44pt sur boutons quantite"
```

---

### Task 4: Dashboard hierarchy — stat label font size

**Files:**
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] **Step 1: Increase statLabel fontSize from 11 to 12**

Find `statLabel:` style (around line 242). Change:
```js
fontSize: 11,
```
To:
```js
fontSize: 12,
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx
git commit -m "fix: agrandit label stat dashboard 11→12px pour lisibilite"
```
