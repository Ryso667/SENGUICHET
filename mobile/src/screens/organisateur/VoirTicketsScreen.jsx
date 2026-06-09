// Consultation des tickets d'un événement (lecture seule)
// Design glass (Apple Invites)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'

const STATUS_BADGE = {
  valide: { label: 'Valide', color: '#00E5A0', bg: 'rgba(0,229,160,0.2)' },
  utilise: { label: 'Utilisé', color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' },
  expire: { label: 'Expiré', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
}

export default function VoirTicketsScreen({ route }) {
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
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OrganisateurLayout />
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={5} />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
      <ScrollView showsVerticalScrollIndicator={false}>
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
                    <Text style={s.ticketCategorie}>{t.categorie || 'Standard'}</Text>
                    <Text style={s.ticketTel}>{t.telephone || t.telephoneAcheteur || '-'}</Text>
                  </View>
                  <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
                  <View style={[s.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </GlassContainer>
              )
            })
          )}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  eventInfo: { marginBottom: spacing.lg, padding: spacing.md },
  eventName: { fontSize: 22, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent, marginTop: 4 },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 60 },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, marginBottom: spacing.sm,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.accent },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#fff', marginTop: 2 },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  ticketPrix: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff', marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
