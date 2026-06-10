// Tableau de bord organisateur (calqué sur l'app web)
// Design glass (Apple Invites) — fond dégradé, conteneurs verre dépoli
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fonts, categoryGradients } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'
import { LinearGradient } from 'expo-linear-gradient'
import { getCategoryImageUrl } from '../../config/images'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'
import Skeleton from '../../components/Skeleton'

// Convertisseur hex → rgba pour fonds glass translucides
const hexToRgba = (hex, a) => {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${a})`
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  en_attente: { label: 'En attente', color: '#F97316', bg: 'rgba(249,115,22,0.2)' },
  refuse: { label: 'Refusé', color: '#FF4D6D', bg: 'rgba(255,77,109,0.2)' },
  termine: { label: 'Terminé',     color: '#B0B0B8', bg: 'rgba(176,176,184,0.2)' },
  annule: { label: 'Annulé', color: '#6B7280', bg: 'rgba(107,114,128,0.2)' },
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
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
    { icon: 'flower', label: 'Revenus générés', value: `${fmt(totalRevenus)} FCFA` },
    { icon: 'calendar-check', label: 'Événements actifs', value: String(activeCount) },
    { icon: 'calendar-star', label: 'Prochain événement', value: prochainEvent?.nom || '—' },
  ]

  const statColors = [
    ['rgba(0,200,255,0.25)', 'rgba(0,200,255,0.1)'],
    ['rgba(0,229,160,0.25)', 'rgba(0,200,255,0.1)'],
    ['rgba(99,102,241,0.25)', 'rgba(236,72,153,0.1)'],
    ['rgba(249,115,22,0.25)', 'rgba(245,158,11,0.1)'],
  ]

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
      >
        {/* Greeting — calqué sur le web : "Bonjour, {nom}" + date */}
        <GlassContainer blurType="light" style={s.greeting}>
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
            {/* Stats cards — une carte par ligne (évite débordement des chiffres) */}
            <View style={s.statsColumn}>
              {stats.map((st, i) => (
                <Animated.View key={st.label} style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
                  <GlassContainer blurType="light" style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: statColors[i][0].replace('0.25', '1') }]} intensity={40}>
                    <LinearGradient colors={[statColors[i][0], statColors[i][1]]} style={s.statGradient}>
                      <View style={s.statTop}>
                        <MaterialCommunityIcons name={st.icon} size={20} color={colors.text} />
                        <Text style={s.statValue}>{st.value}</Text>
                      </View>
                      <Text style={s.statLabel}>{st.label}</Text>
                    </LinearGradient>
                  </GlassContainer>
                </Animated.View>
              ))}
            </View>

            {/* Section événements récents — calquée sur le web */}
            <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: slideAnims[4] }] }}>
            <GlassContainer blurType="light" style={s.recentSection}>
              <View style={s.recentHeader}>
                <Text style={s.recentTitle}>Mes événements récents</Text>
                {events.length > 3 && (
                  <TouchableOpacity onPress={() => navigation.navigate('MesEvenementsTab')}>
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
                      <GlassContainer blurType="light" key={ev.id} style={s.eventCard}>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
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
  statGradient: { padding: spacing.md, borderRadius: 16, minHeight: 80, justifyContent: 'space-between' },
  statsColumn: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.lg },
  statCard: { padding: 0, overflow: 'hidden' },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.text, maxWidth: '70%', textAlign: 'right' },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  // Section événements récents
  recentSection: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  recentTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text },
  voirTout: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.accent },
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
  barBg: { flex: 1, height: 8, backgroundColor: colors.inputBorder, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  barCount: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary },
  eventFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: spacing.sm,
  },
  revenu: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  detailsBtn: {
    backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  detailsBtnText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.accent },
})
