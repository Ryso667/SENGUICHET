# Navigation par rôle (Drawer) + Push Notifications — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les tabs acheteur par un drawer hamburger quand on est connecté en tant qu'organisateur ou contrôleur, et ajouter des notifications push pour les nouvelles ventes.

**Architecture:** Le `AppNavigator` détecte le rôle via `AuthContext` et rend soit `MainTabs` (guest/acheteur), soit `OrganizerDrawer`, soit `ControllerDrawer`. Chaque item du drawer a son propre `NativeStackNavigator`. Les notifications push utilisent `expo-notifications` côté mobile et l'Expo Push API côté backend.

**Tech Stack:** React Navigation (Drawer + NativeStack), Expo Notifications, Expo Server SDK, TiDB MySQL

---

## Fichiers concernés

### Créer
- `mobile/src/components/DrawerContent.jsx` — Composant custom du drawer (avatar, items, badge, déconnexion)
- `mobile/src/navigation/OrganizerDrawer.jsx` — Drawer navigator pour l'organisateur
- `mobile/src/navigation/ControllerDrawer.jsx` — Drawer navigator pour le contrôleur
- `mobile/src/services/notificationService.js` — Service push côté mobile
- `backend/services/NotificationService.js` — Service push côté backend
- `backend/api/notifications.js` — Routes API notifications/tokens

### Modifier
- `mobile/src/navigation/AppNavigator.js` — Bascule role→drawer
- `mobile/src/screens/ProfilScreen.jsx` — Retirer sections orga/controleur
- `mobile/src/screens/NotificationsScreen.js` — Remplacer placeholder par vraie liste
- `backend/api/billets.js` — Ajouter envoi notification après achat
- `backend/db/migrate.js` — Ajouter tables `push_tokens` et `notifications`

### Installer
- `mobile/`: `@react-navigation/drawer`, `expo-notifications`, `react-native-reanimated`
- `backend/`: `expo-server-sdk`

---

## Phase 1 — Drawer Navigation (mobile uniquement)

### Task 1: Installer les dépendances Drawer

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Install packages**

```bash
cd mobile
npx expo install @react-navigation/drawer react-native-reanimated expo-notifications
```

- [ ] **Step 2: Ajouter reanimated au babel.config.js**

Verify `mobile/babel.config.js` already has `'react-native-reanimated/plugin'` as the last plugin. If not, add it:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: install drawer and notifications dependencies"
```

---

### Task 2: Créer DrawerContent custom

**Files:**
- Create: `mobile/src/components/DrawerContent.jsx`

- [ ] **Step 1: Create DrawerContent component**

```jsx
// Composant DrawerContent — affiché dans le drawer hamburger
// Affiche l'avatar, nom, email de l'utilisateur + la liste des sections
// Supporte les badges de notifications (compteur non-lues)
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// items = [{ label, icon, route, badge? }]
export default function DrawerContent({ items, navigation }) {
  const insets = useSafeAreaInsets()
  const { email, deconnecter } = useAuth()

  const handlePress = (item) => {
    if (item.route === 'Deconnexion') {
      deconnecter()
      return
    }
    navigation.navigate(item.route)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header utilisateur */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={28} color={colors.primary} />
        </View>
        <Text style={styles.nom} numberOfLines={1}>{email || 'Utilisateur'}</Text>
      </View>

      <View style={styles.divider} />

      {/* Navigation items */}
      <View style={styles.menu}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <Feather name={item.icon} size={20} color={item.danger ? colors.danger : colors.text} />
            <Text style={[styles.menuLabel, item.danger && { color: colors.danger }]}>
              {item.label}
            </Text>
            {item.badge != null && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, alignItems: 'center' },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  nom: {
    fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text,
    textAlign: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  menu: { paddingVertical: spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1, fontFamily: fonts.jakarta.semiBold, fontSize: 15, color: colors.text,
  },
  badge: {
    backgroundColor: colors.red, borderRadius: borderRadius.full,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.jakarta.bold },
})
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add DrawerContent component"
```

---

### Task 3: Créer OrganizerDrawer

**Files:**
- Create: `mobile/src/navigation/OrganizerDrawer.jsx`

- [ ] **Step 1: Create OrganizerDrawer**

```jsx
// Drawer navigator pour l'organisateur connecté
// Remplace les tabs acheteur par un menu hamburger
// Chaque item a son propre NativeStackNavigator
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DrawerContent from '../components/DrawerContent'

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SupportScreen from '../screens/SupportScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()
const screenOptions = { headerShown: false, animation: 'slide_from_right' }

// Usine à stacks simples (composant → stack avec un seul écran)
function SimpleStack(Component) {
  return function StackWrapper() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={Component} />
      </Stack.Navigator>
    )
  }
}

// Dashboard peut naviguer vers DetailEvenement → VoirTickets
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={OrganisateurDashboardScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

// Événements peut naviguer vers DetailEvenement → VoirTickets
function EvenementsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EvenementsList" component={GestionEvenementsScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

const DRAWER_ITEMS = [
  { label: 'Dashboard', icon: 'layout', route: 'Dashboard' },
  { label: 'Événements', icon: 'calendar', route: 'Evenements' },
  { label: 'Statistiques', icon: 'bar-chart-2', route: 'Statistiques' },
  { label: 'Demandes', icon: 'file-text', route: 'Demandes' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications' },
  { label: 'Support', icon: 'headphones', route: 'Support' },
  { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
]

export default function OrganizerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent items={DRAWER_ITEMS} {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardStack} />
      <Drawer.Screen name="Evenements" component={EvenementsStack} />
      <Drawer.Screen name="Statistiques" component={SimpleStack(StatistiquesScreen)} />
      <Drawer.Screen name="Demandes" component={SimpleStack(MesDemandesScreen)} />
      <Drawer.Screen name="Notifications" component={SimpleStack(NotificationsScreen)} />
      <Drawer.Screen name="Support" component={SimpleStack(SupportScreen)} />
    </Drawer.Navigator>
  )
}
```
// Drawer navigator pour l'organisateur connecté
// Remplace les tabs acheteur par un menu hamburger
// Chaque item a son propre NativeStackNavigator
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DrawerContent from '../components/DrawerContent'

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import MesDemandesScreen from '../screens/organisateur/MesDemandesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SupportScreen from '../screens/SupportScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()

const screenOptions = { headerShown: false, animation: 'slide_from_right' }

const DRAWER_ITEMS = [
  { label: 'Dashboard', icon: 'layout', route: 'Dashboard' },
  { label: 'Événements', icon: 'calendar', route: 'Evenements' },
  { label: 'Statistiques', icon: 'bar-chart-2', route: 'Statistiques' },
  { label: 'Demandes', icon: 'file-text', route: 'Demandes' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications' },
  { label: 'Support', icon: 'headphones', route: 'Support' },
  { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
]

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={OrganisateurDashboardScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

function EvenementsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EvenementsList" component={GestionEvenementsScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

function SimpleStack(Component) {
  return function StackWrapper() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={Component} />
      </Stack.Navigator>
    )
  }
}

export default function OrganizerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent items={DRAWER_ITEMS} {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: false,
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardStack} />
      <Drawer.Screen name="Evenements" component={EvenementsStack} />
      <Drawer.Screen name="Statistiques" component={SimpleStack(StatistiquesScreen)} />
      <Drawer.Screen name="Demandes" component={SimpleStack(MesDemandesScreen)} />
      <Drawer.Screen name="Notifications" component={SimpleStack(NotificationsScreen)} />
      <Drawer.Screen name="Support" component={SimpleStack(SupportScreen)} />
    </Drawer.Navigator>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add OrganizerDrawer navigator"
```

---

### Task 4: Créer ControllerDrawer

**Files:**
- Create: `mobile/src/navigation/ControllerDrawer.jsx`

- [ ] **Step 1: Create ControllerDrawer**

```jsx
// Drawer navigator pour le contrôleur connecté
// Remplace les tabs acheteur par un menu hamburger avec Scanner + Historique
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DrawerContent from '../components/DrawerContent'
import ControleurDashboardScreen from '../screens/controleur/ControleurDashboardScreen'
import ScannerScreen from '../screens/controleur/ScannerScreen'
import ScanHistoryScreen from '../screens/controleur/ScanHistoryScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()
const screenOptions = { headerShown: false, animation: 'slide_from_right' }

const DRAWER_ITEMS = [
  { label: 'Accueil', icon: 'home', route: 'Accueil' },
  { label: 'Scanner', icon: 'camera', route: 'Scanner' },
  { label: 'Historique', icon: 'clock', route: 'Historique' },
  { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
]

function SimpleStack(Component) {
  return function StackWrapper() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={Component} />
      </Stack.Navigator>
    )
  }
}

export default function ControllerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent items={DRAWER_ITEMS} {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Accueil" component={SimpleStack(ControleurDashboardScreen)} />
      <Drawer.Screen name="Scanner" component={SimpleStack(ScannerScreen)} />
      <Drawer.Screen name="Historique" component={SimpleStack(ScanHistoryScreen)} />
    </Drawer.Navigator>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ControllerDrawer navigator"
```

---

### Task 5: Mettre à jour AppNavigator

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Update AppNavigator to switch navigation based on role**

Replace the current export with role-based rendering:

```jsx
// Navigation principale
// Guest/Acheteur : 4 tabs (Accueil, Explorer, Mes billets, Compte)
// Organisateur   : Drawer hamburger (Dashboard, Événements, ...)
// Contrôleur     : Drawer hamburger (Scanner, Historique, ...)
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'
import { TabBarScrollProvider } from '../context/TabBarScrollContext'

import HomeScreen from '../screens/HomeScreen'
import EventSearchScreen from '../screens/EventSearchScreen'
import MesTicketsScreen from '../screens/MesTicketsScreen'
import ProfilScreen from '../screens/ProfilScreen'

import SocialAuthScreen from '../screens/auth/SocialAuthScreen'
import ConnexionControleurScreen from '../screens/auth/ConnexionControleurScreen'
import ConnexionOrganisateurScreen from '../screens/auth/ConnexionOrganisateurScreen'
import InscriptionOrganisateurScreen from '../screens/auth/InscriptionOrganisateurScreen'
import EnAttenteValidationScreen from '../screens/auth/EnAttenteValidationScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketScreen from '../screens/TicketScreen'
import SupportScreen from '../screens/SupportScreen'
import WebViewWaveScreen from '../screens/WebViewWaveScreen'
import NotificationsScreen from '../screens/NotificationsScreen'

import OrganizerDrawer from './OrganizerDrawer'
import ControllerDrawer from './ControllerDrawer'

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
          fontFamily: fonts.jakarta.semiBold || 'PlusJakartaSans_600SemiBold',
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
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={20} color={color} />,
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

const headerStyle = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text },
  headerTintColor: colors.accent,
  headerBackTitle: 'Retour',
}
const header = (titre) => ({ ...headerStyle, headerTitle: titre })

function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      animation: 'slide_from_right',
      animationDuration: 250,
    }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="SocialAuth" component={SocialAuthScreen} />
      <Stack.Screen name="ConnexionControleur" component={ConnexionControleurScreen} options={header('Connexion')} />
      <Stack.Screen name="ConnexionOrganisateur" component={ConnexionOrganisateurScreen} options={header('Connexion')} />
      <Stack.Screen name="InscriptionOrganisateur" component={InscriptionOrganisateurScreen} options={header('Inscription')} />
      <Stack.Screen name="EnAttenteValidation" component={EnAttenteValidationScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Ticket" component={TicketScreen} />
      <Stack.Screen name="WebViewWave" component={WebViewWaveScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={SupportScreen} options={header('Support')} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={header('Notifications')} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { role, chargement } = useAuth()

  if (chargement) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!role && <GuestNavigator />}
      {role === 'organisateur' && <OrganizerDrawer />}
      {role === 'controleur' && <ControllerDrawer />}
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
git add -A
git commit -m "feat: role-based navigation (tabs vs drawer)"
```

---

### Task 6: Nettoyer ProfilScreen

**Files:**
- Modify: `mobile/src/screens/ProfilScreen.jsx`

- [ ] **Step 1: Remove organizer/controller sections from ProfilScreen**

Since organisateurs et contrôleurs ont leur propre drawer, ProfilScreen ne doit plus gérer ces états. Supprimer les blocs `estControleur` et `estOrganisateur`. Garder uniquement invité et acheteur connecté.

```jsx
export default function ProfilScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { role, email, deconnecter } = useAuth()
  const estAcheteur = role === 'acheteur'
  const nomAffiche = email || 'Utilisateur'

  if (!role) {
    // Guest : boutons connexion/inscription (inchangé)
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <View style={styles.avatar}>
              <Feather name="user" size={32} color={colors.primary} />
            </View>
            <Text style={styles.titre}>Compte</Text>
            <Text style={styles.sousTitre}>Connecte-toi pour accéder à tes billets</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SocialAuth')}>
            <Feather name="log-in" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Se connecter</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InscriptionOrganisateur')}>
            <Feather name="user-plus" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Créer un compte organisateur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Déjà un code contrôleur ?</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionControleur')}>
            <Feather name="shield" size={20} color={colors.accent} />
            <Text style={styles.actionBtnText}>Mode contrôleur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  if (estAcheteur) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Feather name="user" size={28} color={colors.primary} />
            </View>
            <Text style={styles.titre}>{nomAffiche}</Text>
            <Text style={styles.sousTitre}>Acheteur</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MesTickets')}>
            <Ionicons name="ticket-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Mes billets</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionOrganisateur')}>
            <Feather name="briefcase" size={20} color={colors.accent} />
            <Text style={styles.actionBtnText}>Espace organisateur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Support')}>
            <Feather name="headphones" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Support</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={deconnecter}>
            <Feather name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // Si role === organisateur ou controleur (fallback, ne devrait pas arriver)
  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor: simplify ProfilScreen (guest/acheteur only)"
```

---

## Phase 2 — Push Notifications (Backend)

### Task 7: Ajouter les tables push_tokens et notifications

**Files:**
- Modify: `backend/db/migrate.js`

- [ ] **Step 1: Ajouter les CREATE TABLE dans migrate.js**

Ajouter après la création des tables existantes :

```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organisateur_id) REFERENCES organisateurs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  evenement_id INT,
  type VARCHAR(50) NOT NULL DEFAULT 'vente',
  message TEXT NOT NULL,
  lue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organisateur_id) REFERENCES organisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (evenement_id) REFERENCES evenements(id) ON DELETE SET NULL
);
```

- [ ] **Step 2: Run migration**

```bash
cd backend
node db/migrate.js
```

Expected: "Migration terminée avec succès"

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add push_tokens and notifications tables"
```

---

### Task 8: Créer NotificationService

**Files:**
- Create: `backend/services/NotificationService.js`

- [ ] **Step 1: Create NotificationService**

```js
// Service d'envoi de notifications (push Expo + base de données)
// Envoie une notification push à tous les tokens d'un organisateur
// et persiste la notification dans la table notifications
const db = require('../config/db')
const { Expo } = require('expo-server-sdk')
const expo = new Expo()

// Envoie une notification push Expo et l'enregistre en base
// @param {number} organisateurId - ID de l'organisateur destinataire
// @param {object} data - { type, message, evenementId }
exports.envoyerNotification = async (organisateurId, data) => {
  try {
    // Persister en base
    const [result] = await db.query(
      `INSERT INTO notifications (organisateur_id, evenement_id, type, message)
       VALUES (?, ?, ?, ?)`,
      [organisateurId, data.evenementId || null, data.type, data.message]
    )
    const notificationId = result.insertId

    // Récupérer les tokens push de l'organisateur
    const [tokens] = await db.query(
      'SELECT token FROM push_tokens WHERE organisateur_id = ?',
      [organisateurId]
    )

    // Envoyer via Expo Push API
    const messages = []
    for (const row of tokens) {
      if (!Expo.isExpoPushToken(row.token)) continue
      messages.push({
        to: row.token,
        sound: 'default',
        title: 'Nouvelle vente',
        body: data.message,
        data: { evenementId: data.evenementId, notificationId },
      })
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages)
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk)
      }
    }

    return notificationId
  } catch (err) {
    console.error('Erreur NotificationService:', err.message)
  }
}
```

- [ ] **Step 2: Install expo-server-sdk**

```bash
cd backend
npm install expo-server-sdk
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add NotificationService (Expo push)"
```

---

### Task 9: Créer les routes API notifications

**Files:**
- Create: `backend/api/notifications.js`

- [ ] **Step 1: Create notifications API**

```js
// Routes API pour les notifications push et les tokens
// POST /api/notifications/register-token — enregistrer un token push
// POST /api/notifications/unregister-token — supprimer un token
// GET /api/notifications — lister les notifications de l'organisateur
// PUT /api/notifications/:id/lire — marquer comme lue
// PUT /api/notifications/lire-tout — tout marquer
// GET /api/notifications/non-lues — compteur (pour badge)
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const { verifierToken } = require('../middleware/authMiddleware')

// Middleware : seule un organisateur connecté peut gérer ses notifications
router.use(verifierToken('organisateur'))

// Enregistrer un token push
router.post('/register-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ erreur: 'Token requis' })

    const organisateurId = req.utilisateur.id
    // Éviter les doublons
    const [existant] = await db.query(
      'SELECT id FROM push_tokens WHERE token = ? AND organisateur_id = ?',
      [token, organisateurId]
    )
    if (existant.length === 0) {
      await db.query(
        'INSERT INTO push_tokens (organisateur_id, token) VALUES (?, ?)',
        [organisateurId, token]
      )
    }
    res.json({ succes: true })
  } catch (err) {
    console.error('Erreur register-token:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Supprimer un token push (déconnexion)
router.post('/unregister-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ erreur: 'Token requis' })
    await db.query('DELETE FROM push_tokens WHERE token = ? AND organisateur_id = ?', [
      token, req.utilisateur.id,
    ])
    res.json({ succes: true })
  } catch (err) {
    console.error('Erreur unregister-token:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Lister les notifications (les plus récentes d'abord)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.id, n.type, n.message, n.lue, n.created_at,
              e.titre as evenement_titre
       FROM notifications n
       LEFT JOIN evenements e ON n.evenement_id = e.id
       WHERE n.organisateur_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.utilisateur.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('Erreur liste notifications:', err.message)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Marquer une notification comme lue
router.put('/:id/lire', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lue = TRUE WHERE id = ? AND organisateur_id = ?',
      [req.params.id, req.utilisateur.id]
    )
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Tout marquer comme lu
router.put('/lire-tout', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lue = TRUE WHERE organisateur_id = ?',
      [req.utilisateur.id]
    )
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// Compter les notifications non lues (pour le badge)
router.get('/non-lues', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE organisateur_id = ? AND lue = FALSE',
      [req.utilisateur.id]
    )
    res.json({ total: rows[0].total })
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

module.exports = router
```

- [ ] **Step 2: Enregistrer les routes dans l'application Express**

Trouver le fichier principal (ex: `backend/index.js` ou `backend/app.js`) et ajouter :

```js
const notificationsRoutes = require('./api/notifications')
app.use('/api/notifications', notificationsRoutes)
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add notifications API routes"
```

---

### Task 10: Hook notification dans le flux d'achat

**Files:**
- Modify: `backend/api/billets.js`

- [ ] **Step 1: Ajouter l'appel à NotificationService après un achat réussi**

Dans la route `POST /acheter`, après l'insertion réussie du billet et avant de répondre, ajouter :

```js
const { envoyerNotification } = require('../services/NotificationService')

// Dans le bloc try, après validation du paiement :
envoyerNotification(evenement.organisateur_id, {
  type: 'vente',
  message: `Nouvelle vente : ${categorie.nom} pour ${evenement.titre}`,
  evenementId: evenement.id,
})
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: send push notification on ticket purchase"
```

---

## Phase 3 — Push Notifications (Mobile)

### Task 11: Créer le service notifications côté mobile

**Files:**
- Create: `mobile/src/services/notificationService.js`

- [ ] **Step 1: Create notification service**

```js
// Service de notifications push côté mobile
// Gère l'enregistrement du token Expo, la récupération des notifications,
// et le compteur de non-lues
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { appelAPI } from './apiService'
import * as Securite from '../utils/secureStorage'

// Configure le comportement des notifications reçues (son, alert, badge)
export async function configurerNotifications() {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }
}

// Demande la permission et récupère le token Expo push
export async function obtenirTokenPush() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  const tokenData = await Notifications.getExpoPushTokenAsync()
  return tokenData.data
}

// Enregistre le token push sur le backend
export async function enregistrerToken(token) {
  try {
    await appelAPI('/notifications/register-token', {
      method: 'POST',
      body: { token },
    })
    await Securite.SET('push_token', token)
  } catch (err) {
    console.error('Erreur enregistrement token push:', err.message)
  }
}

// Supprime le token push sur le backend (déconnexion)
export async function supprimerToken() {
  try {
    const token = await Securite.GET('push_token')
    if (token) {
      await appelAPI('/notifications/unregister-token', {
        method: 'POST',
        body: { token },
      })
      await Securite.SUPPRIMER('push_token')
    }
  } catch (err) {
    console.error('Erreur suppression token push:', err.message)
  }
}

// Récupère la liste des notifications
export async function fetchNotifications() {
  const data = await appelAPI('/notifications')
  return data
}

// Récupère le compteur de non-lues
export async function fetchCompteurNonLues() {
  const data = await appelAPI('/notifications/non-lues')
  return data.total || 0
}

// Marque une notification comme lue
export async function marquerLue(id) {
  await appelAPI(`/notifications/${id}/lire`, { method: 'PUT' })
}

// Marque tout comme lu
export async function marquerToutLu() {
  await appelAPI('/notifications/lire-tout', { method: 'PUT' })
}

// Ajoute un listener pour les notifications reçues quand l'app est ouverte
export function ajouterListenerNotification(callback) {
  const subscription = Notifications.addNotificationReceivedListener(callback)
  return subscription
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add mobile notification service"
```

---

### Task 12: Enregistrer le token push au login organisateur

**Files:**
- Modify: `mobile/src/context/AuthContext.jsx`

- [ ] **Step 1: Appeler configurerNotifications et enregistrer token après login**

Dans la fonction `connecterOrganisateur`, après avoir stocké le JWT et l'user, ajouter :

```js
import { configurerNotifications, obtenirTokenPush, enregistrerToken, supprimerToken } from '../services/notificationService'
```

Dans `connecterOrganisateur` (après le stockage JWT) :
```js
// Enregistrer le token push pour les notifications
configurerNotifications()
const pushToken = await obtenirTokenPush()
if (pushToken) await enregistrerToken(pushToken)
```

Dans `deconnecter`, avant le cleanup :
```js
await supprimerToken()
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: register push token on organizer login"
```

---

### Task 13: Refondre NotificationsScreen

**Files:**
- Modify: `mobile/src/screens/NotificationsScreen.js`

- [ ] **Step 1: Remplacer le placeholder par la vraie liste**

```js
// Écran des notifications organisateur
// Affiche la liste des notifications (nouvelles ventes, etc.)
// Pull-to-refresh, marquer comme lue, compteur de non-lues
import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { fetchNotifications, marquerLue, marquerToutLu } from '../services/notificationService'
import { useFocusEffect } from '@react-navigation/native'

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Erreur chargement notifications:', err.message)
    } finally {
      setChargement(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { charger() }, [charger]))

  const handleRefresh = () => { setRefreshing(true); charger() }

  const handlePress = async (item) => {
    if (!item.lue) {
      await marquerLue(item.id)
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, lue: true } : n)
      )
    }
    if (item.evenement_id) {
      navigation.navigate('DetailEvenement', { id: item.evenement_id })
    }
  }

  const handleToutLu = async () => {
    await marquerToutLu()
    setNotifications(prev => prev.map(n => ({ ...n, lue: true })))
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.lue && styles.notifNonLue]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.notifIcon}>
        <Feather name={item.type === 'vente' ? 'shopping-bag' : 'bell'} size={18} color={colors.primary} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, !item.lue && styles.notifMessageNonLue]}>
          {item.message}
        </Text>
        <Text style={styles.notifDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
      {!item.lue && <View style={styles.dot} />}
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.titre}>Notifications</Text>
        {notifications.some(n => !n.lue) && (
          <TouchableOpacity onPress={handleToutLu}>
            <Text style={styles.toutLu}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {chargement ? (
        <View style={styles.center}>
          <Feather name="bell" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bell-off" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.text },
  toutLu: { fontFamily: fonts.jakarta.semiBold, fontSize: 13, color: colors.accent },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md,
    marginBottom: spacing.sm, gap: spacing.md,
  },
  notifNonLue: { backgroundColor: colors.primaryLight },
  notifIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifMessage: { fontFamily: fonts.jakarta.regular, fontSize: 14, color: colors.text, marginBottom: 2 },
  notifMessageNonLue: { fontFamily: fonts.jakarta.semiBold },
  notifDate: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.textTertiary },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { fontFamily: fonts.jakarta.regular, fontSize: 15, color: colors.textTertiary },
})
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: implement NotificationsScreen with real data"
```

---

### Task 14: Ajouter le badge de notifications dans le drawer

**Files:**
- Modify: `mobile/src/components/DrawerContent.jsx`
- Modify: `mobile/src/navigation/OrganizerDrawer.jsx`

- [ ] **Step 1: Ajouter un contexte ou prop pour le compteur non-lues**

Le plus simple : passer le compteur comme prop dans les items via un state/effect dans OrganizerDrawer :

```jsx
// Dans OrganizerDrawer.jsx — ajouter un state pour le badge notifications
import { useState, useEffect, useCallback } from 'react'
import { fetchCompteurNonLues } from '../services/notificationService'
import { useFocusEffect } from '@react-navigation/native'

export default function OrganizerDrawer() {
  const [nbNonLues, setNbNonLues] = useState(0)

  useFocusEffect(useCallback(() => {
    let actif = true
    const charger = async () => {
      try {
        const total = await fetchCompteurNonLues()
        if (actif) setNbNonLues(total)
      } catch {}
    }
    charger()
    // Re-vérifier toutes les 30 secondes
    const interval = setInterval(charger, 30000)
    return () => { actif = false; clearInterval(interval) }
  }, []))

  const items = [
    { label: 'Dashboard', icon: 'layout', route: 'Dashboard' },
    { label: 'Événements', icon: 'calendar', route: 'Evenements' },
    { label: 'Statistiques', icon: 'bar-chart-2', route: 'Statistiques' },
    { label: 'Demandes', icon: 'file-text', route: 'Demandes' },
    { label: 'Notifications', icon: 'bell', route: 'Notifications', badge: nbNonLues },
    { label: 'Support', icon: 'headphones', route: 'Support' },
    { label: 'Déconnexion', icon: 'log-out', route: 'Deconnexion', danger: true },
  ]

  return (
    ...
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add notification badge to drawer"
```
