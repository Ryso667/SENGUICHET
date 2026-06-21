# Organizer Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current stack-only `OrganizerDrawer` with a 4-tab bottom navigation (Accueil, Événements, Demandes, Profil) with nested stacks per tab.

**Architecture:** `OrganizerTabs.jsx` wraps a `BottomTabNavigator` containing 4 `NativeStackNavigators` — one per tab. Sub-screens (DetailEvenement, VoirTickets, Notifications, etc.) live in their tab's stack. The style matches the buyer's `MainTabs`.

**Tech Stack:** `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `expo-vector-icons`

---

### Task 1: Create OrganizerTabs.jsx

**Files:**
- Create: `mobile/src/navigation/OrganizerTabs.jsx`

- [ ] **Step 1: Write the file**

```jsx
// Navigation par onglets bas pour l'organisateur connecté
// 4 tabs (Accueil, Événements, Demandes, Profil) avec stacks imbriquées
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SupportScreen from '../screens/SupportScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'
import ChangerMotDePasseScreen from '../screens/organisateur/ChangerMotDePasseScreen'

const Tab = createBottomTabNavigator()
const AccueilStack = createNativeStackNavigator()
const EvenementsStack = createNativeStackNavigator()
const DemandesStack = createNativeStackNavigator()
const ProfilStack = createNativeStackNavigator()

function AccueilNavigator() {
  return (
    <AccueilStack.Navigator screenOptions={{ headerShown: false }}>
      <AccueilStack.Screen name="Dashboard" component={OrganisateurDashboardScreen} />
    </AccueilStack.Navigator>
  )
}

function EvenementsNavigator() {
  const { colors } = useTheme()
  const header = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
  }
  return (
    <EvenementsStack.Navigator screenOptions={{ headerShown: false }}>
      <EvenementsStack.Screen name="Evenements" component={GestionEvenementsScreen} />
      <EvenementsStack.Screen name="DetailEvenement" component={DetailEvenementScreen} options={{ ...header, headerShown: true, title: 'Détails' }} />
      <EvenementsStack.Screen name="VoirTickets" component={VoirTicketsScreen} options={{ ...header, headerShown: true, title: 'Billets' }} />
      <EvenementsStack.Screen name="Statistiques" component={StatistiquesScreen} options={{ ...header, headerShown: true, title: 'Statistiques' }} />
    </EvenementsStack.Navigator>
  )
}

function DemandesNavigator() {
  const { colors } = useTheme()
  const header = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
  }
  return (
    <DemandesStack.Navigator screenOptions={{ headerShown: false }}>
      <DemandesStack.Screen name="Demandes" component={MesDemandesScreen} />
    </DemandesStack.Navigator>
  )
}

function ProfilNavigator() {
  const { colors } = useTheme()
  const header = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
  }
  return (
    <ProfilStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfilStack.Screen name="Profil" component={ParametresScreen} />
      <ProfilStack.Screen name="Notifications" component={NotificationsScreen} options={{ ...header, headerShown: true, title: 'Notifications' }} />
      <ProfilStack.Screen name="Support" component={SupportScreen} options={{ ...header, headerShown: true, title: 'Support' }} />
      <ProfilStack.Screen name="ChangerMotDePasse" component={ChangerMotDePasseScreen} options={{ headerShown: false }} />
    </ProfilStack.Navigator>
  )
}

export default function OrganizerTabs() {
  const { colors } = useTheme()
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
            fontFamily: fonts.jakarta.semiBold || 'PlusJakartaSans_600SemiBold',
            marginTop: 0,
          },
        }}
      >
        <Tab.Screen
          name="Accueil"
          component={AccueilNavigator}
          options={{
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Evenements"
          component={EvenementsNavigator}
          options={{
            tabBarLabel: 'Événements',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-month" size={21} color={color} />,
          }}
        />
        <Tab.Screen
          name="Demandes"
          component={DemandesNavigator}
          options={{
            tabBarLabel: 'Demandes',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document-outline" size={21} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfilNavigator}
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
          }}
        />
      </Tab.Navigator>
    </TabBarScrollProvider>
  )
}
```

- [ ] **Step 2: Verify file was created**

Run: `Test-Path -LiteralPath "mobile/src/navigation/OrganizerTabs.jsx"`
Expected: `True`

---

### Task 2: Update AppNavigator.js

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Replace import**

Replace:
```js
import OrganizerDrawer from './OrganizerDrawer'
```
With:
```js
import OrganizerTabs from './OrganizerTabs'
```

- [ ] **Step 2: Replace usage**

Replace:
```js
{role === 'organisateur' && <OrganizerDrawer />}
```
With:
```js
{role === 'organisateur' && <OrganizerTabs />}
```

---

### Task 3: Remove "Navigation rapide" from Dashboard

**Files:**
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] **Step 1: Remove nav section from JSX**

Remove the `glassContainer navSection` block inside the render (from `{/* Navigation rapide */}` comment through the closing `</GlassContainer>` tag before the `{/* Section événements récents */}` section).

Lines to remove: the block starting at the `navSection` GlassContainer (around line 142) to its closing tag (around line 166).

- [ ] **Step 2: Remove nav-related styles**

Remove these keys from the `makeStyles` StyleSheet:
- `navSection`
- `navTitle`
- `navGrid`
- `navItem`
- `navIcon`
- `navLabel`

- [ ] **Step 3: Remove unused imports**

Remove `hexToRgba` from the import line if it's only used by the nav section styles. Check first — if it's used elsewhere in the file (statut config, nav section), keep it.

---

### Task 4: Remove OrganizerDrawer.jsx

**Files:**
- Delete: `mobile/src/navigation/OrganizerDrawer.jsx`

- [ ] **Step 1: Remove the file**

Run: `Remove-Item -LiteralPath "mobile/src/navigation/OrganizerDrawer.jsx"`

- [ ] **Step 2: Verify removal**

Run: `Test-Path -LiteralPath "mobile/src/navigation/OrganizerDrawer.jsx"`
Expected: `False`

---

### Self-review

- Spec coverage: ✅ Architecture (bottom tabs + nested stacks), ✅ 4 tabs (Accueil, Événements, Demandes, Profil), ✅ Style matching MainTabs, ✅ Remove navigation rapide, ✅ Remove OrganizerDrawer
- No placeholders, TBDs, or TODOs
- Type consistency: all imports match existing screen paths
