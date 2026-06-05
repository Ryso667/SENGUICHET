# UI/UX Premium, Dashboard & Ticket — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply premium UI/UX redesign, build organizer dashboard with real stats/ticket numbering, and redesign ticket view.

**Architecture:** Modify existing screens/components in-place with targeted updates. Add `eventService.js` as a shared data layer in AsyncStorage for organizer events/tickets. No backend changes needed — all data is client-side for now.

**Tech Stack:** React Native, Expo, AsyncStorage, expo-linear-gradient, react-native-qrcode-svg

---

## Files Summary

**Modified:**
- `mobile/src/constants/theme.js`
- `mobile/src/screens/AccueilChoixScreen.jsx`
- `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`
- `mobile/src/screens/organisateur/CreerEvenementScreen.jsx`
- `mobile/src/screens/organisateur/VoirTicketsScreen.jsx`
- `mobile/src/screens/TicketScreen.js`
- `mobile/src/screens/EventDetailScreen.js`
- `mobile/src/components/EventCard.js`
- `mobile/src/context/AuthContext.jsx`

**Created:**
- `mobile/src/services/eventService.js`
- `mobile/src/components/Logo.jsx`

---

### Task 1: theme.js — Glassmorphism & Premium Design System

**Files:**
- Modify: `mobile/src/constants/theme.js`

- [ ] **Update theme.js with premium tokens**

```js
const colors = {
  bg: '#F8F9FC',
  white: '#FFFFFF',
  slate: '#0F172A',
  mid: '#64748B',
  muted: '#94A3B8',
  border: '#EDF0F5',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  rose: '#EC4899',
  green: '#10B981',
  greenLight: '#ECFDF5',
  red: '#EF4444',
  orange: '#F97316',
  cyan: '#06B6D4',
  violet: '#8B5CF6',
}

const glass = {
  bg: 'rgba(255,255,255,0.7)',
  darkBg: 'rgba(15,23,42,0.05)',
  border: 'rgba(255,255,255,0.3)',
  blur: 20,
  radius: 20,
}

const gradients = {
  primary: ['#6366F1', '#EC4899'],
  acheteur: ['#6366F1', '#06B6D4'],
  controleur: ['#8B5CF6', '#EC4899'],
  organisateur: ['#EC4899', '#F97316'],
  hero: ['rgba(99,102,241,0.04)', 'rgba(236,72,153,0.04)'],
}

const shadows = {
  sm: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  lg: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
}
```

---

### Task 2: eventService.js — Data Layer for Events & Tickets

**Files:**
- Create: `mobile/src/services/eventService.js`

- [ ] **Create eventService with AsyncStorage CRUD**

```js
import AsyncStorage from '@react-native-async-storage/async-storage'

const EVENTS_KEY = '@senguichet_evenements'
const TICKETS_KEY = '@senguichet_tickets'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function formatNum(n, len = 3) {
  return String(n).padStart(len, '0')
}

export async function getAllEvenements() {
  const raw = await AsyncStorage.getItem(EVENTS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function getEvenement(id) {
  const events = await getAllEvenements()
  return events.find(e => e.id === id) || null
}

export async function creerEvenement({ nom, date, categories }) {
  const events = await getAllEvenements()
  const evt = {
    id: generateId(),
    nom,
    date,
    code: Math.floor(1000 + Math.random() * 9000).toString(),
    categories: categories.map(c => ({ id: generateId(), nom: c.nom, prix: Number(c.prix), capacite: Number(c.capacite) })),
    ticketCount: 0,
    createdAt: new Date().toISOString(),
  }
  events.push(evt)
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return evt
}

export async function acheterTicket(eventId, categorieId, telephone) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === eventId)
  if (idx === -1) throw new Error('Événement introuvable')
  const evt = events[idx]
  const cat = evt.categories.find(c => c.id === categorieId)
  if (!cat) throw new Error('Catégorie introuvable')

  evt.ticketCount++
  const numero = `TKT-${evt.nom.slice(0, 4).toUpperCase()}-${formatNum(evt.ticketCount)}`

  const ticket = {
    id: generateId(),
    eventId,
    eventNom: evt.nom,
    eventDate: evt.date,
    categorie: cat.nom,
    prix: cat.prix,
    telephone,
    numero,
    statut: 'valide',
    dateAchat: new Date().toISOString(),
    dateScan: null,
  }

  const tickets = await getAllTickets()
  tickets.push(ticket)
  await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(tickets))
  events[idx] = evt
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return ticket
}

export async function getAllTickets() {
  const raw = await AsyncStorage.getItem(TICKETS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function getTicketsByEvent(eventId) {
  const tickets = await getAllTickets()
  return tickets.filter(t => t.eventId === eventId)
}

export async function getEvenementStats(eventId) {
  const evt = await getEvenement(eventId)
  if (!evt) return null
  const tickets = await getTicketsByEvent(eventId)

  const vendusParCategorie = evt.categories.map(cat => ({
    nom: cat.nom,
    vendus: tickets.filter(t => t.categorie === cat.nom).length,
    capacite: cat.capacite,
    prix: cat.prix,
  }))

  const scannesParCategorie = evt.categories.map(cat => ({
    nom: cat.nom,
    scannes: tickets.filter(t => t.categorie === cat.nom && t.statut === 'utilise').length,
    vendus: tickets.filter(t => t.categorie === cat.nom).length,
  }))

  const recettes = tickets.reduce((sum, t) => sum + t.prix, 0)

  return {
    totalVendus: tickets.length,
    totalScannes: tickets.filter(t => t.statut === 'utilise').length,
    recettes,
    vendusParCategorie,
    scannesParCategorie,
  }
}

export async function getTicketsAcheteur(telephone) {
  const tickets = await getAllTickets()
  return tickets.filter(t => t.telephone === telephone)
}
```

---

### Task 3: CreerEvenementScreen — Save to eventService

**Files:**
- Modify: `mobile/src/screens/organisateur/CreerEvenementScreen.jsx`

- [ ] **Replace mock with real event creation**

Add import:
```js
import { creerEvenement } from '../../services/eventService'
```

Replace `handleCreer`:
```js
const handleCreer = async () => {
  if (!nom || !date || categories.length === 0) {
    Alert.alert('Erreur', 'Remplis tous les champs')
    return
  }
  try {
    const evt = await creerEvenement({ nom, date, categories })
    Alert.alert('Événement créé !', `Code événement : ${evt.code}\nPartage ce code avec les contrôleurs.`)
    navigation.goBack()
  } catch (e) {
    Alert.alert('Erreur', e.message)
  }
}
```

Also update categories input to include capacity:
```jsx
<TextInput style={s.input} placeholder="Capacité" keyboardType="numeric"
  value={String(cat.capacite)} onChangeText={v => updateCat(i, 'capacite', v)} />
```

---

### Task 4: AccueilChoixScreen — Premium Gradient Cards

**Files:**
- Modify: `mobile/src/screens/AccueilChoixScreen.jsx`

This is a complete screen rewrite:

```jsx
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../constants/theme'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.xl * 2

const ROLES = [
  {
    key: 'acheteur',
    title: 'Acheteur',
    subtitle: 'Achète tes billets\nen un clic',
    icon: '🎟️',
    gradient: gradients.acheteur,
  },
  {
    key: 'controleur',
    title: 'Contrôleur',
    subtitle: 'Scanne les billets\nà l\'entrée',
    icon: '📸',
    gradient: gradients.controleur,
  },
  {
    key: 'organisateur',
    title: 'Organisateur',
    subtitle: 'Crée et gère\ntes événements',
    icon: '🎪',
    gradient: gradients.organisateur,
  },
]

export default function AccueilChoixScreen({ navigation }) {
  const animations = ROLES.map(() => useRef(new Animated.Value(0)).current)

  useEffect(() => {
    Animated.stagger(120, animations.map(a =>
      Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
    )).start()
  }, [])

  return (
    <LinearGradient colors={gradients.hero} style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <Text style={s.logo}>🎫</Text>
        <Text style={s.title}>Senguichet</Text>
        <Text style={s.tagline}>Billets & Événements</Text>
      </View>
      <View style={s.cards}>
        {ROLES.map((role, i) => {
          const scale = animations[i].interpolate({
            inputRange: [0, 1], outputRange: [0.9, 1],
          })
          const opacity = animations[i].interpolate({
            inputRange: [0, 1], outputRange: [0, 1],
          })
          return (
            <Animated.View key={role.key} style={[s.cardWrap, { opacity, transform: [{ scale }] }]}>
              <LinearGradient
                colors={role.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.card}
              >
                <Text style={s.cardIcon}>{role.icon}</Text>
                <Text style={s.cardTitle}>{role.title}</Text>
                <Text style={s.cardSubtitle}>{role.subtitle}</Text>
                <View style={s.arrow}>
                  <Text style={s.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )
        })}
      </View>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: spacing.xl },
  logo: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 32, fontFamily: fonts.outfit.bold, color: colors.slate },
  tagline: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  cards: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  cardWrap: { borderRadius: borderRadius.xl, ...shadows.lg },
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, minHeight: 140, justifyContent: 'center' },
  cardIcon: { fontSize: 36, marginBottom: spacing.xs },
  cardTitle: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.white },
  cardSubtitle: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  arrow: { position: 'absolute', right: spacing.lg, top: '50%', marginTop: -12 },
  arrowText: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },
})
```

Also update AppNavigator to use direct navigation for AccueilChoixScreen instead of wrapping it with a NavigationContainer (remove the stack if there's no auth needed yet — actually keep the stack but ensure the touch handlers work).

**Note:** The `onPress` navigation is missing. Add it:

```jsx
// On each card Animated.View, add:
<TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate(
  role.key === 'acheteur' ? 'EntrerNumero' :
  role.key === 'controleur' ? 'ConnexionControleur' :
  'ConnexionOrganisateur'
)}>
  <LinearGradient ...>
    ...
  </LinearGradient>
</TouchableOpacity>
```

---

### Task 5: EventCard — Glassmorphism

**Files:**
- Modify: `mobile/src/components/EventCard.js`

Add glassmorphism style:
```js
import { glass, shadows, borderRadius, colors, fonts, spacing } from '../constants/theme'
```

Replace card style:
```js
card: {
  ...glass,
  borderRadius: borderRadius.xl,
  padding: spacing.md,
  marginBottom: spacing.md,
  ...shadows.md,
}
```

---

### Task 6: OrganisateurDashboardScreen — Real Stats & Ticket Numbering

**Files:**
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

Major rewrite:

```jsx
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getEvenementStats } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const { utilisateur, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadData()
    const unsubscribe = navigation.addListener('focus', loadData)
    return unsubscribe
  }, [navigation])

  async function loadData() {
    const evts = await getAllEvenements()
    setEvents(evts)
    const s = {}
    for (const e of evts) {
      s[e.id] = await getEvenementStats(e.id)
    }
    setStats(s)
  }

  const totalVendus = events.reduce((sum, e) => sum + (stats[e.id]?.totalVendus || 0), 0)
  const totalRecettes = events.reduce((sum, e) => sum + (stats[e.id]?.recettes || 0), 0)

  return (
    <ScrollView style={s.container}>
      <LinearGradient colors={gradients.hero} style={s.hero}>
        <Text style={s.greeting}>Bonjour 👋</Text>
        <Text style={s.email}>{utilisateur?.email || 'Organisateur'}</Text>
      </LinearGradient>

      <View style={s.statsRow}>
        <StatCard icon="🎟️" value={events.length} label="Événements" color={colors.accent} />
        <StatCard icon="🎫" value={totalVendus} label="Billets vendus" color={colors.green} />
        <StatCard icon="💰" value={`${(totalRecettes / 1000).toFixed(0)}k`} label="Recettes CFA" color={colors.rose} />
      </View>

      {events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>Aucun événement pour le moment</Text>
        </View>
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id
          return (
            <TouchableOpacity key={evt.id} style={s.eventCard} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.8}>
              <View style={s.eventHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventName}>{evt.nom}</Text>
                  <Text style={s.eventDate}>{evt.date} · Code: {evt.code}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▼' : '▶'}</Text>
              </View>

              {isOpen && st && (
                <View style={s.eventDetails}>
                  {/* Ventes par catégorie */}
                  <Text style={s.sectionTitle}>🎟️ Ventes par type</Text>
                  {st.vendusParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.vendus / Math.max(c.capacite, 1)) * 100}%`, backgroundColor: colors.accent }]} />
                      </View>
                      <Text style={s.barCount}>{c.vendus}/{c.capacite}</Text>
                    </View>
                  ))}

                  {/* Scans par catégorie */}
                  <Text style={s.sectionTitle}>📸 Scans par type</Text>
                  {st.scannesParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.scannes / Math.max(c.vendus, 1)) * 100}%`, backgroundColor: colors.green }]} />
                      </View>
                      <Text style={s.barCount}>{c.scannes}/{c.vendus}</Text>
                    </View>
                  ))}

                  <TouchableOpacity style={s.voirTicketsBtn}
                    onPress={() => navigation.navigate('VoirTickets', { eventId: evt.id })}>
                    <Text style={s.voirTicketsText}>Voir les tickets →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )
        })
      )}

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <BoutonPrincipal titre="Créer un événement" onPress={() => navigation.navigate('CreerEvenement')} />
        <TouchableOpacity onPress={deconnecter}>
          <Text style={s.logout}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { padding: spacing.xl, paddingTop: 60 },
  greeting: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.slate },
  email: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: -spacing.lg },
  statCard: {
    ...glass, borderRadius: borderRadius.lg, padding: spacing.md, flex: 1,
    ...shadows.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontFamily: fonts.outfit.bold, marginTop: spacing.xs },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.sm },
  eventCard: {
    ...glass, borderRadius: borderRadius.lg, marginHorizontal: spacing.lg,
    marginTop: spacing.md, padding: spacing.md, ...shadows.sm,
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventName: { fontSize: 17, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventDate: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  chevron: { fontSize: 14, color: colors.mid },
  eventDetails: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  sectionTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm, marginTop: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  barLabel: { width: 70, fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },
  barBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: 8, borderRadius: 4 },
  barCount: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTicketsBtn: { marginTop: spacing.md, alignSelf: 'flex-end' },
  voirTicketsText: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  logout: { textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.red, marginBottom: spacing.xxl },
})
```

---

### Task 7: TicketScreen — Premium Ticket Design with Numbering

**Files:**
- Modify: `mobile/src/screens/TicketScreen.js`

Replace with premium ticket design:

```jsx
import React from 'react'
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../constants/theme'

const { width } = Dimensions.get('window')
const TICKET_WIDTH = width - spacing.xl * 2

const STATUTS = {
  valide: { label: '✓ VALIDE', color: colors.green, bg: colors.greenLight },
  utilise: { label: '✗ UTILISÉ', color: colors.mid, bg: '#F1F5F9' },
  expire: { label: '✗ EXPIRÉ', color: colors.red, bg: '#FEF2F2' },
}

export default function TicketScreen({ route }) {
  const { ticket } = route.params
  const st = STATUTS[ticket.statut] || STATUTS.valide

  return (
    <ScrollView style={s.container}>
      <View style={s.ticket}>
        {/* Header with gradient */}
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.header}>
          <Text style={s.eventName}>{ticket.eventNom}</Text>
          <Text style={s.eventDate}>{ticket.eventDate}</Text>
        </LinearGradient>

        {/* QR Code section */}
        <View style={s.qrSection}>
          <View style={s.qrWrap}>
            <QRCode value={ticket.id} size={140} backgroundColor="white" color={colors.slate} />
          </View>
          <Text style={s.ticketNum}>{ticket.numero || 'TKT-000'}</Text>
        </View>

        {/* Perforation line */}
        <View style={s.perforation} />

        {/* Info grid */}
        <View style={s.infoGrid}>
          {[
            { label: 'Catégorie', value: ticket.categorie },
            { label: 'Prix', value: `${ticket.prix.toLocaleString()} CFA` },
            { label: 'Téléphone', value: ticket.telephone },
            { label: 'Statut', value: st.label, color: st.color },
          ].map((item, i) => (
            <View key={i} style={s.infoItem}>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={[s.infoValue, item.color && { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Date achat */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Acheté le {new Date(ticket.dateAchat).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: spacing.lg },
  ticket: {
    width: TICKET_WIDTH, alignSelf: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.lg,
  },
  header: { padding: spacing.lg, alignItems: 'center' },
  eventName: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.white },
  eventDate: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  qrSection: { alignItems: 'center', padding: spacing.lg },
  qrWrap: { padding: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, ...shadows.sm },
  ticketNum: { fontSize: 16, fontFamily: fonts.outfit.bold, color: colors.slate, marginTop: spacing.md, letterSpacing: 2 },
  perforation: { borderTopWidth: 2, borderTopColor: colors.border, borderStyle: 'dashed', marginHorizontal: spacing.lg },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg },
  infoItem: { width: '50%', paddingVertical: spacing.sm },
  infoLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginTop: 2 },
  footer: { alignItems: 'center', paddingBottom: spacing.lg },
  footerText: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.muted },
})
```

Update navigation in EventDetailScreen to pass the full ticket object with `numero`.

---

### Task 8: EventDetailScreen — Use eventService for ticket purchase

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

Add import:
```js
import { acheterTicket } from '../../services/eventService'
```

Replace the purchase logic:
```js
const handleAcheter = async () => {
  if (!selectedCategorie || !telephone) {
    Alert.alert('Erreur', 'Sélectionne une catégorie et entre ton téléphone')
    return
  }
  const cat = event.categories.find(c => c.id === selectedCategorie)
  if (!cat) return
  try {
    const ticket = await acheterTicket(event.id, selectedCategorie, telephone)
    navigation.navigate('Ticket', { ticket })
  } catch (e) {
    Alert.alert('Erreur', e.message)
  }
}
```

---

### Task 9: VoirTicketsScreen — Real data with numbering

**Files:**
- Modify: `mobile/src/screens/organisateur/VoirTicketsScreen.jsx`

Replace with real data from eventService:

```jsx
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getTicketsByEvent } from '../../services/eventService'

const STATUS_BADGE = {
  valide: { label: 'Valide', style: { backgroundColor: colors.greenLight, color: colors.green } },
  utilise: { label: 'Utilisé', style: { backgroundColor: '#F1F5F9', color: colors.mid } },
  expire: { label: 'Expiré', style: { backgroundColor: '#FEF2F2', color: colors.red } },
}

export default function VoirTicketsScreen({ route, navigation }) {
  const { eventId } = route.params || {}
  const [code, setCode] = useState('')
  const [event, setEvent] = useState(null)
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (eventId) loadEvent(eventId)
  }, [eventId])

  async function loadEvent(id) {
    const events = await getAllEvenements()
    const evt = events.find(e => e.id === id)
    if (evt) {
      setEvent(evt)
      const t = await getTicketsByEvent(id)
      setTickets(t)
    }
  }

  async function handleSearch() {
    const events = await getAllEvenements()
    const evt = events.find(e => e.code === code)
    if (!evt) {
      Alert.alert('Introuvable', 'Aucun événement avec ce code')
      return
    }
    setEvent(evt)
    const t = await getTicketsByEvent(evt.id)
    setTickets(t)
  }

  return (
    <ScrollView style={s.container}>
      {!event && (
        <View style={s.searchSection}>
          <Text style={s.searchTitle}>Code événement</Text>
          <TextInput style={s.codeInput} placeholder="0000"
            value={code} onChangeText={setCode}
            keyboardType="number-pad" maxLength={4} />
          <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
            <Text style={s.searchBtnText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      )}

      {event && (
        <>
          <View style={s.eventInfo}>
            <Text style={s.eventName}>{event.nom}</Text>
            <Text style={s.eventDate}>{event.date}</Text>
            <Text style={s.ticketCount}>{tickets.length} ticket(s)</Text>
          </View>

          {tickets.length === 0 ? (
            <Text style={s.empty}>Aucun ticket pour cet événement</Text>
          ) : (
            tickets.map((t, i) => {
              const badge = STATUS_BADGE[t.statut] || STATUS_BADGE.valide
              return (
                <View key={t.id} style={s.ticketRow}>
                  <Text style={s.ticketNumero}>{t.numero}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketCategorie}>{t.categorie}</Text>
                    <Text style={s.ticketTel}>{t.telephone}</Text>
                  </View>
                  <View style={[s.badge, badge.style]}>
                    <Text style={[s.badgeText, { color: badge.style.color }]}>{badge.label}</Text>
                  </View>
                </View>
              )
            })
          )}
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  searchSection: { paddingTop: spacing.xl, alignItems: 'center' },
  searchTitle: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.slate },
  codeInput: {
    ...glass, width: 120, height: 60, borderRadius: borderRadius.lg, marginTop: spacing.md,
    textAlign: 'center', fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.slate,
    ...shadows.sm,
  },
  searchBtn: {
    backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, marginTop: spacing.md,
  },
  searchBtnText: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.white },
  eventInfo: { marginBottom: spacing.lg },
  eventName: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate },
  eventDate: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent, marginTop: spacing.sm },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xl },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center', ...glass, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.accent, width: 90 },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
```

---

### Task 10: VoirTickets — Update navigation to pass eventId from Dashboard

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

Find `OrganisateurTabs` (or the stack) and ensure `VoirTickets` accepts `eventId` as initial param:
```jsx
<Stack.Screen name="VoirTickets" component={VoirTicketsScreen}
  initialParams={{ eventId: null }} />
```

---

### Task 11: Logo Component

**Files:**
- Create: `mobile/src/components/Logo.jsx`

```jsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, fonts } from '../constants/theme'

export default function Logo({ size = 40, showText = true }) {
  return (
    <View style={s.container}>
      <LinearGradient colors={gradients.primary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.icon, { width: size, height: size, borderRadius: size / 4 }]}>
        <Text style={[s.symbol, { fontSize: size * 0.5 }]}>🎫</Text>
      </LinearGradient>
      {showText && <Text style={[s.text, { fontSize: size * 0.55 }]}>SENGUICHET</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  symbol: { color: colors.white },
  text: { fontFamily: fonts.outfit.bold, color: colors.slate, letterSpacing: 2 },
})
```
