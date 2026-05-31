# Dashboard organisateur mobile — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre le dashboard organisateur mobile à parité fonctionnelle avec le web, en lecture seule, avec une navigation Drawer.

**Architecture:** Drawer navigation remplace les bottom tabs. 3 nouveaux écrans (Détail événement, Statistiques, Paramètres). 3 écrans modifiés (Dashboard, Liste événements, Tickets). Tous les appels API passent par `eventService.js`.

**Tech Stack:** React Native, Expo 54, @react-navigation/drawer, victory-native, expo-sqlite (existant)

---

### Prérequis : Installer les dépendances

```bash
cd mobile
npx expo install @react-navigation/drawer victory-native
```

---

### Task 1: Créer OrganisateurDrawer.js

**Files:**
- Create: `mobile/src/navigation/OrganisateurDrawer.js`

**Drawer structure:**
- Custom drawer content avec en-tête utilisateur (avatar, nom, email)
- 4 entrées : Vue d'ensemble, Mes événements, Statistiques, Paramètres
- Bouton Déconnexion en bas
- Le drawer enveloppe un Stack pour "Mes événements" (liste → détail → tickets)

```jsx
// Navigation par Drawer pour le rôle organisateur (lecture seule)
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors } from '../constants/theme'

import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
import DetailEvenementScreen from '../screens/organisateur/DetailEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import StatistiquesScreen from '../screens/organisateur/StatistiquesScreen'
import ParametresScreen from '../screens/organisateur/ParametresScreen'

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()

function EvenementsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MesEvenements" component={GestionEvenementsScreen} />
      <Stack.Screen name="DetailEvenement" component={DetailEvenementScreen} />
      <Stack.Screen name="VoirTickets" component={VoirTicketsScreen} />
    </Stack.Navigator>
  )
}

const DRAWER_ITEMS = [
  { label: "Vue d'ensemble", icon: '📊', screen: 'Dashboard' },
  { label: 'Mes événements', icon: '📅', screen: 'EvenementsStack' },
  { label: 'Statistiques', icon: '📈', screen: 'Statistiques' },
  { label: 'Paramètres', icon: '⚙️', screen: 'Parametres' },
]

function CustomDrawerContent({ navigation }) {
  const { user, deconnecter } = useAuth()

  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nom?.charAt(0)?.toUpperCase() || 'O'}
          </Text>
        </View>
        <Text style={styles.nom}>{user?.nom || 'Organisateur'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>
      <ScrollView style={styles.items}>
        {DRAWER_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.item}
            onPress={() => {
              navigation.closeDrawer()
              navigation.navigate(item.screen)
            }}
          >
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.deconnexion} onPress={deconnecter}>
        <Text style={styles.deconnexionIcon}>🚪</Text>
        <Text style={styles.deconnexionLabel}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function OrganisateurDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.slate,
        headerTitleStyle: { fontFamily: 'Outfit_600SemiBold', fontSize: 17 },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={OrganisateurDashboardScreen}
        options={{ headerTitle: "Vue d'ensemble" }}
      />
      <Drawer.Screen
        name="EvenementsStack"
        component={EvenementsStack}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{ headerTitle: 'Statistiques' }}
      />
      <Drawer.Screen
        name="Parametres"
        component={ParametresScreen}
        options={{ headerTitle: 'Paramètres' }}
      />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: colors.white },
  header: {
    padding: 24, paddingTop: 60, paddingBottom: 20,
    backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, color: colors.white, fontFamily: 'Outfit_700Bold' },
  nom: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: colors.slate },
  email: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: colors.mid, marginTop: 2 },
  items: { flex: 1, paddingTop: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24,
  },
  itemIcon: { fontSize: 20, marginRight: 16, width: 28 },
  itemLabel: { fontSize: 16, fontFamily: 'Outfit_500Medium', color: colors.slate },
  deconnexion: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  deconnexionIcon: { fontSize: 20, marginRight: 16, width: 28 },
  deconnexionLabel: { fontSize: 16, fontFamily: 'Outfit_500Medium', color: colors.red },
})
```

---

### Task 2: Modifier AppNavigator.js

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

**Changements :**
- Remplacer l'import `OrganisateurTabs` par `OrganisateurDrawer`
- Remplacer `OrganisateurTabs()` component par `OrganisateurDrawer`
- Supprimer l'import `createBottomTabNavigator` (plus utilisé pour l'orga)
- Supprimer la fonction `OrganisateurTabs()`
- Supprimer les imports des écrans organisateur individuels (maintenant importés via OrganisateurDrawer)

```jsx
// Dans AppNavigator.js — modifier les imports et la section organisateur

// Remplacer les imports organisateur :
// AVANT :
import OrganisateurDashboardScreen from '../screens/organisateur/OrganisateurDashboardScreen'
import CreerEvenementScreen from '../screens/organisateur/CreerEvenementScreen'
import VoirTicketsScreen from '../screens/organisateur/VoirTicketsScreen'
import GestionEvenementsScreen from '../screens/organisateur/GestionEvenementsScreen'
const Tab = createBottomTabNavigator()

// APRÈS :
import OrganisateurDrawer from './OrganisateurDrawer'
// (createBottomTabNavigator peut être supprimé si plus utilisé par ControleurTabs)

// Remplacer la section organisateur :
// AVANT :
{role === 'organisateur' && (
  <Stack.Screen name="OrganisateurTabs" component={OrganisateurTabs} />
)}

// APRÈS :
{role === 'organisateur' && (
  <Stack.Screen
    name="OrganisateurDrawer"
    component={OrganisateurDrawer}
    options={{ headerShown: false }}
  />
)}

// Supprimer toute la fonction OrganisateurTabs() (lignes 92-161)
```

Note : `createBottomTabNavigator` est encore utilisé par `ControleurTabs()`, donc ne pas supprimer cette variable.

---

### Task 3: Modifier OrganisateurDashboardScreen.jsx

**Files:**
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

**Changements :**
- 4 stats au lieu de 3 (ajouter "Taux de remplissage")
- Actions rapides : remplacer Créer/Tickets/Gérer par navigation vers drawer items
- Événements récents : limiter à 5, tap → DetailEvenement (plus d'expand)
- Supprimer "Créer un événement" et "Se déconnecter" en bas
- Supprimer `AnimatedStatValue` (remplacer par affichage simple)
- Supprimer les imports inutilisés (Svg, Circle, BoutonPrincipal, Animated, etc.)

```jsx
// Dashboard organisateur : stats, événements récents, navigation rapide
// Lecture seule — pas de création/modification
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import Skeleton from '../../components/Skeleton'
import { formaterDateLisible } from '../../utils/dateUtils'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#10B981', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [recettes, setRecettes] = useState(0)
  const [totalVendus, setTotalVendus] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const unsubscribe = navigation.addListener('focus', loadData)
    return unsubscribe
  }, [navigation])

  async function loadData() {
    setLoading(true)
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
      let v = 0, r = 0
      for (const e of evts) {
        v += e.remplis || 0
        r += e.revenus ? parseInt(String(e.revenus).replace(/\D/g, '')) || 0 : 0
      }
      setTotalVendus(v)
      setRecettes(r)
    } catch {
      // Backend requis
    }
    setLoading(false)
  }

  const actifs = events.filter(e => e.statut === 'actif').length
  const capaciteTotale = events.reduce((sum, e) => sum + (e.capacite || 0), 0)
  const tauxRemplissage = capaciteTotale > 0 ? Math.round((totalVendus / capaciteTotale) * 100) : 0
  const recents = events.slice(0, 5)

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <Text style={s.greeting}>Salut 👋</Text>
        <Text style={s.nom}>{user?.nom || 'Organisateur'}</Text>
        <Text style={s.subtitle}>Bienvenue sur ton tableau de bord</Text>
      </LinearGradient>

      <View style={s.quickActions}>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('EvenementsStack')}>
          <Text style={s.quickIcon}>📅</Text>
          <Text style={s.quickLabel}>Événements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('Statistiques')}>
          <Text style={s.quickIcon}>📈</Text>
          <Text style={s.quickLabel}>Statistiques</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('Parametres')}>
          <Text style={s.quickIcon}>⚙️</Text>
          <Text style={s.quickLabel}>Paramètres</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {loading ? (
          <>
            <View style={s.statCard}><Skeleton width="100%" height={44} borderRadius={8} /></View>
            <View style={s.statCard}><Skeleton width="100%" height={44} borderRadius={8} /></View>
            <View style={s.statCard}><Skeleton width="100%" height={44} borderRadius={8} /></View>
            <View style={s.statCard}><Skeleton width="100%" height={44} borderRadius={8} /></View>
          </>
        ) : (
          <>
            <View style={[s.statCard, { borderLeftColor: '#6366F1' }]}>
              <Text style={s.statValue}>{actifs}</Text>
              <Text style={s.statLabel}>Actifs</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#10B981' }]}>
              <Text style={s.statValue}>{totalVendus}</Text>
              <Text style={s.statLabel}>Vendus</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#EC4899' }]}>
              <Text style={s.statValue}>{Math.round(recettes / 1000)}k</Text>
              <Text style={s.statLabel}>Revenus</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#F97316' }]}>
              <Text style={s.statValue}>{tauxRemplissage}%</Text>
              <Text style={s.statLabel}>Remplissage</Text>
            </View>
          </>
        )}
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Événements récents</Text>
        {events.length > 5 && (
          <TouchableOpacity onPress={() => navigation.navigate('EvenementsStack')}>
            <Text style={s.voirTout}>Voir tout</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Skeleton type="card" count={3} />
        </View>
      ) : recents.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎪</Text>
          <Text style={s.emptyTitle}>Aucun événement</Text>
          <Text style={s.emptySub}>Les événements créés par l'admin apparaîtront ici</Text>
        </View>
      ) : (
        recents.map(evt => {
          const cfg = STATUT_CONFIG[evt.statut] || STATUT_CONFIG.en_attente
          const pct = (evt.capacite || 0) > 0 ? Math.round(((evt.remplis || 0) / evt.capacite) * 100) : 0
          return (
            <TouchableOpacity
              key={evt.id}
              style={s.eventCard}
              onPress={() => navigation.navigate('EvenementsStack', {
                screen: 'DetailEvenement',
                params: { eventId: evt.id },
              })}
              activeOpacity={0.7}
            >
              <View style={s.eventTop}>
                <View style={[s.badge, { backgroundColor: cfg.color }]}>
                  <Text style={s.badgeText}>{evt.nom.charAt(0)}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={s.eventName}>{evt.nom}</Text>
                  <Text style={s.eventMeta}>{formaterDateLisible(evt.date)}</Text>
                </View>
                <View style={[s.pill, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.pillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={s.barRow}>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={s.barCount}>{evt.remplis || 0}/{evt.capacite || '?'}</Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { padding: spacing.xl, paddingTop: 60, paddingBottom: 50 },
  greeting: { fontSize: 32, fontFamily: fonts.outfit.bold, color: '#fff' },
  nom: { fontSize: 15, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  quickActions: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: spacing.lg, marginTop: -16,
    borderRadius: 16, paddingVertical: spacing.md, elevation: 2,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  quickBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { fontSize: 28, marginBottom: 4 },
  quickLabel: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.sm,
    borderLeftWidth: 3, elevation: 2,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  statLabel: {
    fontSize: 9, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTout: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xs, textAlign: 'center', marginHorizontal: spacing.xl },
  eventCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, padding: spacing.md, elevation: 2,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  eventTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  badgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: '#eef2ff', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  barCount: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate, width: 55, textAlign: 'right' },
})
```

---

### Task 4: Modifier GestionEvenementsScreen.jsx

**Files:**
- Modify: `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`

**Changements :**
- Ajouter tabs (Tous / Actifs / Terminés) en haut
- Ajouter barre de recherche TextInput
- Tap sur événement → navigation vers DetailEvenement
- Supprimer Swipeable, swipe delete, boutons Modifier/Supprimer
- Supprimer handleDelete(), imports inutilisés
- Supprimer `annulerEvenementAPI` import

```jsx
// Gestion des événements : liste complète avec filtres
// Lecture seule — pas de modification/suppression
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { formaterDateLisible } from '../../utils/dateUtils'
import EmptyState from '../../components/EmptyState'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#10B981', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

const TABS = ['Tous', 'Actifs', 'Terminés']

export default function GestionEvenementsScreen({ navigation }) {
  const [events, setEvents] = useState([])
  const [activeTab, setActiveTab] = useState('Tous')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    charger()
    const unsubscribe = navigation.addListener('focus', charger)
    return unsubscribe
  }, [navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [])

  async function charger() {
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
    } catch {
      // Backend requis
    }
  }

  const filtered = events.filter(evt => {
    if (activeTab === 'Actifs') return evt.statut === 'actif'
    if (activeTab === 'Terminés') return ['termine', 'annule'].includes(evt.statut)
    return true
  }).filter(evt =>
    !search || evt.nom?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={s.container}>
      <View style={s.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher un événement..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="🎪" title="Aucun événement" subtitle="Aucun événement ne correspond à ta recherche" />
        ) : (
          filtered.map(evt => {
            const cfg = STATUT_CONFIG[evt.statut] || STATUT_CONFIG.en_attente
            const pct = (evt.capacite || 0) > 0 ? Math.round(((evt.remplis || 0) / evt.capacite) * 100) : 0
            return (
              <TouchableOpacity
                key={evt.id}
                style={s.card}
                onPress={() => navigation.navigate('DetailEvenement', { eventId: evt.id })}
                activeOpacity={0.7}
              >
                <View style={s.cardTop}>
                  <View style={[s.badge, { backgroundColor: cfg.color }]}>
                    <Text style={s.badgeText}>{evt.nom.charAt(0)}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.nom}>{evt.nom}</Text>
                    <Text style={s.date}>{formaterDateLisible(evt.date)} · Code: {evt.code}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={s.barRow}>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={s.barCount}>{evt.remplis || 0}/{evt.capacite || '?'}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff' },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.mid },
  tabTextActive: { color: '#fff' },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchInput: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, paddingHorizontal: 16, height: 44,
    fontFamily: fonts.jakarta.regular, fontSize: 14, color: colors.slate,
  },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    elevation: 2, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  badgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  info: { flex: 1 },
  nom: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  date: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: '#eef2ff', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  barCount: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate, width: 55, textAlign: 'right' },
})
```

---

### Task 5: Créer DetailEvenementScreen.jsx

**Files:**
- Create: `mobile/src/screens/organisateur/DetailEvenementScreen.jsx`

```jsx
// Détail d'un événement (lecture seule)
// Affiche toutes les informations + liste des catégories de billets
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import { formaterDateLisible } from '../../utils/dateUtils'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#10B981', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

export default function DetailEvenementScreen({ route, navigation }) {
  const { eventId } = route.params || {}
  const [evenement, setEvenement] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {
      // Backend requis
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  if (!evenement) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Événement introuvable</Text>
      </View>
    )
  }

  const cfg = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.en_attente
  const pct = (evenement.capacite || 0) > 0
    ? Math.round(((evenement.remplis || 0) / evenement.capacite) * 100) : 0

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>{evenement.nom}</Text>
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={s.infoGrid}>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Date</Text>
          <Text style={s.infoValue}>{formaterDateLisible(evenement.date)}</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Lieu</Text>
          <Text style={s.infoValue}>{evenement.lieu || 'Non spécifié'}</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Capacité</Text>
          <Text style={s.infoValue}>{evenement.capacite || 0} places</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Code</Text>
          <Text style={s.infoValue}>{evenement.code || '-'}</Text>
        </View>
      </View>

      <View style={s.fillSection}>
        <Text style={s.fillTitle}>Remplissage</Text>
        <View style={s.barRow}>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.barCount}>{evenement.remplis || 0}/{evenement.capacite || 0}</Text>
        </View>
        <Text style={s.fillPct}>{pct}%</Text>
      </View>

      {evenement.description ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.description}>{evenement.description}</Text>
        </View>
      ) : null}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Billets ({tickets.length})</Text>
        {tickets.length === 0 ? (
          <Text style={s.empty}>Aucun billet vendu</Text>
        ) : (
          tickets.map(t => (
            <View key={t.id} style={s.ticketRow}>
              <Text style={s.ticketCategorie}>{t.categorie || t.nom}</Text>
              <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
              <Text style={s.ticketStatut}>{t.statut || 'valide'}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={s.voirTicketsBtn}
        onPress={() => navigation.navigate('VoirTickets', { eventId })}
      >
        <Text style={s.voirTicketsText}>Voir tous les billets →</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.md,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  infoCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    elevation: 2, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  infoLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginTop: 4 },
  fillSection: { padding: spacing.lg },
  fillTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 10, backgroundColor: '#eef2ff', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: '#6366F1' },
  barCount: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  fillPct: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.accent, marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm },
  description: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, lineHeight: 22 },
  empty: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, textAlign: 'center', paddingVertical: spacing.lg },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, flex: 1 },
  ticketPrix: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  ticketStatut: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginLeft: spacing.sm, textTransform: 'capitalize' },
  voirTicketsBtn: { marginHorizontal: spacing.lg, paddingVertical: 14, borderRadius: borderRadius.lg, backgroundColor: colors.accent, alignItems: 'center' },
  voirTicketsText: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: '#fff' },
})
```

---

### Task 6: Modifier VoirTicketsScreen.jsx

**Files:**
- Modify: `mobile/src/screens/organisateur/VoirTicketsScreen.jsx`

**Changements :**
- Supprimer la section recherche par code événement
- Utiliser `fetchEvenementDetailAPI(eventId)` au lieu d'AsyncStorage
- Afficher le nom de l'événement en haut
- Garder la liste des tickets avec statuts
- BackButton automatique via la Stack navigation

```jsx
// Consultation des tickets d'un événement (lecture seule)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'

const STATUS_BADGE = {
  valide: { label: 'Valide', color: '#10B981', bg: '#D1FAE5' },
  utilise: { label: 'Utilisé', color: '#64748b', bg: '#F1F5F9' },
  expire: { label: 'Expiré', color: '#EF4444', bg: '#FEE2E2' },
}

export default function VoirTicketsScreen({ route }) {
  const { eventId } = route.params || {}
  const [evenement, setEvenement] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {
      // Backend requis
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <Skeleton type="card" count={5} />
      </View>
    )
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {evenement && (
        <View style={s.eventInfo}>
          <Text style={s.eventName}>{evenement.nom}</Text>
          <Text style={s.ticketCount}>{tickets.length} billet(s)</Text>
        </View>
      )}

      {tickets.length === 0 ? (
        <Text style={s.empty}>Aucun billet pour cet événement</Text>
      ) : (
        tickets.map(t => {
          const badge = STATUS_BADGE[t.statut] || STATUS_BADGE.valide
          return (
            <View key={t.id} style={s.ticketRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.ticketNumero}>{t.numero || t.id?.slice(0, 8)}</Text>
                <Text style={s.ticketCategorie}>{t.categorie || 'Standard'}</Text>
                <Text style={s.ticketTel}>{t.telephone || t.telephoneAcheteur || '-'}</Text>
              </View>
              <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
              <View style={[s.badge, { backgroundColor: badge.bg }]}>
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
          )
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  eventInfo: { marginBottom: spacing.lg },
  eventName: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent, marginTop: 4 },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 60 },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, elevation: 2,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.accent },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginTop: 2 },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  ticketPrix: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
```

---

### Task 7: Créer StatistiquesScreen.jsx

**Files:**
- Create: `mobile/src/screens/organisateur/StatistiquesScreen.jsx`
- Dep: `victory-native`

```jsx
// Statistiques avec graphiques (lecture seule)
// Utilise victory-native pour les charts (barres + camembert)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { VictoryBar, VictoryPie, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'

const PERIODES = ['7j', '30j', '3 mois', 'Tout']
const CHART_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F97316', '#06B6D4', '#8B5CF6']

export default function StatistiquesScreen() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('30j')

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg }}><Skeleton type="card" count={6} /></View>
      </View>
    )
  }

  const totalVendus = events.reduce((s, e) => s + (e.remplis || 0), 0)
  const totalCapacite = events.reduce((s, e) => s + (e.capacite || 0), 0)
  const tauxRemplissage = totalCapacite > 0 ? Math.round((totalVendus / totalCapacite) * 100) : 0
  const totalRecettes = events.reduce((s, e) => {
    const r = e.revenus ? parseInt(String(e.revenus).replace(/\D/g, '')) || 0 : 0
    return s + r
  }, 0)

  // Données pour le camembert : répartition par événement
  const pieData = events.slice(0, 6).map((e, i) => ({
    x: e.nom?.slice(0, 12) || 'Événement',
    y: e.remplis || 1,
  }))

  // Données mock pour le graphique barres (comme le web)
  const barData = Array.from({ length: 30 }, (_, i) => ({
    x: `J${i + 1}`,
    y: Math.floor(Math.random() * 50) + 5,
  }))

  const screenWidth = Dimensions.get('window').width - spacing.lg * 2

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.periodes}>
        {PERIODES.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.periode, periode === p && s.periodeActive]}
            onPress={() => setPeriode(p)}
          >
            <Text style={[s.periodeText, periode === p && s.periodeTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.statsRow}>
        <View style={[s.statCard, { borderLeftColor: '#6366F1' }]}>
          <Text style={s.statValue}>{totalVendus}</Text>
          <Text style={s.statLabel}>Vendus</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={s.statValue}>{Math.round(totalRecettes / 1000)}k F</Text>
          <Text style={s.statLabel}>Revenus</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#F97316' }]}>
          <Text style={s.statValue}>{tauxRemplissage}%</Text>
          <Text style={s.statLabel}>Remplissage</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#EC4899' }]}>
          <Text style={s.statValue}>{events.length}</Text>
          <Text style={s.statLabel}>Événements</Text>
        </View>
      </View>

      <View style={s.chartSection}>
        <Text style={s.chartTitle}>Évolution des ventes</Text>
        <VictoryChart width={screenWidth} height={200} theme={VictoryTheme.material}>
          <VictoryBar data={barData} style={{ data: { fill: '#6366F1' } }} />
          <VictoryAxis style={{ tickLabels: { fontSize: 8, angle: -45 } }} />
        </VictoryChart>
      </View>

      {pieData.length > 0 && (
        <View style={s.chartSection}>
          <Text style={s.chartTitle}>Répartition par événement</Text>
          <VictoryPie
            data={pieData}
            width={screenWidth}
            height={250}
            colorScale={CHART_COLORS}
            style={{ labels: { fontSize: 11, fontFamily: fonts.outfit.semiBold } }}
          />
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  periodes: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  periode: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#fff' },
  periodeActive: { backgroundColor: colors.accent },
  periodeText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.mid },
  periodeTextActive: { color: '#fff' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap',
  },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    borderLeftWidth: 3, marginBottom: spacing.sm,
    elevation: 2, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  statValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  statLabel: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.mid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  chartSection: { padding: spacing.lg },
  chartTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm },
})
```

---

### Task 8: Créer ParametresScreen.jsx

**Files:**
- Create: `mobile/src/screens/organisateur/ParametresScreen.jsx`

```jsx
// Paramètres organisateur (lecture seule)
// Profil, sécurité, notifications
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

const NOTIF_KEYS = {
  smsVente: '@senguichet_notif_sms_vente',
  emailRecap: '@senguichet_notif_email_recap',
  stockFaible: '@senguichet_notif_stock_faible',
}

export default function ParametresScreen() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({
    smsVente: true,
    emailRecap: true,
    stockFaible: false,
  })

  function toggleNotif(key) {
    const nouvelle = { ...notifications, [key]: !notifications[key] }
    setNotifications(nouvelle)
    AsyncStorage.setItem(NOTIF_KEYS[key], JSON.stringify(nouvelle[key]))
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Mon profil</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>Nom</Text>
            <Text style={s.value}>{user?.nom || '-'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Email</Text>
            <Text style={s.value}>{user?.email || '-'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Téléphone</Text>
            <Text style={s.value}>{user?.telephone || '-'}</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Sécurité</Text>
        <View style={s.card}>
          <Text style={s.infoText}>
            Pour modifier ton mot de passe, connecte-toi à la version web.
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>SMS à chaque vente</Text>
            <Switch
              value={notifications.smsVente}
              onValueChange={() => toggleNotif('smsVente')}
              trackColor={{ true: colors.accentLight, false: colors.border }}
              thumbColor={notifications.smsVente ? colors.accent : colors.muted}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Email récapitulatif quotidien</Text>
            <Switch
              value={notifications.emailRecap}
              onValueChange={() => toggleNotif('emailRecap')}
              trackColor={{ true: colors.accentLight, false: colors.border }}
              thumbColor={notifications.emailRecap ? colors.accent : colors.muted}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Alertes stock faible</Text>
            <Switch
              value={notifications.stockFaible}
              onValueChange={() => toggleNotif('stockFaible')}
              trackColor={{ true: colors.accentLight, false: colors.border }}
              thumbColor={notifications.stockFaible ? colors.accent : colors.muted}
            />
          </View>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm },
  card: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, elevation: 2, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.slate },
  value: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
  infoText: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, lineHeight: 20 },
})
```

---

### Vérification finale

- [ ] Vérifier que `npm start` ou `npx expo start` compile sans erreur
- [ ] Vérifier que la navigation drawer s'ouvre avec le hamburger
- [ ] Vérifier que "Vue d'ensemble" charge les événements depuis l'API
- [ ] Vérifier que le tap sur un événement ouvre le détail
- [ ] Vérifier que les stats affichent des valeurs correctes
- [ ] Vérifier que les graphiques victory-native s'affichent
