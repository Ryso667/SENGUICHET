// Gestion des événements : liste complète avec détails, Modifier et Supprimer
// L'organisateur voit tout au même endroit sans naviguer
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getEvenementStats, supprimerEvenement, ajouterAudit } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'

export default function GestionEvenementsScreen({ navigation }) {
  const { email } = useAuth()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({})
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    charger()
    const unsubscribe = navigation.addListener('focus', charger)
    return unsubscribe
  }, [navigation])

  async function charger() {
    const evts = await getAllEvenements()
    const actifs = evts.filter(e => !e.supprime)
    setEvents(actifs)
    const s = {}
    for (const e of actifs) {
      s[e.id] = await getEvenementStats(e.id)
    }
    setStats(s)
  }

  // Soft delete : marque supprime=true et enregistre dans le journal d'audit
  function handleDelete(evt) {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer définitivement "${evt.nom}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supprimerEvenement(evt.id)
            await ajouterAudit('suppression', { eventId: evt.id, eventNom: evt.nom, par: email })
            charger()
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>Aucun événement à gérer</Text>
        </View>
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id
          return (
            <View key={evt.id} style={s.card}>
              <TouchableOpacity style={s.cardTop} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.7}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{evt.nom.charAt(0)}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.nom}>{evt.nom}</Text>
                  <Text style={s.date}>{formaterDateLisible(evt.date)} · Code: {evt.code}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen && st && (
                <View style={s.details}>
                  <View style={s.miniStats}>
                    <View style={s.miniStat}>
                      <Text style={s.miniStatValue}>{st.totalVendus}</Text>
                      <Text style={s.miniStatLabel}>vendus</Text>
                    </View>
                    <View style={s.miniStat}>
                      <Text style={s.miniStatValue}>{st.totalScannes}</Text>
                      <Text style={s.miniStatLabel}>scannés</Text>
                    </View>
                    <View style={s.miniStat}>
                      <Text style={s.miniStatValue}>{(st.recettes || 0).toLocaleString()} F</Text>
                      <Text style={s.miniStatLabel}>recettes</Text>
                    </View>
                  </View>

                  <Text style={s.detailTitle}>Ventes</Text>
                  {st.vendusParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.vendus / Math.max(c.capacite, 1)) * 100}%` }]} />
                      </View>
                      <Text style={s.barCount}>{c.vendus}/{c.capacite}</Text>
                    </View>
                  ))}

                  <Text style={[s.detailTitle, { marginTop: spacing.md }]}>Scans</Text>
                  {st.scannesParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.scannes / Math.max(c.vendus, 1)) * 100}%`, backgroundColor: '#10B981' }]} />
                      </View>
                      <Text style={s.barCount}>{c.scannes}/{c.vendus}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={s.voirTickets}
                    onPress={() => navigation.navigate('VoirTickets', { eventId: evt.id })}
                  >
                    <Text style={s.voirTicketsText}>Voir les tickets →</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={s.actions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => navigation.navigate('CreerEvenement', { event: evt })}
                >
                  <Text style={s.editBtnText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(evt)}
                >
                  <Text style={s.deleteBtnText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.sm },
  card: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  badgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  info: { flex: 1 },
  nom: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  date: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  chevron: { fontSize: 16, color: colors.mid, marginLeft: spacing.sm },
  details: {
    marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  miniStats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  miniStat: {
    flex: 1, backgroundColor: '#f8faff', borderRadius: borderRadius.md,
    padding: spacing.sm, alignItems: 'center',
  },
  miniStatValue: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.slate },
  miniStatLabel: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  detailTitle: {
    fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 70, fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },
  barBg: { flex: 1, height: 8, backgroundColor: '#eef2ff', borderRadius: 4, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  barCount: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTickets: { marginTop: spacing.md, alignSelf: 'flex-end' },
  voirTicketsText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#6366F1' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  editBtn: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  editBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#6366f1' },
  deleteBtn: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#ef4444' },
})
