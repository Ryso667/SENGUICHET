// Écran d'accueil acheteur avec événements et tickets récents
// Affiche les événements à venir, les tickets actifs et un accès rapide à l'achat
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import BuyerLayout from '../components/BuyerLayout'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#059669', dot: '#059669' },
  en_attente: { label: 'EN ATTENTE', color: '#f59e0b', dot: '#f59e0b' },
  utilise: { label: 'UTILISÉ', color: '#64748b', dot: '#64748b' },
  rembourse: { label: 'REMBOURSÉ', color: '#dc2626', dot: '#dc2626' },
}

export default function HomeScreen({ navigation }) {
  const [evenements, setEvenements] = useState([])
  const [tickets, setTickets] = useState([])
  const { deconnecter, numeroTel, profil } = useAuth()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Support OTP (numeroTel) et social auth (profil.email)
      const identifiant = numeroTel || profil?.email
      if (identifiant) {
        const data = await mesBillets(identifiant)
        setTickets(data || [])
      }
      const events = await fetchEvenementsPublics()
      setEvenements(events.map(formaterPourEventCard))
    })
    return unsubscribe
  }, [navigation, numeroTel, profil])

  return (
    <BuyerLayout>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* En-tête avec logo et déconnexion */}
          <View style={styles.header}>
            <View>
              <LinearGradient colors={['#00C8FF', '#0077FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoGradient}>
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
            <LinearGradient colors={['#00C8FF', '#0077FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
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
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
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
                  key={t.numero || t.id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('Ticket', { ticket: t })}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={['#E0FFF0', '#D1FAE5']} style={styles.ticketEmojiBox}>
                    <MaterialCommunityIcons name="ticket-outline" size={20} color="#16a34a" />
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
