# Refonte UI Claire — Plan d'implémentation mobile

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer l'app mobile du thème sombre vers le thème clair (blanc/gris), refondre la navigation en 4 tabs, et adapter tous les écrans.

**Architecture:** Le thème `theme.js` est déjà en valeurs claires — il faut nettoyer les tokens obsolètes (`textWhite`/`textWhiteMuted`). L'`AppNavigator` passe en navigation unique avec 4 tabs (Accueil, Explorer, Mes billets, Compte). Chaque écran est adapté individuellement : suppression de `BlurBackground`, remplacement de `GlassContainer` par cards blanches avec ombre, inversion des textes #FFFFFF vers `colors.text`.

**Tech Stack:** React Native / Expo, `@expo/vector-icons`, react-navigation (bottom-tabs + native-stack)

---

## File Structure

### Modified files:

| Fichier | Changement |
|---------|-----------|
| `mobile/src/constants/theme.js` | Supprimer `textWhite`, `textWhiteMuted` ; nettoyer les doublons |
| `mobile/src/navigation/AppNavigator.js` | Refondre en 4 tabs uniques + accès auth depuis Compte + modale événement direct |
| `mobile/src/screens/AccueilChoixScreen.jsx` | Rediriger immédiatement vers les tabs (ou supprimer) |
| `mobile/src/screens/HomeScreen.js` | Fond blanc, header, barre recherche, chips catégories, carousel conservé |
| `mobile/src/screens/EventSearchScreen.js` | Fond blanc, adapter UI |
| `mobile/src/screens/auth/ConnexionControleurScreen.jsx` | Fond blanc, supprimer BlurBackground, inverser #FFFFFF→colors.text |
| `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx` | Idem |
| `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx` | Idem |
| `mobile/src/screens/auth/EnAttenteValidationScreen.jsx` | Idem |
| `mobile/src/screens/auth/SocialAuthScreen.jsx` | Idem |
| `mobile/src/screens/ProfilScreen.jsx` | Adapté, liens vers auth/orga/controleur |
| `mobile/src/screens/MesTicketsScreen.jsx` | Fond blanc, supprimer BlurBackground gradient |
| `mobile/src/screens/EventDetailScreen.js` | Fond blanc, cards blanches, adapter glass |
| `mobile/src/screens/TicketScreen.js` | Forme conservée, fond blanc |
| `mobile/src/screens/NotificationsScreen.js` | Fond blanc |
| `mobile/src/screens/SupportScreen.jsx` | Fond blanc |
| `mobile/src/screens/ControleurDashboardScreen.jsx` | Fond blanc |
| `mobile/src/screens/controleur/ScannerScreen.jsx` | Fond blanc |
| `mobile/src/screens/controleur/ScanHistoryScreen.jsx` | Fond blanc |
| `mobile/src/screens/organisateur/*.jsx` | Fond blanc, supprimer OrganisateurLayout |
| `mobile/src/components/BlurBackground.jsx` | À conserver ou marquer déprécié |
| `mobile/src/components/GlassContainer.jsx` | Simplifier ou remplacer par Card blanche |
| `mobile/src/components/OrganisateurLayout.jsx` | Supprimer |

---

### Task 1: Clean up theme.js

**Files:**
- Modify: `mobile/src/constants/theme.js`

- [ ] **Step 1: Supprimer les tokens obsolètes et commentaires dark**

Remplacer le fichier pour nettoyer les tokens redondants :

```js
// Thème clair SENGUICHET
export const colors = {
  bg: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#1A56DB',
  primaryLight: '#EFF6FF',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  accent: '#1A56DB',
  accentLight: '#EFF6FF',
  green: '#10B981',
  greenLight: '#D1FAE5',
  red: '#EF4444',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  cyan: '#06B6D4',
  inputBg: '#F3F4F6',
  inputBorder: 'transparent',
  inputBorderFocus: '#1A56DB',
  placeholder: '#9CA3AF',
  navInactive: '#9CA3AF',
  navActive: '#1A56DB',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
}
```

- [ ] **Step 2: Run to verify no import errors**

```bash
npx --package expo-cli -- expo export --dump-sourcemap 2>&1 | head -20 || echo "Skipping full export - check ThemeContext usage instead"
grep -rn "textWhite\|textWhiteMuted\|colors\.violet\|colors\.slate\|colors\.mid\|colors\.muted\|glassWhite\|glassBorder\|glassDark" mobile/src/ --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v ".test."
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/constants/theme.js
git commit -m "refactor(theme): nettoyer tokens obsolètes textWhite/textWhiteMuted"
```

---

### Task 2: Refactor AppNavigator — 4 tabs uniques

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Restructurer le navigateur**

Le nouveau `AppNavigator` :
- `AcheteurTabs` devient le layout par défaut (tous les rôles, et non-connectés)
- 4 tabs : **Accueil** (Home → HomeScreen), **Explorer** (EventSearch), **Mes billets** (MesTickets), **Compte** (ProfilScreen)
- Les écrans organisateur/contrôleur sont empilés en stack depuis Compte
- L'arrivée directe sur un événement (QR, lien) empile une modale par-dessus les tabs
- `AccueilChoixScreen` n'est plus un écran d'entrée — navigation directe vers les tabs

Remplacer tout le fichier par cette structure :

```js
// Navigation principale — 4 tabs fixes avec piles contextuelles
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

// Écrans tabs
import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import ProfilScreen from '../screens/ProfilScreen'

// Écrans stack (auth, organisateur, contrôleur)
import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'
import ChangerMotDePasseScreen from '../screens/organisateur/ChangerMotDePasseScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navActive,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.jakarta.semiBold,
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="EventSearch"
        component={EventSearchScreen}
        options={{
          tabBarLabel: 'Explorer',
          tabBarIcon: ({ color }) => <Feather name="search" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MesTickets"
        component={MesTicketsScreen}
        options={{
          tabBarLabel: 'Mes billets',
          tabBarIcon: ({ color }) => <Feather name="ticket" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Compte',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
    </TabBarScrollProvider>
  )
}

const navigationRef = createNavigationContainerRef()

export default function AppNavigator() {
  const { role, chargement } = useAuth()

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  const headerStyle = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
    headerTintColor: colors.accent,
    headerBackTitle: 'Retour',
  }
  const header = (titre) => ({ ...headerStyle, headerTitle: titre })

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
        {/* Tabs principaux — toujours visibles */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Écrans auth (empilés depuis Compte) */}
        <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
        <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} options={header('Connexion')} />
        <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} options={header('Connexion')} />
        <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} options={header('Inscription')} />
        <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />

        {/* Écrans acheteur */}
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Support" component={SupportScreen} options={header('Support')} />

        {/* Écrans organisateur */}
        <Stack.Screen name="OrganisateurDashboard" component={OrganisateurDashboardScreen} />
        <Stack.Screen name="GestionEvenements" component={GestionEvenementsScreen} />
        <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
        <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
        <Stack.Screen name="Statistiques" component={StatistiquesScreen} />
        <Stack.Screen name="MesDemandes" component={MesDemandesScreen} />
        <Stack.Screen name="Parametres" component={ParametresScreen} options={header('Paramètres')} />
        <Stack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={header('Changer le mot de passe')} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={header('Notifications')} />

        {/* Écrans contrôleur */}
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/navigation/AppNavigator.js
git commit -m "feat(nav): refonte 4 tabs uniques (Accueil/Explorer/Mes billets/Compte)"
```

---

### Task 3: Bypass AccueilChoixScreen

**Files:**
- Modify: `mobile/src/context/AuthContext.js` (ou point d'entrée qui affiche AccueilChoix)

- [ ] **Step 1: Modifier le point d'entrée pour ne plus afficher AccueilChoixScreen**

Vérifier comment `AccueilChoixScreen` est appelé. Si c'est dans `App.js`, le remplacer par `AppNavigator` directement.

Chercher :

```bash
grep -rn "AccueilChoix" mobile/src/ --include="*.js" --include="*.jsx" | grep -v node_modules
```

- [ ] **Step 2: Si App.js utilise AccueilChoix comme écran d'entrée**

Modifier `App.js` pour qu'il pointe directement sur `AppNavigator` :

```js
// Avant
export default function App() {
  return <AccueilChoixScreen />
}

// Après
export default function App() {
  return <AppNavigator />
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/App.js
git commit -m "refactor: supprimer AccueilChoixScreen comme écran d'entrée"
```

---

### Task 4: Refondre ProfilScreen (onglet Compte)

**Files:**
- Modify: `mobile/src/screens/ProfilScreen.jsx`

- [ ] **Step 1: Adapter ProfilScreen pour servir de hub compte**

Le ProfilScreen doit :
- Afficher le profil si l'utilisateur est connecté (acheteur via OTP)
- Afficher des liens vers : Connexion organisateur, Connexion contrôleur, Inscription organisateur
- Afficher "Devenir organisateur"
- Fournir la déconnexion
- Fond blanc, pas de BlurBackground, pas de GlassContainer

- [ ] **Step 2: Implémenter**

```js
// Onglet Compte — hub profil + accès organisateur/contrôleur
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { colors, spacing, fonts, shadows } from '../../constants/theme'

export default function ProfilScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { role, utilisateur, deconnecter } = useAuth()

  const MENU = [
    { icon: 'log-in', label: 'Connexion organisateur', screen: 'ConnexionOrganisateur', roles: null },
    { icon: 'shield', label: 'Accès contrôleur', screen: 'ConnexionControleur', roles: null },
    { icon: 'user-plus', label: 'Devenir organisateur', screen: 'InscriptionOrganisateur', roles: null },
  ]

  const ORGA_MENU = [
    { icon: 'grid', label: 'Tableau de bord', screen: 'OrganisateurDashboard', roles: ['organisateur'] },
    { icon: 'calendar', label: 'Mes événements', screen: 'GestionEvenements', roles: ['organisateur'] },
    { icon: 'settings', label: 'Paramètres', screen: 'Parametres', roles: ['organisateur'] },
  ]

  const CTL_MENU = [
    { icon: 'maximize', label: 'Scanner', screen: 'Scanner', roles: ['controleur'] },
    { icon: 'clock', label: 'Historique', screen: 'ScanHistory', roles: ['controleur'] },
  ]

  const renderRow = (item, i) => (
    <TouchableOpacity key={i} style={styles.row} onPress={() => navigation.navigate(item.screen)}>
      <View style={styles.rowIcon}>
        <Feather name={item.icon} size={20} color={colors.accent} />
      </View>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Compte</Text>

        {role === 'acheteur' && utilisateur && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Feather name="user" size={24} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.profileName}>{utilisateur.email || 'Acheteur'}</Text>
              <Text style={styles.profileRole}>Acheteur</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espace professionnel</Text>
          {MENU.map(renderRow)}
        </View>

        {role === 'organisateur' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            {ORGA_MENU.map(renderRow)}
          </View>
        )}

        {role === 'controleur' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contrôleur</Text>
            {CTL_MENU.map(renderRow)}
          </View>
        )}

        {role && (
          <TouchableOpacity style={styles.deconnexionBtn} onPress={deconnecter}>
            <Feather name="log-out" size={18} color={colors.danger} />
            <Text style={styles.deconnexionText}>Déconnexion</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  title: { fontFamily: fonts.outfit.bold, fontSize: 24, color: colors.text, marginBottom: spacing.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 16,
    marginBottom: spacing.lg, ...shadows.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontFamily: fonts.outfit.semiBold, fontSize: 16, color: colors.text },
  profileRole: { fontFamily: fonts.jakarta.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.jakarta.semiBold, fontSize: 12, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: 12, marginBottom: 8, ...shadows.sm,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowLabel: { flex: 1, fontFamily: fonts.jakarta.medium, fontSize: 15, color: colors.text },
  deconnexionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: 12, backgroundColor: '#FEF2F2', marginTop: spacing.lg,
  },
  deconnexionText: { fontFamily: fonts.jakarta.semiBold, fontSize: 15, color: colors.danger },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/ProfilScreen.jsx
git commit -m "feat(profil): hub compte avec accès organisateur/contrôleur"
```

---

### Task 5: Adapter HomeScreen — fond blanc, header, recherche

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js`

- [ ] **Step 1: Refondre HomeScreen en thème clair**

Changements :
- Supprimer `BlurBackground`, remplacer par fond blanc
- Ajouter header blanc avec logo + icône
- Ajouter barre de recherche (input arrondi)
- Ajouter chips de catégories horizontal scrollable
- **Conserver le carousel existant** (mêmes animations, même composant)
- Conserver la liste des événements en cards blanches
- Couleurs : `colors.text` (#111827) pour les textes, `colors.textSecondary` pour métadonnées

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/HomeScreen.js
git commit -m "feat(home): refonte thème clair, header, recherche, chips"
```

---

### Task 6: Adapter les écrans d'auth — fond blanc

**Files:**
- Modify: `mobile/src/screens/auth/SocialAuthScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionControleurScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/EnAttenteValidationScreen.jsx`

Changements pour chaque fichier :
- Supprimer `<BlurBackground />` → fond blanc (supprimer l'import et le JSX)
- Remplacer `BlurBackground` par `View style={{ flex: 1, backgroundColor: colors.bg }}`
- Remplacer `GlassContainer` par `View style={[cardStyle, shadows.md]}` où `cardStyle = { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg }`
- Inverser les `#FFFFFF` → `colors.text` (les #FFFFFF qu'on avait mis comme correctifs)
- Inverser `rgba(255,255,255,0.7)` → `colors.textSecondary`
- Inverser `rgba(255,255,255,0.15)` sur les back buttons → `rgba(0,0,0,0.04)`
- Icones des back buttons : `#FFFFFF` → `colors.text` (#111827)

- [ ] **Step 1: ConnexionControleurScreen**

```js
// Supprimer l'import BlurBackground
// Supprimer <BlurBackground /> du JSX
// Remplacer les couleurs de texte :
//   '#FFFFFF' → colors.text
//   'rgba(255,255,255,0.7)' → colors.textSecondary
//   'rgba(255,255,255,0.15)' → 'rgba(0,0,0,0.04)'
//   Icon colors: '#FFFFFF' → colors.text
```

- [ ] **Step 2: ConnexionOrganisateurScreen** — mêmes changements

- [ ] **Step 3: InscriptionOrganisateurScreen** — mêmes changements

- [ ] **Step 4: EnAttenteValidationScreen** — mêmes changements

- [ ] **Step 5: SocialAuthScreen** — adapter les styles (textWhite → text, etc.)

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/auth/
git commit -m "refactor(auth): adapter écrans auth au thème clair"
```

---

### Task 7: Adapter MesTicketsScreen

**Files:**
- Modify: `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **Step 1: Refondre MesTicketsScreen en thème clair**

Changements :
- Supprimer `BlurBackground` et `OrganisateurLayout`
- Fond : `backgroundColor: colors.bg`
- Header : titre "Mes billets" en `colors.text`, back button si dans stack
- Tickets : cards blanches `backgroundColor: colors.surface` avec ombre
- Bandes latérales colorées conservées (selon statut)
- `colors.textWhite` → `colors.text`, `colors.textWhiteMuted` → `colors.textSecondary`

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/MesTicketsScreen.jsx
git commit -m "refactor(mes-tickets): adapter au thème clair"
```

---

### Task 8: Adapter EventDetailScreen

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Step 1: Refondre EventDetailScreen en thème clair**

Changements :
- Supprimer `BlurBackground` → fond blanc
- Hero : image large en haut, infos texte en `colors.text` en dessous
- Section catégorie/prix : card blanche avec ombre (plus de GlassContainer)
- Modals de paiement : fond blanc
- `colors.textWhite` → `colors.text` dans tous les styles
- `colors.textWhiteMuted` → `colors.textSecondary`

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "refactor(event-detail): adapter au thème clair"
```

---

### Task 9: Adapter TicketScreen

**Files:**
- Modify: `mobile/src/screens/TicketScreen.js`

- [ ] **Step 1: Adapter les couleurs du billet**

Changements :
- Fond du screen : `colors.bg` (blanc)
- **La forme visuelle du ticket est conservée** (découpes, arrangement)
- Les couleurs de fond du billet passent en blanc/surface
- Le QR code reste bien contrasté

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/TicketScreen.js
git commit -m "refactor(ticket): adapter couleurs au fond blanc, forme conservée"
```

---

### Task 10: Adapter les écrans organisateur

**Files** (tous dans `mobile/src/screens/organisateur/`) :
- `OrganisateurDashboardScreen.jsx`
- `GestionEvenementsScreen.jsx`
- `DetailEvenementScreen.jsx`
- `VoirTicketsScreen.jsx`
- `StatistiquesScreen.jsx`
- `MesDemandesScreen.jsx`
- `ParametresScreen.jsx`
- `ChangerMotDePasseScreen.jsx`
- `GestionEquipeScreen.jsx`
- `CreerEvenementScreen.jsx`

- [ ] **Step 1: Pour chaque écran**

Changements :
- Supprimer `OrganisateurLayout` (l'import et le JSX `<OrganisateurLayout />`)
- Fond : `backgroundColor: colors.bg`
- Cards : `backgroundColor: colors.surface` + `shadows.md` au lieu de `GlassContainer`
- Textes : `colors.text` / `colors.textSecondary` (déjà le cas pour la plupart)
- Back buttons : `rgba(0,0,0,0.04)` avec icône `colors.text` (déjà le cas)

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/organisateur/
git commit -m "refactor(orga): adapter écrans organisateur au thème clair"
```

---

### Task 11: Adapter les écrans contrôleur

**Files:**
- `mobile/src/screens/ControleurDashboardScreen.jsx`
- `mobile/src/screens/controleur/ScannerScreen.jsx`
- `mobile/src/screens/controleur/ScanHistoryScreen.jsx`

- [ ] **Step 1: Pour chaque écran**

Changements :
- Supprimer `BlurBackground` → fond blanc
- Cards : fond blanc + ombre
- Textes : `colors.text`

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/ControleurDashboardScreen.jsx mobile/src/screens/controleur/
git commit -m "refactor(ctl): adapter écrans contrôleur au thème clair"
```

---

### Task 12: Adapter écrans restants

**Files:**
- `mobile/src/screens/SupportScreen.jsx`
- `mobile/src/screens/NotificationsScreen.js`
- `mobile/src/screens/EventSearchScreen.js`
- `mobile/src/components/GlassContainer.jsx` (optionnel)

- [ ] **Step 1: SupportScreen** — fond blanc, cards blanches, supprimer OrganisateurLayout

- [ ] **Step 2: NotificationsScreen** — fond blanc

- [ ] **Step 3: EventSearchScreen** — adapter au thème clair

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/SupportScreen.jsx mobile/src/screens/NotificationsScreen.js mobile/src/screens/EventSearchScreen.js
git commit -m "refactor: adapter écrans restants au thème clair"
```

---

### Task 13: Nettoyer les composants obsolètes

**Files:**
- `mobile/src/components/OrganisateurLayout.jsx` — supprimer
- `mobile/src/components/FloatingTabBar.jsx` — supprimer (plus utilisé)
- `mobile/src/components/BlurBackground.jsx` — marquer déprécié ou supprimer si inutilisé

- [ ] **Step 1: Vérifier les imports restants**

```bash
grep -rn "OrganisateurLayout\|FloatingTabBar\|BlurBackground" mobile/src/ --include="*.js" --include="*.jsx" | grep -v node_modules
```

- [ ] **Step 2: Supprimer les fichiers et imports orphelins**

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/
git commit -m "chore: supprimer composants obsolètes (OrganisateurLayout, FloatingTabBar)"
```

---

## Spec Coverage Check

| Section spec | Task |
|---|---|
| Palette claire (theme.js) | Task 1 |
| 4 tabs navigation | Task 2 |
| Bypass AccueilChoixScreen | Task 3 |
| Hub compte (ProfilScreen) | Task 4 |
| HomeScreen refonte | Task 5 |
| Auth screens adaptation | Task 6 |
| MesTicketsScreen adaptation | Task 7 |
| EventDetailScreen adaptation | Task 8 |
| TicketScreen adaptation | Task 9 |
| Écrans organisateur | Task 10 |
| Écrans contrôleur | Task 11 |
| Écrans restants | Task 12 |
| Nettoyage composants | Task 13 |
| Carousel conservé | Task 5 (explicit) |
| Forme ticket conservée | Task 9 (explicit) |
| Flow organisateur inchangé | Task 6 (ConnexionOrganisateurScreen) |
