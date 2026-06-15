// Détail d'un événement (lecture seule)
// Design glass (Apple Invites)
import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fonts, borderRadius } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import { formaterDateLisible } from '../../utils/dateUtils'
import Skeleton from '../../components/Skeleton'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
import { hexToRgba } from '../../utils/colors'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  en_attente: { label: 'En attente', color: '#FFA726', bg: 'rgba(255,167,38,0.2)' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
  annule: { label: 'Annulé', color: '#6B7280', bg: 'rgba(107,114,128,0.2)' },
}

export default function DetailEvenementScreen({ route }) {
  const insets = useSafeAreaInsets()
  const { eventId } = route.params || {}
  const [evenement, setEvenement] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {}
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {}
    setRefreshing(false)
  }, [eventId])

  if (loading) {
    return (
      <View style={s.container}>
        <OrganisateurLayout />
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  if (!evenement) {
    return (
      <View style={s.center}>
        <OrganisateurLayout />
        <Text style={s.errorText}>Événement introuvable</Text>
      </View>
    )
  }

  const cfg = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.en_attente
  const pct = Math.min(100, Math.round(((evenement.remplis || 0) / (evenement.capacite || 1)) * 100))

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A56DB" colors={["#1A56DB"]} />}>
        <GlassContainer blurType="light" style={s.header} intensity={35}>
          <Text style={s.title}>{evenement.nom}</Text>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </GlassContainer>

        <View style={s.infoGrid}>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Date</Text>
            <Text style={s.infoValue}>{formaterDateLisible(evenement.date)}</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Lieu</Text>
            <Text style={s.infoValue}>{evenement.lieu || 'Non spécifié'}</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Capacité</Text>
            <Text style={s.infoValue}>{evenement.capacite || 0} places</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Code contrôleur</Text>
            <Text style={[s.infoValue, { fontFamily: 'monospace', letterSpacing: 4, color: colors.text }]}>{evenement.code || '-'}</Text>
          </GlassContainer>
        </View>

        <GlassContainer blurType="light" style={s.fillSection} intensity={35}>
          <Text style={s.fillTitle}>Remplissage</Text>
          <View style={s.barRow}>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.barCount}>{evenement.remplis || 0}/{evenement.capacite || 0}</Text>
          </View>
          <Text style={s.fillPct}>{pct}%</Text>
        </GlassContainer>

        {evenement.description ? (
          <GlassContainer blurType="light" style={s.section} intensity={30}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.description}>{evenement.description}</Text>
          </GlassContainer>
        ) : null}


        <GlassContainer blurType="light" style={s.section} intensity={30}>
          <Text style={s.sectionTitle}>Billets ({tickets.length})</Text>
          {tickets.length === 0 ? (
            <Text style={s.empty}>Aucun billet vendu</Text>
          ) : (
            tickets.map(t => (
              <View key={t.id} style={s.ticketRow}>
                <Text style={s.ticketCategorie}>{t.categorie || t.nom}</Text>
                <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
                <Text style={s.ticketStatut}>{t.statut || 'valide'}</Text>
              </View>
            ))
          )}
        </GlassContainer>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: spacing.lg, padding: spacing.md,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  infoCard: {
    width: '47%', padding: spacing.md,
  },
  infoLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.text, marginTop: 4 },
  fillSection: { margin: spacing.lg, padding: spacing.md },
  fillTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.accent },
  barCount: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary },
  fillPct: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.text, marginTop: spacing.sm },
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, lineHeight: 22 },
  empty: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, flex: 1 },
  ticketPrix: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.green },
  ticketStatut: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(0,0,0,0.35)', marginLeft: spacing.sm, textTransform: 'capitalize' },
})
