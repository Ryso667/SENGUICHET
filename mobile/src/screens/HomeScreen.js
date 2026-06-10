// Écran d'accueil acheteur — version Apple Invites
// Fond : image Unsplash plein écran + overlay
// Header : carte glass "Bonjour" avec compteur tickets
// Section : cartes événements horizontales animées
// Section : tickets récents en glass
// CTA : Explorer les événements en glass button
import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, Image, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, colors, spacing, borderRadius, glass, animations } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import BlurBackground, { optimiserUrlCloudinary } from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import EventCarousel from '../components/EventCarousel'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'

const hexToRgba = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const STATUTS = {
  actif: { label: 'VALIDE', color: colors.success, dot: colors.success },
  en_attente: { label: 'EN ATTENTE', color: colors.warning, dot: colors.warning },
  utilise: { label: 'UTILISÉ', color: colors.mid, dot: colors.mid },
  rembourse: { label: 'REMBOURSÉ', color: colors.danger, dot: colors.danger },
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [evenements, setEvenements] = useState([])
  const [tickets, setTickets] = useState([])
  const [category, setCategory] = useState(null)
  const [activeEvent, setActiveEvent] = useState(null)
  const { deconnecter, numeroTel, profil, email } = useAuth()
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
        setActiveEvent(formatted[0])
        // Précharge TOUTES les images dès le chargement pour éviter le délai au swipe
        formatted.forEach(ev => { if (ev.affiche_url) Image.prefetch(optimiserUrlCloudinary(ev.affiche_url)) })
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
      <BlurBackground
        category={activeEvent?.category || category}
        showImage={!!activeEvent?.affiche_url}
        afficheUrl={activeEvent?.affiche_url}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
        {/* Header Bonjour */}
        <Animated.View style={[styles.headerWrap, headerStyle]}>
          <GlassContainer style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Image
                source={{ uri: `https://backend-beta-six-39.vercel.app/uploads/logo.jpg` }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Bonjour</Text>
                <Text style={styles.name}>{profil?.nom || (email ? email.split('@')[0].replace(/\d+$/, '') : 'Invité')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('AccueilChoix')} style={styles.homeBtn}>
                <Feather name="home" size={18} color={colors.textWhiteMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={deconnecter} style={styles.logoutBtn}>
                <Feather name="log-out" size={16} color={colors.textWhiteMuted} />
              </TouchableOpacity>
            </View>
            {tickets.length > 0 && (
              <View style={styles.ticketCount}>
                <Feather name="tag" size={12} color={colors.green} />
                <Text style={styles.ticketCountText}>
                  {tickets.length} ticket{tickets.length > 1 ? 's' : ''} actif{tickets.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </GlassContainer>
        </Animated.View>

        {/* Section événements — carousel Apple-style */}
        {evenements.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>À découvrir</Text>
            </View>
            <EventCarousel
              events={evenements}
              onPress={(event) => navigation.navigate('EventDetail', { eventId: event.id, event })}
              onActiveIndexChange={(index) => {
                const ev = evenements[index]
                if (ev) setActiveEvent(ev)
              }}
            />
          </>
        )}

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
                    <View style={[styles.ticketDot, { backgroundColor: (STATUTS[t.statut]?.dot || colors.green) }]} />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>{t.eventNom || 'Événement'}</Text>
                      <Text style={styles.ticketMeta}>
                        {t.categorie} · {formaterDateLisible(t.eventDate)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: hexToRgba(STATUTS[t.statut]?.color || colors.green, 0.15) }]}>
                      <Text style={[styles.statusText, { color: STATUTS[t.statut]?.color || colors.green }]}>
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

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerCard: { padding: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 12, color: colors.textWhiteMuted, fontFamily: fonts.jakarta.regular },
  name: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.textWhite, letterSpacing: -0.3 },
  homeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,200,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,77,109,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ticketCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderLight,
  },
  ticketCountText: {
    fontSize: 12, fontFamily: fonts.jakarta.semiBold,
    color: colors.green,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: colors.textWhite, letterSpacing: -0.3,
  },
  voirTout: {
    fontSize: 12, fontFamily: fonts.jakarta.semiBold,
    color: colors.textWhiteMuted,
  },
  emptyText: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary, marginVertical: spacing.lg,
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
    fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.textWhite, letterSpacing: -0.1,
  },
  ticketMeta: {
    fontSize: 11, color: colors.textWhiteMuted, fontFamily: fonts.jakarta.regular, marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10, fontFamily: fonts.jakarta.semiBold,
  },
  ctaWrap: { paddingHorizontal: spacing.lg, marginTop: 24 },
})
