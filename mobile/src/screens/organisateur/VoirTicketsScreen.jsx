// Consultation des tickets d'un événement (lecture seule)
// Design glass (Apple Invites)
import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, borderRadius, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { fetchEvenementDetailAPI, fetchEvenementBilletsAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import GlassContainer from '../../components/GlassContainer'

import { hexToRgba } from '../../utils/colors'

const getStatusBadge = (colors) => ({
  valide: { label: 'Valide', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  utilise: { label: 'Utilisé', color: colors.textTertiary, bg: hexToRgba(colors.textTertiary, 0.15) },
  expire: { label: 'Expiré', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
})

export default function VoirTicketsScreen({ route }) {
  const { colors, mode } = useTheme()
  const STATUS_BADGE = useMemo(() => getStatusBadge(colors), [colors])
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { eventId } = route.params || {}
  const [evenement, setEvenement] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const [eventData, ticketsData] = await Promise.all([
        fetchEvenementDetailAPI(eventId),
        fetchEvenementBilletsAPI(eventId),
      ])
      setEvenement(eventData.evenement || eventData)
      setTickets(ticketsData)
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={5} />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={s.content}>
          {evenement && (
            <GlassContainer blurType="light" style={s.eventInfo} intensity={35}>
              <Text style={s.eventName}>{evenement.nom}</Text>
              <Text style={s.ticketCount}>{tickets.length} billet(s)</Text>
            </GlassContainer>
          )}

          {tickets.length === 0 ? (
            <Text style={s.empty}>Aucun billet pour cet événement</Text>
          ) : (
            tickets.map(t => {
              const badge = STATUS_BADGE[t.statut] || STATUS_BADGE.valide
              return (
                <GlassContainer blurType="light" key={t.id} style={s.ticketRow} intensity={40}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketNumero}>{t.numero || t.id?.toString()?.slice(0, 8) || '-'}</Text>
                    <Text style={s.ticketCategorie}>{t.categorie}</Text>
                    <Text style={s.ticketTel}>{t.telephone || '-'}</Text>
                  </View>
                  <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
                  <View style={[s.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </GlassContainer>
              )
            })
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },
  eventInfo: { marginBottom: spacing.lg, padding: spacing.md },
  eventName: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.text },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, marginTop: 4 },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 60 },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, marginBottom: spacing.sm,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.text },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, marginTop: 2 },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 2 },
  ticketPrix: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.text, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
