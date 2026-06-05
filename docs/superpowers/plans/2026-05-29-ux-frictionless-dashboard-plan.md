# UX sans friction — Plan d'implémentation

> **Goal:** Réduire la friction et améliorer le confort : toasts, skeletons, transitions, validation temps réel, dashboard organisateur premium.

**Architecture:** Composants réutilisables (Toast, Skeleton, EmptyState, MaskedInput) + contexte ToastContext + modifications ciblées écran par écran.

**Tech Stack:** React Native, Expo, @gorhom/bottom-sheet, expo-haptics, expo-local-authentication, react-native-mask-input, react-native-svg

---

### Task 1: Dépendances

- [ ] **Installer les packages**

```bash
npx expo install @gorhom/bottom-sheet expo-haptics expo-local-authentication react-native-mask-input react-native-svg
```

---

### Task 2: Système de toasts

**Créer:** `mobile/src/context/ToastContext.jsx` — Contexte avec `toast.success()`, `toast.error()`, `toast.info()`
**Créer:** `mobile/src/components/Toast.jsx` — Composant toast animé (slide in/out, auto-disparition 3s, swipe to dismiss)
**Modifier:** `mobile/App.js` — Wrapper `<ToastProvider>`

- [ ] Créer `ToastContext.jsx`
- [ ] Créer `Toast.jsx`
- [ ] Modifier `App.js` pour intégrer le provider
- [ ] Modifier `OrganisateurDashboardScreen.jsx` : remplacer les `Alert.alert` par des toasts (succès création, erreur chargement)

---

### Task 3: Skeleton shimmer

**Créer:** `mobile/src/components/Skeleton.jsx` — `<Skeleton width height borderRadius />` avec animation LinearGradient mobile

- [ ] Créer le composant
- [ ] Intégrer sur Dashboard (stats cards + liste événements en chargement)

---

### Task 4: Empty states illustrés

**Créer:** `mobile/src/components/EmptyState.jsx` — `<EmptyState icon title subtitle actionLabel onAction />` avec illustration SVG

- [ ] Créer le composant
- [ ] Remplacer les empty states existants (Dashboard, MesTickets, GestionEvenements, ScanHistory)

---

### Task 5: Validation temps réel

**Créer:** `mobile/src/hooks/useValidation.js` — Hook `useValidation({rules})` retourne `{values, errors, touched, handleChange, isValid}`

- [ ] Créer le hook avec règles : required, email, phone, minLength, maxLength
- [ ] Intégrer sur ConnexionOrganisateur (email + password)
- [ ] Intégrer sur CreerEvenement (nom, date, lieu, prix)
- [ ] Intégrer sur EntrerNumero (téléphone +221)

---

### Task 6: Inputs masqués

**Créer:** `mobile/src/components/MaskedInput.jsx` — Wrapper `react-native-mask-input` avec styles theme

- [ ] Créer le composant
- [ ] Remplacer l'input téléphone sur EntrerNumero et EventDetail
- [ ] Ajouter masque prix sur CreerEvenement

---

### Task 7: Dashboard organisateur — Skeleton + compteurs animés + quick actions

**Modifier:** `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] Skeleton shimmer sur les 3 stats cards pendant `loadData()`
- [ ] Compteurs animés : `Animated.timing` de 0 → valeur cible (800ms, easeOut)
- [ ] Barre de 3 quick actions sous le hero : Créer / Tickets / Gérer (icônes + texte)
- [ ] Badge statut événement : Vert (à venir), Orange (< 7 jours), Rouge (passé)

---

### Task 8: Dashboard — Mini graphiques SVG

**Modifier:** `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] Cercles de progression SVG pour taux remplissage par événement (dans le détail expandé)
- [ ] Couleur automatique : vert (>70%), orange (30-70%), rouge (<30%)

---

### Task 9: DatePicker/TimePicker inline

**Modifier:** `mobile/src/screens/organisateur/CreerEvenementScreen.jsx`

- [ ] Remplacer le `DateTimePicker` modal par un sélecteur mois inline (swipe horizontal)
- [ ] TimePicker avec roues heures/minutes
- [ ] Ajouter `KeyboardAwareScrollView`

---

### Task 10: Auto-submit OTP

**Modifier:** `mobile/src/screens/auth/EntrerOTPScreen.jsx`

- [ ] Dès le 6e chiffre saisi, lancer `verifierOTP` automatiquement
- [ ] Petite animation de validation (coche verte) avant navigation

---

### Task 11: Bottom sheet catégories

**Modifier:** `mobile/src/screens/EventDetailScreen.jsx`

- [ ] Remplacer la sélection de catégorie par `@gorhom/bottom-sheet`
- [ ] Snap points : ['25%', '50%']

---

### Task 12: Pull-to-refresh + empty states

**Modifier:** `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`
**Modifier:** `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`
**Modifier:** `mobile/src/screens/MesTicketsScreen.jsx`
**Modifier:** `mobile/src/screens/controleur/ScanHistoryScreen.jsx`

- [ ] Ajouter `RefreshControl` sur les ScrollView
- [ ] Remplacer les empty states bruts par `<EmptyState>`

---

### Task 13: Swipe-back Android + swipe actions

**Modifier:** `mobile/src/navigation/AppNavigator.js`

- [ ] Activer `gestureEnabled: true` (forcé sur Android dans `screenOptions`)

**Modifier:** `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`
**Modifier:** `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] Swipe-to-delete avec `react-native-gesture-handler` (Swipeable)

---

### Task 14: Connexion rapide biométrie

**Modifier:** `mobile/src/context/AuthContext.jsx`
**Modifier:** `mobile/src/screens/AccueilChoixScreen.jsx`

- [ ] À la restauration de session, si rôle = organisateur, proposer empreinte/face ID via `expo-local-authentication`
- [ ] Bouton "Connexion rapide" sur AccueilChoix si une session organisateur existante est détectée
