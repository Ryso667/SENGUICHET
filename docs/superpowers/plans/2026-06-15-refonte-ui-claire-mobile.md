# Refonte UI Claire — Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte complète de l'UI mobile SENGUICHET : thème clair, navigation 4 tabs, header propre, arrivée directe sur les événements.

**Architecture:** On garde la structure 3 rôles existante, mais le rôle par défaut (pas de rôle) affiche directement la stack acheteur avec la nouvelle HomeScreen claire. Bottom nav 4 onglets remplace `tabBar={() => null}`. Theme.js est réécrit en clair. La logique métier (auth, achat, scan) n'est pas touchée.

**Tech Stack:** Expo SDK 56, React Native 0.86, React Navigation 7, Feather/MaterialIcons icons

---

### Task 1: Réécrire theme.js en thème clair

**Files:**
- Modify: `mobile/src/constants/theme.js` (full rewrite)
- The colors export is used by ALL screens — ce changement affecte toute l'app

- [ ] **Step 1: Remplacer colors par la palette claire**

```js
// === COULEURS — thème clair ===
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
  violet: '#7C3AED',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  cyan: '#06B6D4',
  glassWhite: 'rgba(255,255,255,0.8)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassDark: 'rgba(0,0,0,0.04)',
  inputBg: '#F3F4F6',
  inputBorder: 'transparent',
  inputBorderFocus: '#1A56DB',
  textWhite: '#111827',
  textWhiteMuted: '#6B7280',
  slate: '#1E293B',
  mid: '#6B7280',
  muted: '#9CA3AF',
  placeholder: '#9CA3AF',
  navInactive: '#9CA3AF',
  navActive: '#1A56DB',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
}
```

- [ ] **Step 2: Remplacer glass par thème clair**

```js
export const glass = {
  bg: 'rgba(255,255,255,0.8)',
  bgLight: 'rgba(255,255,255,0.6)',
  bgHeavy: 'rgba(255,255,255,0.95)',
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.03)',
  blur: 20,
  radius: 16,
  darkBg: 'rgba(0,0,0,0.03)',
  darkBgHeavy: 'rgba(0,0,0,0.06)',
}
```

- [ ] **Step 3: Remplacer gradients**

```js
export const gradients = {
  primary: ['#1A56DB', '#2563EB'],
  organisateur: ['#1A56DB', '#2563EB'],
  success: ['#10B981', '#059669'],
  error: ['#EF4444', '#DC2626'],
}
```

- [ ] **Step 4: Remplacer shadows pour le thème clair**

```js
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
}
```

- [ ] **Step 5: Supprimer textShadow (plus nécessaire sur fond clair)**

Supprimer tout l'export `textShadow`.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/constants/theme.js
git commit -m "refactor(theme): thème clair — palette blanc/bleu (#1A56DB)"
```

---

### Task 2: Refondre AppNavigator — arrivée directe sur les événements

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js` (full rewrite of navigation logic + acheteur tabs)

- [ ] **Step 1: Modifier la logique d'entrée par défaut**

Remplacer le `resetNav` qui pointe vers `AccueilChoix` quand pas de rôle :
Au lieu de rediriger vers `AccueilChoix`, rediriger vers `AcheteurTabs` par défaut.

```js
const resetNav = useCallback(() => {
  if (!navigationRef.current?.isReady()) return
  if (role) {
    const routeName = role === 'acheteur' ? 'AcheteurTabs'
      : role === 'controleur' ? 'ControleurTabs'
      : 'OrganisateurTabs'
    navigationRef.current.reset({ index: 0, routes: [{ name: routeName }] })
  } else {
    navigationRef.current.reset({ index: 0, routes: [{ name: 'AcheteurTabs' }] })
  }
}, [role])
```

- [ ] **Step 2: Ajouter les 4 onglets acheteur avec vraie bottom bar**

Remplacer le `AcheteurTabs` :

```js
function AcheteurTabs() {
  return (
    <TabBarScrollProvider>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navActive,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
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
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="EventSearch"
        component={EventSearchScreen}
        options={{
          tabBarLabel: 'Recherche',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, size }) => <Feather name="bell" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Compte',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
    </TabBarScrollProvider>
  )
}
```

- [ ] **Step 3: Créer NotificationsScreen placeholder**

Create `mobile/src/screens/NotificationsScreen.js` :

```js
// Écran Notifications — placeholder pour la refonte UI
import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, fonts } from '../constants/theme'

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Feather name="bell" size={48} color={colors.muted} />
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Aucune notification pour le moment</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20, fontFamily: fonts.outfit.bold,
    color: colors.text, marginTop: 16,
  },
  subtitle: {
    fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary, marginTop: 8, textAlign: 'center',
  },
})
```

- [ ] **Step 4: Retirer AccueilChoix du Stack.Navigator et le garder accessible**

Remplacer `AccueilChoix` comme écran par défaut — le garder dans le Stack mais plus comme route de démarrage.

```js
{/* Retirer comme route initiale : l'écran par défaut est maintenant AcheteurTabs */}
{/* AccueilChoix reste accessible depuis le profil */}
<Stack.Screen name="AccueilChoix" component={AccueilChoixScreen} />
```

- [ ] **Step 5: Supprimer les imports devenus inutiles**

Vérifier que les imports de `AccueilChoixScreen`, `SocialAuthScreen`, `ConnexionControleurScreen`, etc. restent car ils sont encore référencés dans le Stack.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/navigation/AppNavigator.js mobile/src/screens/NotificationsScreen.js
git commit -m "feat(nav): arrivée directe sur événements + bottom nav 4 onglets"
```

---

### Task 3: Refondre HomeScreen en version claire

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js` (full rewrite)

- [ ] **Step 1: Remplacer le contenu complet du HomeScreen**

Le nouveau HomeScreen suit l'ordre : Header → Search → Categories → "À la une" (EventCarousel conservé) → "Tous les événements"

```js
// Écran d'accueil — thème clair
// Affiche directement les événements disponibles
// Header : logo + icône profil + Contact
// Search bar, filtres catégories, carousel à la une, liste verticale
import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, FlatList, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts, spacing, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import EventCarousel from '../components/EventCarousel'
import Skeleton from '../components/Skeleton'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Théâtre', 'Conférence', 'Atelier']

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { email, deconnecter } = useAuth()
  const [evenements, setEvenements] = useState([])
  const [categorieActive, setCategorieActive] = useState('Tout')
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setChargement(true)
      try {
        const events = await fetchEvenementsPublics()
        const formatted = events.map(formaterPourEventCard)
        setEvenements(formatted)
      } catch (e) {
        console.warn('[Home] Erreur chargement:', e)
      } finally {
        setChargement(false)
      }
    })
    return unsubscribe
  }, [navigation])

  const evenementsFiltres = evenements.filter(ev => {
    const matchCategorie = categorieActive === 'Tout' || ev.category === categorieActive
    const matchRecherche = !recherche || ev.title.toLowerCase().includes(recherche.toLowerCase())
    return matchCategorie && matchRecherche
  })

  const une = evenementsFiltres.slice(0, 5)
  const tous = evenementsFiltres.slice(5)

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      activeOpacity={0.7}
    >
      <View style={styles.eventCardImage}>
        <View style={[styles.eventCardImgBg, { backgroundColor: item.categoryColor || '#EFF6FF' }]}>
          <Text style={styles.eventCardEmoji}>{item.emoji || '🎫'}</Text>
        </View>
        <View style={[styles.eventCardBadge, { backgroundColor: item.isPaid ? '#FFF7ED' : '#D1FAE5' }]}>
          <Text style={[styles.eventCardBadgeText, { color: item.isPaid ? '#F97316' : '#10B981' }]}>
            {item.isPaid ? `${item.prix} FCFA` : 'Gratuit'}
          </Text>
        </View>
      </View>
      <View style={styles.eventCardBody}>
        <Text style={styles.eventCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventCardMeta}>
          {formaterDateLisible(item.date)} · {item.lieu}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo_app.jpeg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerSen}>SEN</Text><Text style={styles.headerGuichet}>GUICHET</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.headerIcon}>
            <Feather name="user" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Support')} style={styles.headerContact}>
            <Text style={styles.headerContactText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor={colors.placeholder}
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>

        {/* Filtres catégories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categorieActive === cat && styles.catChipActive]}
              onPress={() => setCategorieActive(cat)}
            >
              <Text style={[styles.catChipText, categorieActive === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section À la une — EventCarousel conservé */}
        {chargement ? (
          <>
            <View style={styles.sectionHeader}>
              <Skeleton type="text" width={140} height={20} />
            </View>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Skeleton type="event-card" />
            </View>
          </>
        ) : une.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Événements à la une</Text>
            </View>
            <EventCarousel
              events={une}
              onPress={(event) => navigation.navigate('EventDetail', { eventId: event.id, event })}
            />
          </>
        )}

        {/* Section Tous les événements */}
        {tous.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tous les événements</Text>
            </View>
            <View style={styles.eventsList}>
              {tous.map((item, i) => (
                <View key={item.id || i}>{renderEventCard({ item })}</View>
              ))}
            </View>
          </>
        )}

        {!chargement && evenementsFiltres.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>Aucun événement</Text>
            <Text style={styles.emptySub}>Aucun événement trouvé pour cette recherche</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontFamily: fonts.outfit.extraBold },
  headerSen: { color: '#111827' },
  headerGuichet: { color: '#1A56DB' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerContact: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EFF6FF' },
  headerContactText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: '#1A56DB' },
  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 24,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.text, padding: 0 },
  // Categories
  catRow: { paddingHorizontal: 16, marginBottom: 12 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginRight: 8,
  },
  catChipActive: { backgroundColor: '#1A56DB' },
  catChipText: { fontSize: 13, fontFamily: fonts.jakarta.semiBold, color: '#374151' },
  catChipTextActive: { color: '#FFFFFF' },
  // Sections
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.text },
  // Event cards
  eventsList: { paddingHorizontal: 16, gap: 12 },
  eventCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden', marginBottom: 4,
  },
  eventCardImage: { height: 140, position: 'relative' },
  eventCardImgBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eventCardEmoji: { fontSize: 40 },
  eventCardBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  eventCardBadgeText: { fontSize: 11, fontFamily: fonts.outfit.bold },
  eventCardBody: { padding: 14 },
  eventCardTitle: { fontSize: 16, fontFamily: fonts.outfit.bold, color: '#111827', marginBottom: 4 },
  eventCardMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: '#6B7280' },
  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/HomeScreen.js
git commit -m "feat(home): nouveau HomeScreen thème clair — header, search, catégories, cards"
```

---

### Task 4: Adapter EventSearchScreen au thème clair

**Files:**
- Modify: `mobile/src/screens/EventSearchScreen.js`

- [ ] **Step 1: Vérifier que EventSearchScreen utilise les nouvelles couleurs theme.js**

Remove `BlurBackground` usage if present, replace dark references (`colors.bg` devient `#FFFFFF`, `colors.textWhite` devient `#111827`, etc.)

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/EventSearchScreen.js
git commit -m "refactor(search): adaptation EventSearchScreen au thème clair"
```

---

### Task 5: Adapter les écrans auth au thème clair

**Files:**
- Modify: `mobile/src/screens/auth/SocialAuthScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionControleurScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx`
- Possibly: `mobile/src/screens/auth/EnAttenteValidationScreen.jsx`
- Possibly: `mobile/src/screens/auth/EnAttenteValidationScreen.jsx`

- [ ] **Step 1: Pour chaque écran auth, remplacer**
  - `colors.bg` → `#FFFFFF` ou `#F9FAFB`
  - `colors.text` / `colors.textWhite` → `#111827`
  - `colors.textSecondary` / `colors.textWhiteMuted` → `#6B7280`
  - `colors.surface` → `#FFFFFF`
  - Supprimer les LinearGradient de fond sombre si présents
  - Garder le logo mais remplacer fond/glass par du blanc

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/auth/
git commit -m "refactor(auth): écrans auth adaptés au thème clair"
```

---

### Task 6: Adapter les écrans organisateur/contrôleur au thème clair

**Files:**
- Modify: `mobile/src/screens/ProfilScreen.jsx` (ajouter lien "Espace organisateur")
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`
- Modify: `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`
- Modify: `mobile/src/screens/organisateur/StatistiquesScreen.jsx`
- Modify: `mobile/src/screens/organisateur/MesDemandesScreen.jsx`
- Modify: `mobile/src/screens/controleur/ScannerScreen.jsx`
- Modify: `mobile/src/screens/controleur/ScanHistoryScreen.jsx`

- [ ] **Step 1: Pour chaque écran, remplacer les couleurs sombres par les nouvelles valeurs claires**

Même procédure que Task 5.

- [ ] **Step 2: Ajouter le lien "Espace organisateur" dans ProfilScreen**

```js
{/* Lien vers l'espace organisateur */}
<TouchableOpacity
  style={styles.proLink}
  onPress={() => navigation.navigate('ConnexionOrganisateur')}
>
  <Feather name="briefcase" size={20} color={colors.primary} />
  <Text style={styles.proLinkText}>Espace organisateur</Text>
  <Feather name="chevron-right" size={20} color={colors.muted} />
</TouchableOpacity>
```

Ajouter aussi un lien "Mode contrôleur" si pertinent.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/ProfilScreen.jsx mobile/src/screens/organisateur/ mobile/src/screens/controleur/
git commit -m "refactor(roles): adaptation thème clair + lien espace pro dans Profil"
```

---

### Task 7: Adapter EventDetailScreen et TicketScreen au thème clair

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`
- Modify: `mobile/src/screens/TicketScreen.js`
- Modify: `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **Step 1: Remplacer les couleurs sombres dans EventDetailScreen**

- Fond → `#FFFFFF` / `#F9FAFB`
- Header d'event (bannière) → garder l'image/gradient, mais fond général blanc
- Bouton achat → garder le gradient mais fond blanc

- [ ] **Step 2: Remplacer les couleurs dans TicketScreen et MesTicketsScreen**

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js mobile/src/screens/TicketScreen.js mobile/src/screens/MesTicketsScreen.jsx
git commit -m "refactor(detail,ticket): adaptation EventDetail et Ticket au thème clair"
```

---

### Task 8: Adapter les composants réutilisables au thème clair

**Files:**
- Modify: `mobile/src/components/FloatingTabBar.jsx` (si utilisé, adapter couleurs)
- Maybe: `mobile/src/components/GlassContainer.jsx`
- Maybe: `mobile/src/components/GlassButton.jsx`

- [ ] **Step 1: Vérifier et adapter chaque composant aux nouvelles couleurs**

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/
git commit -m "refactor(components): composants adaptés au thème clair"
```

---

### Task 9: Vérification finale

- [ ] **Step 1: Vérifier que l'app build sans erreur**

```bash
cd mobile && npx expo export --platform web 2>&1 | head -50
```

- [ ] **Step 2: Vérifier les imports et références de couleurs**

```bash
cd mobile && npx expo export --platform web 2>&1 | head -50
```

- [ ] **Step 3: Vérifier que toutes les références à d'anciennes couleurs (`colors.textWhite`, `colors.surface` qui pointent vers du foncé) sont bien remplacées**

```bash
rg "colors\.(bg|text|surface|textSecondary|accent|green|red|danger|warning|success|navActive|navInactive|primary|border|inputBg)" mobile/src/ --no-filename | sort | uniq -c | sort -rn
```

- [ ] **Step 4: Commit final si besoin**

```bash
git add -A
git commit -m "fix: corrections post-refonte thème clair"
```
