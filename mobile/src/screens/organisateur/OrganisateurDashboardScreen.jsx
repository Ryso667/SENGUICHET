// Tableau de bord organisateur : stats, événements récents, actions rapides
// Design inspiré du dashboard web — propre et minimal
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#00E5A0', bg: '#E0FFF0' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#FF4D6D', bg: '#FFE8EC' },
  termine: { label: 'Terminé', color: '#A0B4C8', bg: '#F0F3F8' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const { user, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [navCourant, setNavCourant] = useState(null)

  useEffect(() => {
    loadData()
    const unsub = navigation.addListener('focus', loadData)
    return unsub
  }, [navigation])

  async function loadData() {
    setLoading(true)
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
    } catch {}
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const actifs = events.filter(e => e.statut === 'actif').length
  const totalVendus = events.reduce((s, e) => s + (e.remplis || 0), 0)
  const totalCapacite = events.reduce((s, e) => s + (e.capacite || 0), 0)
  const totalRevenus = events.reduce((s, e) => {
    if (!e.revenus) return s
    return s + (parseInt(String(e.revenus).replace(/\D/g, '')) || 0)
  }, 0)
  const tauxRemplissage = totalCapacite > 0 ? Math.round((totalVendus / totalCapacite) * 100) : 0
  const recents = events.slice(0, 3)

  const fmt = (n) => n.toLocaleString('fr-FR')

  const stats = [
    { icon: 'calendar-check', label: 'Événements actifs', value: String(actifs), color: '#00C8FF' },
    { icon: 'ticket-outline', label: 'Billets vendus', value: fmt(totalVendus), color: '#00E5A0' },
    { icon: 'cash', label: 'Revenus total', value: `${fmt(totalRevenus)} FCFA`, color: '#0077FF' },
    { icon: 'account-group', label: 'Taux de remplissage', value: `${tauxRemplissage}%`, color: '#F97316' },
  ]

  const navItems = [
    { icon: 'plus-circle-outline', label: 'Créer', route: 'CreerEvenement' },
    { icon: 'chart-box-outline', label: 'Stats', route: 'Statistiques' },
    { icon: 'cog-outline', label: 'Gérer', route: 'GestionEvenements' },
  ]

  const naviguer = (route) => {
    setNavCourant(route)
    navigation.navigate(route)
  }

  const totalEvents = events.length
  const enAttente = events.filter(e => e.statut === 'en_attente').length

  const stylesAction = (route) => {
    const map = {
      CreerEvenement: { bg: '#EEF0FF', accent: colors.accent },
      Statistiques: { bg: '#E8F4FF', accent: '#00C8FF' },
      GestionEvenements: { bg: '#F0F3F8', accent: '#6B7280' },
    }
    return map[route] || { bg: '#F0F3F8', accent: '#6B7280' }
  }

  return (
    <View style={s.container}>
      <ScrollView
        style={s.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
      >
        {/* Greeting */}
        {/* En-tête dégradé pastel Cyan */}
        <LinearGradient colors={['rgba(0,200,255,0.09)', 'rgba(0,119,255,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.greeting}>
          <View style={s.headerRow}>
            <View style={s.avatarCircle}>
              <MaterialCommunityIcons name="account-tie" size={22} color={colors.accent} />
            </View>
            <View style={s.headerText}>
              <Text style={s.bonjour}>Bonjour, {user?.nom || 'Organisateur'}</Text>
              <Text style={s.sousTitre}>
                {totalEvents > 0
                  ? `${totalEvents} événement${totalEvents > 1 ? 's' : ''}`
                  : enAttente > 0 ? `${enAttente} en attente`
                  : 'Aucun événement'}
              </Text>
            </View>
          </View>
          {/* Sous-titre contextuel : répartition par statut */}
          {totalEvents > 0 && (
            <View style={s.statsPills}>
              {actifs > 0 && (
                <View style={[s.statPill, { backgroundColor: 'rgba(0,229,160,0.15)' }]}>
                  <Text style={[s.statPillText, { color: '#00E5A0' }]}>{actifs} actif{actifs > 1 ? 's' : ''}</Text>
                </View>
              )}
              {enAttente > 0 && (
                <View style={[s.statPill, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                  <Text style={[s.statPillText, { color: '#F97316' }]}>{enAttente} en attente</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Indicateur de pull-to-refresh */}
        <Text style={s.refreshHint}>↓ Tirez vers le bas pour actualiser</Text>

        {/* Stats grid */}
        {loading ? (
          <Text style={s.loading}>Chargement...</Text>
        ) : (
          <>
            <View style={s.statsRow}>
              {stats.map((st, i) => (
                <View key={st.label} style={[s.statCard, { borderLeftColor: st.color }]}>
                  <View style={s.statTop}>
                     <MaterialCommunityIcons name={st.icon} size={22} color={st.color} />
                    <Text style={s.statValue}>{st.value}</Text>
                  </View>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>

            {/* Actions rapides — 3 cards horizontales */}
            <View style={s.quickSection}>
              <Text style={s.quickTitle}>Actions rapides</Text>
              <View style={s.quickRow}>
                {navItems.map(item => {
                  const style = stylesAction(item.route)
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[s.quickCard, { backgroundColor: style.bg }]}
                      activeOpacity={0.8}
                      onPress={() => naviguer(item.route)}
                    >
                       <MaterialCommunityIcons name={item.icon} size={24} color={style.accent} />
                      <Text style={[s.quickLabel, { color: style.accent }]}>{item.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Recent events */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Mes événements récents</Text>
              {events.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate('GestionEvenements')}>
                  <Text style={s.voirTout}>Voir tout</Text>
                </TouchableOpacity>
              )}
            </View>

            {recents.length === 0 ? (
              <View style={s.empty}>
                <MaterialCommunityIcons name="tent" size={48} color={colors.mid} />
                <Text style={s.emptyTitle}>Aucun événement</Text>
                <Text style={s.emptySub}>Crée ton premier événement</Text>
              </View>
            ) : (
              recents.map((ev, i) => {
                const cfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.en_attente
                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={s.eventCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('DetailEvenement', { eventId: ev.id })}
                  >
                    {/* Badge + event info */}
                    <View style={s.eventTop}>
                      <View style={s.eventHeader}>
                        <View style={[s.eventBadge, { backgroundColor: cfg.color }]}>
                          <Text style={s.eventBadgeText}>{ev.nom?.charAt(0)}</Text>
                        </View>
                        <View style={s.eventInfo}>
                          <Text style={s.eventName} numberOfLines={1}>{ev.nom}</Text>
                          <Text style={s.eventMeta} numberOfLines={1}>
                            {formaterDateLisible(ev.date)} · {ev.lieu || 'Non spécifié'}
                          </Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: cfg.bg }]}>
                          <Text style={[s.pillText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Fill bar */}
                    <View style={s.barRow}>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(ev.capacite || 1) > 0 ? ((ev.remplis || 0) / ev.capacite) * 100 : 0}%` }]} />
                      </View>
                      <Text style={s.barCount}>{fmt(ev.remplis || 0)} / {fmt(ev.capacite || 0)}</Text>
                    </View>

                    {/* Revenue */}
                    <View style={s.eventBottom}>
                      <Text style={s.revenu}>{ev.revenus || '0 FCFA'}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })
            )}

            {/* Déconnexion */}
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={() => Alert.alert('Déconnexion', 'Veux-tu te déconnecter ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Se déconnecter', style: 'destructive', onPress: deconnecter },
              ])}
            >
              <Text style={s.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  quickSection: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  quickTitle: {
    fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate,
    marginBottom: spacing.sm,
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickCard: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 13, fontFamily: fonts.outfit.semiBold },
  mainContent: { flex: 1 },
  greeting: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,200,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  bonjour: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  sousTitre: {
    fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid,
    marginTop: 2,
  },
  statsPills: {
    flexDirection: 'row', gap: spacing.sm,
    paddingTop: spacing.sm, paddingLeft: 60,
  },
  statPill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  statPillText: {
    fontSize: 11, fontFamily: fonts.outfit.semiBold,
  },
  refreshHint: {
    textAlign: 'center', color: colors.muted, fontSize: 11, fontFamily: fonts.jakarta.regular,
    paddingTop: spacing.sm, paddingBottom: 0, letterSpacing: 0.3,
  },
  loading: { textAlign: 'center', color: colors.mid, fontSize: 14, fontFamily: fonts.jakarta.regular, marginTop: 60 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: borderRadius.lg,
    padding: spacing.md, borderLeftWidth: 3, ...shadows.sm,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate },
  statLabel: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTout: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xs },
  eventCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, padding: spacing.md, ...shadows.sm,
  },
  eventTop: { marginBottom: spacing.sm },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventBadge: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.md,
  },
  eventBadgeText: { fontSize: 20, fontFamily: fonts.outfit.bold, color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: spacing.sm },
  pillText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: '#E8F4FF', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#00C8FF' },
  barCount: { width: 70, textAlign: 'right', fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.mid, marginLeft: spacing.sm },
  eventBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
  },
  revenu: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.lg },
  logoutText: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#FF4D6D' },
})
