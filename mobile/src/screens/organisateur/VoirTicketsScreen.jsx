// Consultation des tickets d'un événement (lecture seule)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'

const STATUS_BADGE = {
  valide: { label: 'Valide', color: '#00E5A0', bg: '#D1FAE5' },
  utilise: { label: 'Utilisé', color: '#64748b', bg: '#F1F5F9' },
  expire: { label: 'Expiré', color: '#EF4444', bg: '#FEE2E2' },
}

export default function VoirTicketsScreen({ route }) {
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
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {
      // Backend requis
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <Skeleton type="card" count={5} />
      </View>
    )
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {evenement && (
        <View style={s.eventInfo}>
          <Text style={s.eventName}>{evenement.nom}</Text>
          <Text style={s.ticketCount}>{tickets.length} billet(s)</Text>
        </View>
      )}

      {tickets.length === 0 ? (
        <Text style={s.empty}>Aucun billet pour cet événement</Text>
      ) : (
        tickets.map(t => {
          const badge = STATUS_BADGE[t.statut] || STATUS_BADGE.valide
          return (
            <View key={t.id} style={s.ticketRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.ticketNumero}>{t.numero || t.id?.toString()?.slice(0, 8) || '-'}</Text>
                <Text style={s.ticketCategorie}>{t.categorie || 'Standard'}</Text>
                <Text style={s.ticketTel}>{t.telephone || t.telephoneAcheteur || '-'}</Text>
              </View>
              <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
              <View style={[s.badge, { backgroundColor: badge.bg }]}>
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
          )
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  eventInfo: { marginBottom: spacing.lg },
  eventName: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent, marginTop: 4 },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 60 },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, elevation: 2,
    shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.accent },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginTop: 2 },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  ticketPrix: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
