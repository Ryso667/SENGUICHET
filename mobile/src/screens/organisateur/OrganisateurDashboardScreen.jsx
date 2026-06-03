// Tableau de bord organisateur : stats, événements récents, actions rapides
// Design glass (Apple Invites) — fond dégradé par catégorie, conteneurs verre dépoli
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, glass, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#00E5A0', bg: 'rgba(0,229,160,0.2)' },
  en_attente: { label: 'En attente', color: '#F97316', bg: 'rgba(249,115,22,0.2)' },
  refuse: { label: 'Refusé', color: '#FF4D6D', bg: 'rgba(255,77,109,0.2)' },
  termine: { label: 'Terminé', color: '#A0B4C8', bg: 'rgba(160,180,200,0.2)' },
  annule: { label: 'Annulé', color: '#6B7280', bg: 'rgba(107,114,128,0.2)' },
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [navCourant, setNavCourant] = useState(null)

function fmt(n) {
  return n.toLocaleString('fr-FR')
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
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
      CreerEvenement: { accent: colors.accent },
      Statistiques: { accent: '#00C8FF' },
      GestionEvenements: { accent: '#6B7280' },
    }
    return map[route] || { accent: '#6B7280' }
  }

  return (
    <View style={s.container}>
      <BlurBackground category="Conference" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor="#fff" />}
      >
        {/* Greeting */}
        <GlassContainer style={s.greeting}>
          <View style={s.headerRow}>
            <View style={s.avatarCircle}>
              <MaterialCommunityIcons name="account-tie" size={22} color="#fff" />
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
        </GlassContainer>

        <Text style={s.refreshHint}>↓ Tirez vers le bas pour actualiser</Text>

        {loading ? (
          <Text style={s.loading}>Chargement...</Text>
        ) : (
          <>
            <View style={s.statsRow}>
              {stats.map((st, i) => (
                <GlassContainer key={st.label} style={[s.statCard, { borderLeftColor: st.color, borderLeftWidth: 3 }]} intensity={40}>
                  <View style={s.statTop}>
                    <MaterialCommunityIcons name={st.icon} size={22} color={st.color} />
                    <Text style={s.statValue}>{st.value}</Text>
                  </View>
                  <Text style={s.statLabel}>{st.label}</Text>
                </GlassContainer>
              ))}
            </View>

            {/* Actions rapides — 3 cards horizontales */}
            <View style={s.quickSection}>
              <Text style={s.quickTitle}>Actions rapides</Text>
              <View style={s.quickRow}>
                {navItems.map(item => {
                  const style = stylesAction(item.route)
                  return (
                    <GlassContainer key={item.route} style={s.quickCard} intensity={35}>
                      <TouchableOpacity
                        style={s.quickTouchable}
                        activeOpacity={0.8}
                        onPress={() => naviguer(item.route)}
                      >
                        <MaterialCommunityIcons name={item.icon} size={24} color={style.accent} />
                        <Text style={[s.quickLabel, { color: style.accent }]}>{item.label}</Text>
                      </TouchableOpacity>
                    </GlassContainer>
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
              <GlassContainer style={s.empty} intensity={30}>
                <MaterialCommunityIcons name="tent" size={48} color="rgba(255,255,255,0.6)" />
                <Text style={s.emptyTitle}>Aucun événement</Text>
                <Text style={s.emptySub}>Crée ton premier événement</Text>
              </GlassContainer>
            ) : (
              recents.map((ev, i) => {
                const cfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.en_attente
                return (
                  <GlassContainer key={ev.id} style={s.eventCard} intensity={40}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('DetailEvenement', { eventId: ev.id })}
                    >
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

                      <View style={s.barRow}>
                        <View style={s.barBg}>
                          <View style={[s.barFill, { width: `${(ev.capacite || 1) > 0 ? ((ev.remplis || 0) / ev.capacite) * 100 : 0}%` }]} />
                        </View>
                        <Text style={s.barCount}>{fmt(ev.remplis || 0)} / {fmt(ev.capacite || 0)}</Text>
                      </View>

                      <View style={s.eventBottom}>
                        <Text style={s.revenu}>{ev.revenus || '0 FCFA'}</Text>
                      </View>
                    </TouchableOpacity>
                  </GlassContainer>
                )
              })
            )}

            {/* Déconnexion */}
            <GlassButton
              title="Se déconnecter"
              icon="log-out"
              onPress={() => Alert.alert('Déconnexion', 'Veux-tu te déconnecter ?', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Se déconnecter', style: 'destructive', onPress: deconnecter },
              ])}
              style={s.logoutBtn}
            />
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  quickSection: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  quickTitle: {
    fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff',
    marginBottom: spacing.sm, ...textShadow,
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickCard: { flex: 1, overflow: 'hidden' },
  quickTouchable: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  quickLabel: { fontSize: 13, fontFamily: fonts.outfit.semiBold },
  mainContent: { flex: 1 },
  greeting: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  bonjour: { fontSize: 22, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  sousTitre: {
    fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  ventes: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  refreshHint: {
    textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: fonts.jakarta.regular,
    paddingTop: spacing.sm, paddingBottom: 0, letterSpacing: 0.3,
  },
  loading: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: fonts.jakarta.regular, marginTop: 60 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  statCard: {
    flex: 1, minWidth: '45%',
    padding: spacing.md,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  statLabel: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', ...textShadow },
  voirTout: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.8)' },
  empty: { alignItems: 'center', paddingVertical: 60, marginHorizontal: spacing.lg, marginVertical: spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', marginTop: spacing.sm, ...textShadow },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: spacing.xs },
  eventCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  venteDate: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    marginTop: 2,
  },
  eventBadgeText: { fontSize: 20, fontFamily: fonts.outfit.bold, color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: spacing.sm },
  pillText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#00C8FF' },
  barCount: { width: 70, textAlign: 'right', fontSize: 11, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.7)', marginLeft: spacing.sm },
  eventBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: spacing.sm,
  },
  revenu: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
  logoutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
})
