# Brand Theme — Logo Design Adaptation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `mobile/src/constants/theme.js` with the new brand palette derived from `logo_design.jpeg` (navy #0A1026 primary, green #10B981 tertiary).

**Architecture:** Single file change — `lightColors` and `darkColors` objects in `theme.js`. All components consume colors via `useTheme()` so no UI code changes needed.

**Tech Stack:** React Native, StyleSheet, ThemeContext

---

### Task 1: Update theme.js with new brand palette

**Files:**
- Modify: `mobile/src/constants/theme.js:1-77`

- [ ] **Step 1: Update lightColors**

Replace `#111827` with `#0A1026` for `text`. Replace `#F9FAFB` with `#F5F6F8` for `bgSecondary`/`card`. All other values stay as-is.

Expected change:
```diff
-  bgSecondary: '#F9FAFB',
-  card: '#F4F6F9',
-  text: '#111827',
+  bgSecondary: '#F5F6F8',
+  card: '#F5F6F8',
+  text: '#0A1026',
```

- [ ] **Step 2: Update darkColors**

Replace dark mode bg/surface/card with navy-derived values.

Expected change:
```diff
-  bg: '#0F172A',
-  bgSecondary: '#1E293B',
-  surface: '#1E293B',
-  card: '#273548',
-  border: '#334155',
+  bg: '#0A1026',
+  bgSecondary: '#151C36',
+  surface: '#1A213B',
+  card: '#1F2641',
+  border: '#2A3150',
```

- [ ] **Step 3: Run a visual check**

Run: `npx expo start` (or ask user to reload the app)

Expected: All screens render with new navy text on white in light mode, navy backgrounds in dark mode. Green CTA buttons and badges unchanged. No invisible text.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/constants/theme.js
git commit -m "feat: adapt theme palette from logo_design (navy #0A1026, green tertiary)"
```
