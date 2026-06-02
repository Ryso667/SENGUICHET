// Écran d'accueil acheteur — version Apple Invites
// Fond : image Unsplash plein écran + overlay
// Header : carte glass "Bonjour" avec compteur tickets
// Section : cartes événements horizontales animées
// Section : tickets récents en glass
// CTA : Explorer les événements en glass button
import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, colors, spacing, borderRadius, glass, animations, textShadow } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#00E5A0', dot: '#00E5A0' },
  en_attente: { label: 'EN ATTENTE', color: '#F97316', dot: '#F97316' },
  utilise: { label: 'UTILISÉ', color: '#94A3B8', dot: '#94A3B8' },
  rembourse: { label: 'REMBOURSÉ', color: '#FF4D6D', dot: '#FF4D6D' },
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [evenements, setEvenements] = useState([])
  const [tickets, setTickets] = useState([])
  const [category, setCategory] = useState(null)
  const { deconnecter, numeroTel, profil } = useAuth()
  const headerSpring = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(headerSpring, {
      toValue: 1,
      friction: animations.spring.friction,
      tension: animations.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [headerSpring])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const identifiant = numeroTel || profil?.email
      if (identifiant) {
        const data = await mesBillets(identifiant)
        setTickets(data || [])
      }
      const events = await fetchEvenementsPublics()
      const formatted = events.map(formaterPourEventCard)
      setEvenements(formatted)
      if (formatted.length > 0) {
        setCategory(formatted[0].category)
      }
    })
    return unsubscribe
  }, [navigation, numeroTel, profil])

  const headerStyle = {
    opacity: headerSpring,
    transform: [{ translateY: headerSpring.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={category} />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
        {/* Header Bonjour */}
        <Animated.View style={[styles.headerWrap, headerStyle]}>
          <GlassContainer style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Feather name="user" size={20} color="#fff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Bonjour</Text>
                <Text style={styles.name}>{profil?.nom || 'Invité'}</Text>
              </View>
              <TouchableOpacity onPress={deconnecter} style={styles.logoutBtn}>
                <Feather name="log-out" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            {tickets.length > 0 && (
              <View style={styles.ticketCount}>
                <Feather name="tag" size={12} color="#00E5A0" />
                <Text style={styles.ticketCountText}>
                  {tickets.length} ticket{tickets.length > 1 ? 's' : ''} actif{tickets.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </GlassContainer>
        </Animated.View>

        {/* Section événements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À découvrir</Text>
        </View>

        {evenements.length === 0 && (
          <Text style={styles.emptyText}>Aucun événement dispo pour le moment</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsRow}>
          {evenements.map((event, i) => (
            <AnimatedEventCard
              key={event.id}
              event={event}
              index={i}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
            />
          ))}
        </ScrollView>

        {/* Section mes tickets */}
        {tickets.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes tickets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MesTickets')}>
                <Text style={styles.voirTout}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticketsList}>
              {tickets.slice(0, 3).map((t, i) => (
                <TouchableOpacity
                  key={t.numero || t.id}
                  onPress={() => navigation.navigate('Ticket', { ticket: t })}
                  activeOpacity={0.7}
                >
                  <GlassContainer style={styles.ticketCard} intensity={40}>
                    <View style={[styles.ticketDot, { backgroundColor: (STATUTS[t.statut]?.dot || '#00E5A0') }]} />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>{t.eventNom || 'Événement'}</Text>
                      <Text style={styles.ticketMeta}>
                        {t.categorie} · {formaterDateLisible(t.eventDate)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUTS[t.statut]?.color || '#00E5A0'}25` }]}>
                      <Text style={[styles.statusText, { color: STATUTS[t.statut]?.color || '#00E5A0' }]}>
                        {STATUTS[t.statut]?.label || 'VALIDE'}
                      </Text>
                    </View>
                  </GlassContainer>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* CTA Explorer */}
        <View style={styles.ctaWrap}>
          <GlassButton
            title="Explorer les événements"
            icon="search"
            onPress={() => navigation.navigate('EventSearch')}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Paiement Wave & Orange Money · Sans compte requis</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f2a' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerCard: { padding: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.jakarta.regular },
  name: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ticketCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderLight,
  },
  ticketCountText: {
    fontSize: 11, fontFamily: fonts.jakarta.semiBold,
    color: '#00E5A0',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3,
    ...textShadow,
  },
  voirTout: {
    fontSize: 12, fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyText: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.6)', marginVertical: spacing.lg,
  },
  eventsRow: { paddingLeft: spacing.lg, paddingRight: spacing.lg },
  ticketsList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  ticketDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  ticketInfo: { flex: 1 },
  ticketTitle: {
    fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff', letterSpacing: -0.1,
  },
  ticketMeta: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.jakarta.regular, marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10, fontFamily: fonts.jakarta.semiBold,
    ...textShadow,
  },
  ctaWrap: { paddingHorizontal: spacing.lg, marginTop: 24 },
  footer: {
    textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.jakarta.regular, marginTop: 24, marginBottom: spacing.sm,
  },
})
