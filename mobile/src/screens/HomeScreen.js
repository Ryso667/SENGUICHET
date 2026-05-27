// Écran d'accueil acheteur avec événements et tickets récents
// Affiche les événements à venir, les tickets actifs et un accès rapide à l'achat
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../hooks/useTickets'
import EventCard from '../components/EventCard'
import BuyerLayout from '../components/BuyerLayout'
import { getDefaultImage } from '../config/images'
import { formaterBadgeDate, formaterDateLisible } from '../utils/dateUtils'

const STATUTS = {
  valide: { label: 'VALIDE', color: '#059669', dot: '#059669' },
  utilise: { label: 'UTILISÉ', color: '#64748b', dot: '#64748b' },
  expire: { label: 'EXPIRÉ', color: '#dc2626', dot: '#dc2626' },
}

// Sera remplacé par API : événements mockés en attente du backend
const MOCKS = [
  {
    id: 'dmf-2026', title: 'Dakar Music Festival',
    month: 'MAI', day: '24', emoji: '🎶', bg: '#6d28d9',
    priceLabel: '5 000F – 15 000F',
    location: 'Monument Renaissance',
    category: 'Concert', date: '24 Mai 2026', time: '19h00',
    desc: 'Le plus grand festival de musique à Dakar.',
    tickets: [
      { id: 'standard', name: 'Entrée Standard', price: 5000, desc: 'Générale' },
      { id: 'vip', name: 'VIP Carré Or', price: 15000, desc: 'Vue scène + Boisson' },
    ],
  },
  {
    id: 'starlight', title: 'Soirée Starlight',
    month: 'JUIN', day: '02', emoji: '✨', bg: '#0284c7',
    priceLabel: '10 000F',
    location: 'Grand Théâtre',
    category: 'Soirée', date: '02 Juin 2026', time: '21h00',
    desc: 'Une soirée magique sous les étoiles.',
    tickets: [
      { id: 'standard', name: 'Entrée Standard', price: 10000, desc: 'Accès soirée' },
    ],
  },
]

// Transforme un événement stocké (AsyncStorage) au format d'affichage HomeScreen
// Sera remplacé par API : mapping backend → UI
function formaterEvenement(e) {
  if (e.tickets) return e
  const def = getDefaultImage(e.categorie)
  const { day, month } = formaterBadgeDate(e.date)
  const prices = (e.categories || []).map(c => c.prix).filter(p => p != null)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  const priceLabel = prices.length > 1 ? `${min.toLocaleString()}F – ${max.toLocaleString()}F`
    : prices.length === 1 ? `${min.toLocaleString()}F`
    : '—'
  return {
    id: e.id, title: e.nom || '', month, day,
    emoji: def.emoji, bg: def.bg, priceLabel,
    location: e.lieu || '', category: e.categorie || '',
    date: e.date || '', time: e.heure || '', desc: e.description || '',
    tickets: (e.categories || []).map(c => ({ id: c.id, name: c.nom, price: c.prix, desc: '' })),
  }
}

export default function HomeScreen({ navigation }) {
  const [evenements, setEvenements] = useState(MOCKS)
  const { tickets, refresh } = useTickets()
  const { deconnecter } = useAuth()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      refresh()
      try {
        const raw = await AsyncStorage.getItem('@senguichet_evenements')
        const stored = raw ? JSON.parse(raw) : []
        const uniques = []
        const seenIds = new Set()
        for (const s of stored) {
          if (!seenIds.has(s.id)) { seenIds.add(s.id); uniques.push(s) }
        }
        const formats = uniques.map(e => {
          const f = formaterEvenement(e)
          // Migration : comble les champs manquants depuis les MOCKS
          // (événements sauvegardés avant l'ajout de lieu, heure, desc, catégorie)
          if (!f.time || !f.location || !f.desc) {
            const mock = MOCKS.find(m => m.id === f.id)
            if (mock) {
              if (!f.time) f.time = mock.time
              if (!f.location) f.location = mock.location
              if (!f.desc) f.desc = mock.desc
              if (!f.emoji || f.emoji === '📅') f.emoji = mock.emoji
              if (f.bg === '#6366F1') f.bg = mock.bg
            }
          }
          return f
        })
        const mocksUniques = MOCKS.filter(m => !seenIds.has(m.id))
        setEvenements([...formats, ...mocksUniques])
      } catch (e) {
        console.warn('Failed to load events', e)
      }
    })
    return unsubscribe
  }, [navigation, refresh])

  return (
    <BuyerLayout>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* En-tête avec logo et déconnexion */}
          <View style={styles.header}>
            <View>
              <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoGradient}>
                <Text style={styles.logoText}>SENGUICHET</Text>
              </LinearGradient>
              <Text style={styles.welcome}>
                {tickets.length > 0
                  ? `${tickets.length} ticket${tickets.length > 1 ? 's' : ''} actif${tickets.length > 1 ? 's' : ''}`
                  : 'Aucun ticket actif'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Déconnexion',
                'Revenir à l\'authentification ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'OK', onPress: deconnecter },
                ]
              )}
            >
              <View style={styles.logoutBtn}>
                <Feather name="log-out" size={16} color={colors.mid} />
              </View>
            </TouchableOpacity>
          </View>

          {/* CTA principal premium */}
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.9} onPress={() => navigation.navigate('EventSearch')}>
            <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
              <View style={styles.heroRow}>
                <View style={styles.heroIcon}>
                  <Feather name="shopping-cart" size={20} color="#fff" />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Acheter un ticket</Text>
                  <Text style={styles.heroSub}>Choisis ton événement, paie en un clic</Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Section événements */}
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={15} color={colors.slate} />
            <Text style={styles.sectionTitle}>Événements</Text>
          </View>

          {evenements.length === 0 && (
            <Text style={styles.emptyEvents}>Aucun événement dispo pour le moment</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsRow}>
            {evenements.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('EventDetail', { event })}
              />
            ))}
          </ScrollView>

          {/* Section mes tickets */}
          {tickets.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={15} color={colors.slate} />
                <Text style={styles.sectionTitle}>Mes tickets</Text>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{tickets.length}</Text>
                </View>
              </View>

              {tickets.slice(0, 3).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('Ticket', { ticket: t })}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.ticketEmojiBox}>
                    <Text style={styles.ticketEmoji}>🎫</Text>
                  </LinearGradient>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle}>{t.eventNom}</Text>
                    <Text style={styles.ticketMeta}>{t.categorie} · {formaterDateLisible(t.eventDate)}</Text>
                  </View>
                  <View style={styles.ticketStatus}>
                    <View style={[styles.dot, { backgroundColor: (STATUTS[t.statut]?.dot || '#059669') }]} />
                    <Text style={[styles.ticketLabel, { color: (STATUTS[t.statut]?.color || '#059669') }]}>
                      {STATUTS[t.statut]?.label || 'VALIDE'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {tickets.length > 3 && (
                <TouchableOpacity style={styles.viewAll} onPress={() => navigation.navigate('MesTickets')}>
                  <Text style={styles.viewAllText}>Voir tout ({tickets.length})</Text>
                  <Feather name="chevron-right" size={12} color={colors.accent} />
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={styles.footer}>
            <Feather name="shield" size={11} color={colors.muted} />
            <Text style={styles.footerText}>Paiement Wave & Orange Money · Sans compte requis</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },

  // Header premium
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  logoGradient: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logoText: {
    fontFamily: fonts.outfit.black,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  welcome: {
    fontSize: 13,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
    marginTop: 6,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  // Hero CTA premium
  heroCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: '#fff',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.lg,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: colors.slate,
    flex: 1,
    letterSpacing: -0.2,
  },
  sectionCount: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    color: colors.mid,
    fontFamily: fonts.jakarta.semiBold,
  },

  emptyEvents: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: colors.mid, marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  eventsRow: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },

  ticketCard: {
    marginHorizontal: spacing.lg, backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: spacing.sm, ...shadows.sm,
  },
  ticketEmojiBox: {
    width: 40, height: 40, borderRadius: borderRadius.sm,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  ticketEmoji: { fontSize: 20 },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, letterSpacing: -0.1 },
  ticketMeta: { fontSize: 11, color: colors.mid, fontFamily: fonts.jakarta.regular, marginTop: 2 },
  ticketStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  ticketLabel: { fontSize: 10, fontFamily: fonts.jakarta.semiBold, color: '#16a34a' },
  viewAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingVertical: spacing.sm, backgroundColor: colors.white,
    borderRadius: borderRadius.md, ...shadows.sm,
  },
  viewAllText: {
    fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.accent,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
  },
})
