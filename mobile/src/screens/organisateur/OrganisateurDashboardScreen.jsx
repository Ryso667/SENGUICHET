// Tableau de bord organisateur (calqué sur l'app web)
// Design glass (Apple Invites) — fond dégradé, conteneurs verre dépoli
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native'
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, categoryGradients, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { useTabBarScroll } from '../../context/TabBarScrollContext'
import { formaterDateLisible } from '../../utils/dateUtils'
import { LinearGradient } from 'expo-linear-gradient'
import { getCategoryImageUrl } from '../../config/images'
import GlassContainer from '../../components/GlassContainer'
import Skeleton from '../../components/Skeleton'
import { hexToRgba } from '../../utils/colors'

const getStatutConfig = (colors) => ({
  actif: { label: 'Actif', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  en_attente: { label: 'En attente', color: colors.orange, bg: hexToRgba(colors.orange, 0.15) },
  refuse: { label: 'Refusé', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
  termine: { label: 'Terminé', color: colors.textTertiary, bg: hexToRgba(colors.textTertiary, 0.15) },
  annule: { label: 'Annulé', color: colors.textSecondary, bg: hexToRgba(colors.textSecondary, 0.15) },
})

export default function OrganisateurDashboardScreen({ navigation }) {
  const { colors } = useTheme()
  const STATUT_CONFIG = useMemo(() => getStatutConfig(colors), [colors])
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { scrollY: tabScrollY } = useTabBarScroll()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fadeAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current
  const slideAnims = useRef([...Array(8)].map(() => new Animated.Value(40))).current

  useEffect(() => {
    Animated.stagger(80, fadeAnims.map((fa, i) =>
      Animated.parallel([
        Animated.timing(fa, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    )).start()
  }, [loading])

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const loadData = useCallback(async () => {
    try {
      const data = await fetchEvenementsAPI()
      setEvents(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const activeCount = events.filter(e => e.statut === 'actif').length
  const totalVendus = events.reduce((s, e) => s + (e.remplis || 0), 0)
  const totalCapacite = events.reduce((s, e) => s + (e.capacite || 0), 0)
  const totalRevenus = events.reduce((s, e) => {
    const num = parseInt(String(e.revenus || '0').replace(/\D/g, ''))
    return s + (isNaN(num) ? 0 : num)
  }, 0)

  const prochainEvent = events
    .filter(e => e.statut === 'actif')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  const recents = events.slice(0, 3)
  const fmt = (n) => n.toLocaleString('fr-FR')

  const stats = [
    { icon: 'ticket-outline', label: 'Total billets vendus', value: String(totalVendus) },
    { icon: 'cash', label: 'Revenus générés', value: `${fmt(totalRevenus)} FCFA` },
    { icon: 'calendar-check', label: 'Événements actifs', value: String(activeCount) },
    { icon: 'calendar-star', label: 'Prochain événement', value: prochainEvent?.nom || '—' },
  ]

  const statColors = [
    { color: colors.cyan,   icon: 'ticket-outline' },
    { color: colors.green,  icon: 'cash' },
    { color: colors.violet, icon: 'calendar-check' },
    { color: colors.orange, icon: 'calendar-star' },
  ]

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        onScroll={(e) => { tabScrollY.setValue(e.nativeEvent.contentOffset.y) }}
        scrollEventThrottle={16}
      >
        {/* Greeting — calqué sur le web : "Bonjour, {nom}" + date */}
        <GlassContainer style={s.greeting}>
          <View style={s.headerRow}>
            <Text style={s.emoji}>👋</Text>
            <Text style={s.bonjour}>Bonjour, {user?.nom || 'Organisateur'}</Text>
          </View>
          <Text style={s.dateText}>{today}</Text>
        </GlassContainer>

        {!loading && events.length > 0 && (
          <Text style={s.refreshHint}>↓ Tirer vers le bas pour actualiser</Text>
        )}

        {loading ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Skeleton type="card" count={4} />
          </View>
        ) : (
          <>
            {/* Stats cards — une carte par ligne avec bordure colorée gauche */}
            <View style={s.statsColumn}>
              {stats.map((st, i) => (
                <Animated.View key={st.label} style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
                  <GlassContainer style={s.statCard} borderLeftColor={statColors[i].color}>
                    <View style={s.statTop}>
                      <MaterialCommunityIcons name={st.icon} size={20} color={statColors[i].color} />
                      <Text style={s.statValue}>{st.value}</Text>
                    </View>
                    <Text style={s.statLabel}>{st.label}</Text>
                  </GlassContainer>
                </Animated.View>
              ))}
            </View>

            {/* Navigation rapide — remplace l'ancien drawer */}
            <GlassContainer style={s.navSection}>
              <Text style={s.navTitle}>Navigation rapide</Text>
              <View style={s.navGrid}>
                {[
                  { icon: 'calendar-month', label: 'Événements', route: 'Evenements', params: undefined, color: colors.primary },
                  { icon: 'chart-bar', label: 'Statistiques', route: 'Statistiques', params: undefined, color: colors.cyan },
                  { icon: 'file-document-outline', label: 'Demandes', route: 'Demandes', params: undefined, color: colors.orange },
                  { icon: 'bell-outline', label: 'Notifications', route: 'Notifications', params: undefined, color: colors.red },
                  { icon: 'headphones', label: 'Support', route: 'Support', params: undefined, color: colors.green },
                  { icon: 'cog-outline', label: 'Paramètres', route: 'Parametres', params: undefined, color: colors.violet },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.route}
                    style={s.navItem}
                    onPress={() => navigation.navigate(item.route, item.params)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.navIcon, { backgroundColor: hexToRgba(item.color, 0.15) }]}>
                      <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={s.navLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassContainer>

            {/* Section événements récents — calquée sur le web */}
            <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: slideAnims[4] }] }}>
            <GlassContainer style={s.recentSection}>
              <View style={s.recentHeader}>
                <Text style={s.recentTitle}>Mes événements récents</Text>
                {events.length > 3 && (
                  <TouchableOpacity onPress={() => navigation.navigate('Evenements')}>
                    <Text style={s.voirTout}>Voir tout</Text>
                  </TouchableOpacity>
                )}
              </View>

              {recents.length === 0 ? (
                <Text style={s.empty}>Aucun événement</Text>
              ) : (
                <View style={s.eventsGrid}>
                  {recents.map((ev, i) => {
                    const cfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.en_attente
                    const pct = Math.min(100, Math.round(((ev.remplis || 0) / (ev.capacite || 1)) * 100))
                    return (
                      <GlassContainer key={ev.id} style={s.eventCard}>
                        {/* Hero image avec dégradé de catégorie + overlay */}
                        <View style={s.eventHero}>
                          {ev.affiche_url || ev.categorie ? (
                            <Image source={{ uri: ev.affiche_url || getCategoryImageUrl(ev.categorie) }} style={s.eventHeroBg} resizeMode="cover" />
                          ) : (
                            <LinearGradient colors={categoryGradients[ev.categorie] || categoryGradients.default} style={s.eventHeroBg}>
                              <MaterialCommunityIcons name="image-outline" size={40} color="rgba(255,255,255,0.15)" />
                            </LinearGradient>
                          )}
                          <LinearGradient colors={['transparent', 'rgba(10,11,26,0.9)']} style={s.eventHeroOverlay} />
                          <View style={s.eventBadgeWrap}>
                            <View style={[s.eventBadge, { backgroundColor: cfg.bg }]}>
                              <Text style={[s.eventBadgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                          </View>
                          <View style={s.eventHeroBottom}>
                            <Text style={s.eventName} numberOfLines={1}>{ev.nom}</Text>
                            <Text style={s.eventMeta} numberOfLines={1}>
                              {formaterDateLisible(ev.date)} · {ev.lieu || 'Non spécifié'}
                            </Text>
                          </View>
                        </View>
                        {/* Contenu */}
                        <View style={s.eventBody}>
                          <View style={s.barRow}>
                            <View style={s.barBg}>
                              <View style={[s.barFill, { width: `${pct}%` }]} />
                            </View>
                            <Text style={s.barCount}>{ev.remplis || 0} / {ev.capacite || 0}</Text>
                          </View>
                          <View style={s.eventFooter}>
                            <Text style={s.revenu}>{ev.revenus || '0 FCFA'}</Text>
                            <TouchableOpacity
                              style={s.detailsBtn}
                              onPress={() => navigation.navigate('DetailEvenement', { eventId: ev.id })}
                              activeOpacity={0.8}
                            >
                              <Text style={s.detailsBtnText}>Détails</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </GlassContainer>
                    )
                  })}
                </View>
              )}
            </GlassContainer>
            </Animated.View>


          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const absoluteFill = StyleSheet.absoluteFill

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // Greeting
  greeting: { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bonjour: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.text, flex: 1 },
  dateText: {
    fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary,
    marginTop: spacing.xs, textTransform: 'capitalize',
  },
  refreshHint: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm, marginBottom: 0 },
  // Stats
  statsColumn: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.lg },
  statCard: { padding: spacing.md, minHeight: 80, justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.text, maxWidth: '70%', textAlign: 'right' },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  // Navigation rapide
  navSection: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md },
  navTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.md },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  navItem: { width: '30%', alignItems: 'center', gap: 6, paddingVertical: spacing.sm },
  navIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 11, fontFamily: fonts.jakarta.semiBold, color: colors.text, textAlign: 'center' },
  // Section événements récents
  recentSection: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  recentTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text },
  voirTout: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.text },
  empty: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, textAlign: 'center', paddingVertical: 30 },
  eventsGrid: { gap: spacing.md },
  // Carte événement
  eventCard: { overflow: 'hidden', borderRadius: 16 },
  eventHero: {
    height: 140, position: 'relative', overflow: 'hidden', justifyContent: 'flex-end',
  },
  eventHeroBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  eventHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  eventBadgeWrap: { position: 'absolute', top: 12, left: 12 },
  eventBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  eventBadgeLabel: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  eventHeroBottom: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  eventMeta: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  eventBody: { padding: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  barCount: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary },
  eventFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: spacing.sm,
  },
  revenu: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.green },
  detailsBtn: {
    backgroundColor: colors.accent + '26', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  detailsBtnText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.green },
})
