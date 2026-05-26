import { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../hooks/useTickets'
import EventCard from '../components/EventCard'
import BottomNav from '../components/BottomNav'

const EVENTS = [
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

export default function HomeScreen({ navigation }) {
  const { tickets, refresh } = useTickets()
  const { deconnecter } = useAuth()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh)
    return unsubscribe
  }, [navigation, refresh])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>SENGUICHET</Text>
              <Text style={styles.tagline}>Achetez vos billets en un clic</Text>
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
              <Feather name="log-out" size={18} color={colors.mid} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.heroCta} activeOpacity={0.9} onPress={() => navigation.navigate('EventSearch')}>
            <View style={styles.heroIcon}>
              <Feather name="shopping-cart" size={18} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Acheter un ticket</Text>
              <Text style={styles.heroSub}>Choisissez votre événement et payez en un clic</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={14} color={colors.slate} />
            <Text style={styles.sectionTitle}>Événements</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsRow}>
            {EVENTS.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('EventDetail', { event })}
              />
            ))}
          </ScrollView>

          {tickets.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={14} color={colors.slate} />
                <Text style={styles.sectionTitle}>Mes tickets</Text>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{tickets.length}</Text>
                </View>
              </View>

              {tickets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('Ticket', { ticket: t })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.ticketEmojiBox, { backgroundColor: t.bg || colors.greenLight }]}>
                    <Text style={styles.ticketEmoji}>{t.emoji || '🎫'}</Text>
                  </View>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle}>{t.eventTitle || t.eventNom}</Text>
                    <Text style={styles.ticketMeta}>{t.category || t.categorie} · {t.date || t.eventDate}</Text>
                  </View>
                  <View style={styles.ticketStatus}>
                    <View style={styles.dot} />
                    <Text style={styles.ticketLabel}>Prêt</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={styles.footer}>
            <Feather name="shield" size={11} color={colors.muted} />
            <Text style={styles.footerText}>Paiement Wave & Orange Money · Sans compte requis</Text>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  logo: {
    fontFamily: fonts.outfit.black,
    fontSize: 22,
    color: colors.slate,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  heroCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadows.md,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
    lineHeight: 15,
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

  eventsRow: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },

  ticketCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  ticketEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ticketEmoji: { fontSize: 20 },
  ticketInfo: { flex: 1 },
  ticketTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.slate,
    letterSpacing: -0.1,
  },
  ticketMeta: {
    fontSize: 11,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
  },
  ticketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  ticketLabel: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: '#16a34a',
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
