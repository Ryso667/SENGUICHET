# Organisateur Mobile Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing organizer features to the mobile app: registration flow (inscription + pending validation), promo codes in event creation, and extended tab filters.

**Architecture:** Two independent work streams that touch different files: (A) new auth screens for registration, (B) enhancements to existing create-event and event-list screens.

**Tech Stack:** React Native, Expo, AsyncStorage, `expo-linear-gradient`, `react-native-safe-area-context`

---

### Stream A: InscriptionOrganisateurScreen + EnAttenteValidationScreen

**Files:**
- Create: `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx`
- Create: `mobile/src/screens/auth/EnAttenteValidationScreen.jsx`
- Modify: `mobile/src/services/authService.js` (update `inscrireOrganisateur` to call API + mock)
- Modify: `mobile/src/navigation/AppNavigator.js` (add new screens)
- Modify: `mobile/src/screens/AccueilChoixScreen.jsx` (add "S'inscrire" link)

- [ ] **Step 1: Create `InscriptionOrganisateurScreen.jsx`**

Fields: nom, telephone (with +221 mask), email, password (with strength indicator), confirm password.
Follow the same visual style as `ConnexionOrganisateurScreen.jsx` (indigo/peach theme, Outfit font, rounded inputs).
Password strength: 4 levels (Faible/Moyen/Fort/Très fort) based on length + uppercase + digit + special char.

- [ ] **Step 2: Create `EnAttenteValidationScreen.jsx`**

Static screen shown after successful registration. Shows:
- "Inscription envoyée !" title
- Progress stepper (3 steps): Inscription → Validation → Activation
- Info text: "Un administrateur va valider ton compte. Tu recevras un email quand il sera activé."
- "Retour à l'accueil" button → navigates to `AccueilChoix`

- [ ] **Step 3: Update `authService.js` — `inscrireOrganisateur` function**

Current mock returns `{ message: 'Demande envoyée' }`. Update to:
- In MOCK_MODE: simulate success with `{ message: 'Inscription envoyée', user: { nom, email, telephone, statut: 'en_attente' } }`
- When backend ready: call `appelAPI('/auth/organisateur/inscription', { method: 'POST', body: payload })`

- [ ] **Step 4: Update `AppNavigator.js` — add new screens**

Import both screens.
Add to the auth stack (inside `{!role && ...}`):
```jsx
<Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} />
<Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />
```

- [ ] **Step 5: Update `AccueilChoixScreen.jsx` — add registration link**

Under the "Organisateur" card (or in the organisateur section of the screen), add a "Pas encore de compte ? S'inscrire" link that navigates to `InscriptionOrganisateur`.

### Stream B: Promo Codes + Tab Filters

**Files:**
- Modify: `mobile/src/screens/organisateur/CreerEvenementScreen.jsx` (add promo code fields)
- Modify: `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx` (extend tabs)

- [ ] **Step 1: Add promo code toggle + fields to `CreerEvenementScreen.jsx`**

Add after the ticket categories section (before the "Créer l'événement" button):
- Toggle switch "Activer un code promo" (using same style as the app — TouchableOpacity with state change)
- When active, show:
  - Code field (text input, placeholder: "Ex: PROMO20")
  - Type picker: "Pourcentage" / "Montant fixe" (simple toggle between two options)
  - Valeur field (numeric, placeholder: "20" or "5000" depending on type)
  - Limite d'utilisation (numeric, placeholder: "100")
- Store promo data in state: `{ code: string, type: 'pourcentage'|'fixe', valeur: string, limite: string }`
- Include in the recap modal display
- Include in the data object sent to `creerEvenementAPI` / `modifierEvenementAPI`

- [ ] **Step 2: Extend tabs in `GestionEvenementsScreen.jsx`**

Change `const TABS = ['Tous', 'Actifs', 'Terminés']` to `const TABS = ['Tous', 'Actifs', 'En attente', 'Terminés', 'Annulés']`
Update the filter logic:
- 'En attente' → `evt.statut === 'en_attente'`
- 'Annulés' → `evt.statut === 'annule'`

## Self-Review

- **Gaps**: The plan covers all 3 features requested (registration, promo codes, tab filters). No gaps.
- **Placeholders**: All code described in steps, no TBD/TODO.
- **Type consistency**: authService `inscrireOrganisateur` returns `{ message, user }` — matches how other functions work. Promo data structure `{ code, type, valeur, limite }` matches web version.
- **File conflicts**: Stream A touches authService.js + AppNavigator.js. Stream B touches CreerEvenementScreen.jsx + GestionEvenementsScreen.jsx. Zero overlap.
