import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getTicketsByEvent } from '../../services/eventService'

const STATUS_BADGE = {
  valide: { label: 'Valide', bg: colors.greenLight, color: colors.green },
  utilise: { label: 'Utilisé', bg: '#F1F5F9', color: colors.mid },
  expire: { label: 'Expiré', bg: '#FEF2F2', color: colors.red },
}

export default function VoirTicketsScreen({ route, navigation }) {
  const { eventId } = route.params || {}
  const [code, setCode] = useState('')
  const [event, setEvent] = useState(null)
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (eventId) loadEvent(eventId)
  }, [eventId])

  async function loadEvent(id) {
    const events = await getAllEvenements()
    const evt = events.find(e => e.id === id)
    if (evt) {
      setEvent(evt)
      const t = await getTicketsByEvent(id)
      setTickets(t)
    }
  }

  async function handleSearch() {
    const events = await getAllEvenements()
    const evt = events.find(e => e.code === code)
    if (!evt) {
      Alert.alert('Introuvable', 'Aucun événement avec ce code')
      return
    }
    setEvent(evt)
    const t = await getTicketsByEvent(evt.id)
    setTickets(t)
  }

  return (
    <ScrollView style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={s.backBtnText}>← Retour</Text>
      </TouchableOpacity>

      {!event && (
        <View style={s.searchSection}>
          <Text style={s.searchTitle}>Code événement</Text>
          <TextInput style={s.codeInput} placeholder="0000"
            value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={4} />
          <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
            <Text style={s.searchBtnText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      )}

      {event && (
        <>
          <View style={s.eventInfo}>
            <Text style={s.eventName}>{event.nom}</Text>
            <Text style={s.eventDate}>{event.date}</Text>
            <Text style={s.ticketCount}>{tickets.length} ticket(s)</Text>
          </View>

          {tickets.length === 0 ? (
            <Text style={s.empty}>Aucun ticket pour cet événement</Text>
          ) : (
            tickets.map(t => {
              const badge = STATUS_BADGE[t.statut] || STATUS_BADGE.valide
              return (
                <View key={t.id} style={s.ticketRow}>
                  <Text style={s.ticketNumero}>{t.numero}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketCategorie}>{t.categorie}</Text>
                    <Text style={s.ticketTel}>{t.telephone}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>
              )
            })
          )}
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  searchSection: { paddingTop: spacing.xl, alignItems: 'center' },
  searchTitle: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.slate },
  codeInput: {
    ...glass, width: 120, height: 60, borderRadius: borderRadius.lg, marginTop: spacing.md,
    textAlign: 'center', fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.slate, ...shadows.sm,
  },
  searchBtn: {
    backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, marginTop: spacing.md,
  },
  searchBtnText: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.white },
  eventInfo: { marginBottom: spacing.lg },
  eventName: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate },
  eventDate: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  ticketCount: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent, marginTop: spacing.sm },
  empty: { textAlign: 'center', fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xl },
  ticketRow: {
    flexDirection: 'row', alignItems: 'center', ...glass, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  ticketNumero: { fontSize: 12, fontFamily: fonts.outfit.bold, color: colors.accent, width: 90 },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  ticketTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, fontFamily: fonts.outfit.semiBold },
})
