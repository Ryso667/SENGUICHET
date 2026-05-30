// Dashboard organisateur : stats, événements récents, navigation rapide
// Design jeune, friendly et premium
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import Skeleton from '../../components/Skeleton'
import { formaterDateLisible } from '../../utils/dateUtils'

// Composant de compteur animé : passe de 0 à la valeur cible avec easing
function AnimatedStatValue({ value, suffix = '' }) {
  const animValue = useRef(new Animated.Value(0)).current
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    animValue.setValue(0)
    const listener = animValue.addListener(({ value: v }) => {
      setDisplay(`${Math.round(v)}${suffix}`)
    })
    Animated.timing(animValue, {
      toValue: value,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    return () => animValue.removeListener(listener)
  }, [value])

  return <Text style={s.statValue}>{display}</Text>
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const { user, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const unsubscribe = navigation.addListener('focus', loadData)
    return unsubscribe
  }, [navigation])

  // Charge les événements depuis le backend (API uniquement)
  async function loadData() {
    setLoading(true)
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
      const s = {}
      for (const e of evts) {
        s[e.id] = {
          totalVendus: e.remplis || 0,
          totalScannes: 0,
          recettes: e.revenus ? parseInt(e.revenus.replace(/\D/g, '')) || 0 : 0,
          capacite: e.capacite || 0,
        }
      }
      setStats(s)
    } catch {
      // Pas de fallback — l'organisateur a besoin du backend
    }
    setLoading(false)
  }

  const totalVendus = events.reduce((sum, e) => sum + (stats[e.id]?.totalVendus || 0), 0)
  const totalRecettes = events.reduce((sum, e) => sum + (stats[e.id]?.recettes || 0), 0)

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Bandeau héro avec dégradé Indigo → Rose */}
      <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <Text style={s.greeting}>Salut 👋</Text>
        <Text style={s.email}>{user?.nom || 'Organisateur'}</Text>
        <Text style={s.subtitle}>Bienvenue sur ton tableau de bord</Text>
      </LinearGradient>

      {/* Actions rapides : barre horizontale 3 boutons */}
      <View style={s.quickActions}>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('CreerEvenement')}>
          <Text style={s.quickIcon}>➕</Text>
          <Text style={s.quickLabel}>Créer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('VoirTickets', { eventId: null })}>
          <Text style={s.quickIcon}>🎫</Text>
          <Text style={s.quickLabel}>Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('GestionEvenements')}>
          <Text style={s.quickIcon}>⚙️</Text>
          <Text style={s.quickLabel}>Gérer</Text>
        </TouchableOpacity>
      </View>

      {/* Ligne des 3 statistiques avec skeleton pendant le chargement */}
      <View style={s.statsRow}>
        {loading ? (
          <>
            <View style={s.statCard}><Skeleton width="100%" height={40} borderRadius={8} /></View>
            <View style={s.statCard}><Skeleton width="100%" height={40} borderRadius={8} /></View>
            <View style={s.statCard}><Skeleton width="100%" height={40} borderRadius={8} /></View>
          </>
        ) : (
          <>
            <View style={[s.statCard, { borderLeftColor: '#6366F1' }]}>
              <AnimatedStatValue value={events.length} />
              <Text style={s.statLabel}>événements</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#10B981' }]}>
              <AnimatedStatValue value={totalVendus} />
              <Text style={s.statLabel}>billets vendus</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#EC4899' }]}>
              <AnimatedStatValue value={Math.round(totalRecettes / 1000)} suffix="k" />
              <Text style={s.statLabel}>FCFA encaissés</Text>
            </View>
          </>
        )}
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Mes événements</Text>
        <Text style={s.sectionCount}>{events.length} au total</Text>
      </View>

      {/* Skeletons pour la liste d'événements */}
      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Skeleton type="card" count={3} />
        </View>
      ) : events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎪</Text>
          <Text style={s.emptyTitle}>Aucun événement pour le moment</Text>
          <Text style={s.emptySub}>Crée ton premier événement pour commencer</Text>
        </View>
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id

          // Statut venant du backend (en_attente, actif, refuse, suspendu, annule)
          // ou calculé par date si absent
          const STATUT_COLORS = {
            actif: '#10B981', en_attente: '#F97316', refuse: '#EF4444',
            suspendu: '#F59E0B', annule: '#6B7280',
          }
          const STATUT_LABELS = {
            actif: 'Actif', en_attente: 'En attente', refuse: 'Refusé',
            suspendu: 'Suspendu', annule: 'Annulé',
          }
          const statutKey = evt.statut || (() => {
            const dateEvent = new Date(evt.date + 'T' + (evt.heure || '00:00'))
            const diffDays = Math.ceil((dateEvent - new Date()) / (1000 * 60 * 60 * 24))
            return diffDays < 0 ? 'annule' : 'actif'
          })()
          const statusColor = STATUT_COLORS[statutKey] || '#6B7280'

          // Calcul du pourcentage de remplissage
          const totalCapacite = st?.capacite || evt.capacite || 0
          const totalVendusEvt = st?.totalVendus || evt.remplis || 0
          const pct = totalCapacite > 0 ? (totalVendusEvt / totalCapacite) * 100 : 0

          // Barre de revenu : couleur selon le ratio par rapport au max
          const maxRevenue = Math.max(...events.map(e => stats[e.id]?.recettes || 0), 1)
          const revPct = (st?.recettes || 0) / maxRevenue
          const revColor = revPct > 0.7 ? '#10B981' : revPct > 0.3 ? '#F97316' : '#EF4444'

          return (
            <TouchableOpacity key={evt.id} style={s.eventCard} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.8}>
              <View style={s.eventHeader}>
                <View style={[s.eventBadge, { backgroundColor: statusColor }]}>
                  <Text style={s.eventBadgeText}>{evt.nom.charAt(0)}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={s.eventName}>{evt.nom}</Text>
                  <Text style={s.eventMeta}>{formaterDateLisible(evt.date)} · Code: {evt.code}</Text>
                </View>
                {/* Badge de statut backend (en_attente, actif, refuse, suspendu, annule) */}
                <View style={[s.pill, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[s.pillText, { color: statusColor }]}>{STATUT_LABELS[statutKey] || statutKey}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </View>

              {isOpen && st && (
                <View style={s.eventDetails}>
                  {/* Section remplissage avec cercle SVG de progression */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <Text style={s.detailTitle}>Remplissage</Text>
                    <View style={{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={54} height={54} viewBox="0 0 54 54">
                        <Circle cx={27} cy={27} r={24} stroke="#EEF2FF" strokeWidth={6} fill="none" />
                        <Circle
                          cx={27} cy={27} r={24} stroke="#6366F1" strokeWidth={6} fill="none"
                          strokeDasharray={`${2 * Math.PI * 24 * pct / 100} ${2 * Math.PI * 24 * (100 - pct) / 100}`}
                          strokeLinecap="round" transform="rotate(-90, 27, 27)"
                        />
                      </Svg>
                      <Text style={{ position: 'absolute', fontSize: 11, fontFamily: fonts.outfit.bold, color: colors.slate }}>{Math.round(pct)}%</Text>
                    </View>
                  </View>
                  {/* Barre de remplissage globale */}
                  <View style={s.barRow}>
                    <Text style={s.barLabel}>Vendus</Text>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.barCount}>{totalVendusEvt}/{totalCapacite}</Text>
                  </View>

                  <View style={s.eventActions}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('VoirTickets', { eventId: evt.id })}>
                      <Text style={s.actionBtnText}>Voir les tickets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('GestionEvenements')}>
                      <Text style={s.actionBtnText}>Gérer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Barre mince de niveau de revenu en bas de la carte */}
              <View style={[s.revBar, { backgroundColor: revColor }]} />
            </TouchableOpacity>
          )
        })
      )}

      <View style={s.bottom}>
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
  hero: { padding: spacing.xl, paddingTop: 60, paddingBottom: 50 },
  greeting: { fontSize: 32, fontFamily: fonts.outfit.bold, color: '#fff' },
  email: { fontSize: 15, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  // Barre d'actions rapides entre le hero et les stats
  quickActions: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: spacing.lg, marginTop: -16,
    borderRadius: 16, paddingVertical: spacing.md, ...shadows.sm,
  },
  quickBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { fontSize: 28, marginBottom: 4 },
  quickLabel: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    borderLeftWidth: 3, ...shadows.sm,
  },
  statValue: { fontSize: 26, fontFamily: fonts.outfit.bold, color: colors.slate },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  sectionCount: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate, textAlign: 'center' },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, textAlign: 'center', marginTop: spacing.xs },
  eventCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, marginHorizontal: spacing.lg,
    marginBottom: spacing.sm, padding: spacing.md, ...shadows.sm, overflow: 'hidden',
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  eventBadgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  // Badge de statut backend (en_attente, actif, etc.)
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  pillText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  chevron: { fontSize: 16, color: colors.mid, marginLeft: spacing.xs },
  eventDetails: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  detailTitle: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 70, fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },
  barBg: { flex: 1, height: 8, backgroundColor: '#eef2ff', borderRadius: 4, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  barCount: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, justifyContent: 'flex-end' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: borderRadius.md, backgroundColor: '#f1f5f9' },
  actionBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  // Barre de niveau de revenu en bas de chaque carte événement
  revBar: { height: 4, borderRadius: 2, marginTop: spacing.md, marginHorizontal: -spacing.md, marginBottom: -spacing.md },
  bottom: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  logout: { textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.red },
})
