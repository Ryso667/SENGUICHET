// Détail d'un événement (lecture seule)
// Affiche toutes les informations + liste des catégories de billets
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#00E5A0', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

function formaterDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DetailEvenementScreen({ route, navigation }) {
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
        <View style={{ padding: spacing.lg }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  if (!evenement) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Événement introuvable</Text>
      </View>
    )
  }

  const cfg = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.en_attente
  const pct = (evenement.capacite || 0) > 0
    ? Math.round(((evenement.remplis || 0) / evenement.capacite) * 100) : 0

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>{evenement.nom}</Text>
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={s.infoGrid}>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Date</Text>
          <Text style={s.infoValue}>{formaterDate(evenement.date)}</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Lieu</Text>
          <Text style={s.infoValue}>{evenement.lieu || 'Non spécifié'}</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Capacité</Text>
          <Text style={s.infoValue}>{evenement.capacite || 0} places</Text>
        </View>
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Code</Text>
          <Text style={s.infoValue}>{evenement.code || '-'}</Text>
        </View>
      </View>

      <View style={s.fillSection}>
        <Text style={s.fillTitle}>Remplissage</Text>
        <View style={s.barRow}>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.barCount}>{evenement.remplis || 0}/{evenement.capacite || 0}</Text>
        </View>
        <Text style={s.fillPct}>{pct}%</Text>
      </View>

      {evenement.description ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.description}>{evenement.description}</Text>
        </View>
      ) : null}

      <View style={s.section}>
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
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.md,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  infoCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    elevation: 2, shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  infoLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginTop: 4 },
  fillSection: { padding: spacing.lg },
  fillTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 10, backgroundColor: '#E0F7FF', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: '#00C8FF' },
  barCount: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  fillPct: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.accent, marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm },
  description: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, lineHeight: 22 },
  empty: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, textAlign: 'center', paddingVertical: spacing.lg },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, flex: 1 },
  ticketPrix: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  ticketStatut: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginLeft: spacing.sm, textTransform: 'capitalize' },
})
