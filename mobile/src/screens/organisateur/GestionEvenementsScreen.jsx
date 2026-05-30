// Gestion des événements : liste complète avec détails, Modifier et Supprimer
// L'organisateur voit tout au même endroit sans naviguer
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI, annulerEvenementAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'
import EmptyState from '../../components/EmptyState'

// Couleurs et labels pour les statuts backend
const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#10B981', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

export default function GestionEvenementsScreen({ navigation }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    charger()
    const unsubscribe = navigation.addListener('focus', charger)
    return unsubscribe
  }, [navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [])

  async function charger() {
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
  }

  // Annule l'événement via le backend (API uniquement)
  function handleDelete(evt) {
    Alert.alert(
      'Confirmer l\'annulation',
      `Annuler définitivement "${evt.nom}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Annuler l\'événement',
          style: 'destructive',
          onPress: async () => {
            try {
              await annulerEvenementAPI(evt.id)
            } catch {
              // Pas de fallback
            }
            charger()
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
    >
      {events.length === 0 ? (
        <EmptyState icon="🎪" title="Aucun événement" subtitle="Crée ton premier événement" />
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id
          const renderRightActions = () => (
            <TouchableOpacity style={s.swipeDelete} onPress={() => handleDelete(evt)}>
              <Text style={s.swipeDeleteText}>Supprimer</Text>
            </TouchableOpacity>
          )
          return (
            <Swipeable key={evt.id} renderRightActions={renderRightActions}>
            <View style={s.card}>
              <TouchableOpacity style={s.cardTop} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.7}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{evt.nom.charAt(0)}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.nom}>{evt.nom}</Text>
                  <Text style={s.date}>{formaterDateLisible(evt.date)} · Code: {evt.code}</Text>
                </View>
                {(() => {
                  const cfg = STATUT_CONFIG[evt.statut] || STATUT_CONFIG.en_attente
                  return (
                    <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  )
                })()}
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
                      <Text style={s.miniStatValue}>{(st.recettes || 0).toLocaleString()} F</Text>
                      <Text style={s.miniStatLabel}>recettes</Text>
                    </View>
                  </View>

                  <Text style={s.detailTitle}>Remplissage</Text>
                  <View style={s.barRow}>
                    <Text style={s.barLabel}>Vendus</Text>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: `${(st.capacite || 1) > 0 ? (st.totalVendus / (st.capacite || 1)) * 100 : 0}%` }]} />
                    </View>
                    <Text style={s.barCount}>{st.totalVendus}/{st.capacite || '?'}</Text>
                  </View>

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
            </Swipeable>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    backgroundColor: '#ef4444',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontFamily: fonts.outfit.semiBold,
    fontSize: 12,
  },
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: spacing.xs },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
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
