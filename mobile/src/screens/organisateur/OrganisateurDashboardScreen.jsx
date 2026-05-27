// Dashboard organisateur : stats, événements récents, navigation rapide
// Design jeune, friendly et premium
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getEvenementStats } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { formaterDateLisible } from '../../utils/dateUtils'

export default function OrganisateurDashboardScreen({ navigation }) {
  const { email, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadData()
    const unsubscribe = navigation.addListener('focus', loadData)
    return unsubscribe
  }, [navigation])

  async function loadData() {
    const evts = await getAllEvenements()
    const actifs = evts.filter(e => !e.supprime)
    setEvents(actifs)
    const s = {}
    for (const e of actifs) {
      s[e.id] = await getEvenementStats(e.id)
    }
    setStats(s)
  }

  const totalVendus = events.reduce((sum, e) => sum + (stats[e.id]?.totalVendus || 0), 0)
  const totalRecettes = events.reduce((sum, e) => sum + (stats[e.id]?.recettes || 0), 0)

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <Text style={s.greeting}>Salut 👋</Text>
        <Text style={s.email}>{email || 'Organisateur'}</Text>
        <Text style={s.subtitle}>Bienvenue sur ton tableau de bord</Text>
      </LinearGradient>

      <View style={s.statsRow}>
        <View style={[s.statCard, { borderLeftColor: '#6366F1' }]}>
          <Text style={s.statValue}>{events.length}</Text>
          <Text style={s.statLabel}>événements</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={s.statValue}>{totalVendus}</Text>
          <Text style={s.statLabel}>billets vendus</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#EC4899' }]}>
          <Text style={s.statValue}>{`${(totalRecettes / 1000).toFixed(0)}k`}</Text>
          <Text style={s.statLabel}>FCFA encaissés</Text>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Mes événements</Text>
        <Text style={s.sectionCount}>{events.length} au total</Text>
      </View>

      {events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎪</Text>
          <Text style={s.emptyTitle}>Aucun événement pour le moment</Text>
          <Text style={s.emptySub}>Crée ton premier événement pour commencer</Text>
        </View>
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id
          return (
            <TouchableOpacity key={evt.id} style={s.eventCard} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.8}>
              <View style={s.eventHeader}>
                <View style={s.eventBadge}>
                  <Text style={s.eventBadgeText}>{evt.nom.charAt(0)}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={s.eventName}>{evt.nom}</Text>
                  <Text style={s.eventMeta}>{formaterDateLisible(evt.date)} · Code: {evt.code}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </View>

              {isOpen && st && (
                <View style={s.eventDetails}>
                  <Text style={s.detailTitle}>Billets vendus</Text>
                  {st.vendusParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.vendus / Math.max(c.capacite, 1)) * 100}%` }]} />
                      </View>
                      <Text style={s.barCount}>{c.vendus}/{c.capacite}</Text>
                    </View>
                  ))}

                  <Text style={[s.detailTitle, { marginTop: spacing.md }]}>Scans à l'entrée</Text>
                  {st.scannesParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.scannes / Math.max(c.vendus, 1)) * 100}%`, backgroundColor: '#10B981' }]} />
                      </View>
                      <Text style={s.barCount}>{c.scannes}/{c.vendus}</Text>
                    </View>
                  ))}

                  <View style={s.eventActions}>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => navigation.navigate('VoirTickets', { eventId: evt.id })}
                    >
                      <Text style={s.actionBtnText}>Voir les tickets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => navigation.navigate('GestionEvenements')}
                    >
                      <Text style={s.actionBtnText}>Gérer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: -22 },
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
    marginBottom: spacing.sm, padding: spacing.md, ...shadows.sm,
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  eventBadgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  chevron: { fontSize: 16, color: colors.mid, marginLeft: spacing.sm },
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
  bottom: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  logout: { textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.red },
})
