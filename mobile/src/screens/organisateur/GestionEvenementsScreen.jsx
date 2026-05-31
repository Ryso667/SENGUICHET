// Gestion des événements : liste complète avec onglets, recherche,
// détails expandables, stats individuelles — consultation uniquement
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, glass, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { formaterDateLisible } from '../../utils/dateUtils'
import EmptyState from '../../components/EmptyState'

// Couleurs et labels pour les statuts backend
const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#00E5A0', bg: '#D1FAE5' },
  en_attente: { label: 'En attente', color: '#F97316', bg: '#FEF3C7' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: '#FEE2E2' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: '#FEF3C7' },
  annule: { label: 'Annulé', color: '#6B7280', bg: '#F3F4F6' },
}

const TABS = ['Tous', 'Actifs', 'En attente', 'Terminés', 'Annulés']

export default function GestionEvenementsScreen({ navigation }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [activeTab, setActiveTab] = useState('Tous')
  const [search, setSearch] = useState('')
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

  // Charge les événements depuis l'API + calcule les stats par événement
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

  // Filtre les événements par onglet actif + recherche textuelle
  const filtered = events.filter(evt => {
    if (activeTab === 'Actifs') return evt.statut === 'actif'
    if (activeTab === 'En attente') return evt.statut === 'en_attente'
    if (activeTab === 'Terminés') return evt.statut === 'termine'
    if (activeTab === 'Annulés') return evt.statut === 'annule'
    return true
  }).filter(evt =>
    !search || evt.nom?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={s.container}>
      {/* Barre d'onglets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
        <View style={s.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Barre de recherche */}
      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher un événement..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C8FF']} />}
      >
        {filtered.length === 0 ? (
          <EmptyState icon={<MaterialCommunityIcons name="tent" size={48} color={colors.mid} />} title="Aucun événement" subtitle={search ? "Aucun résultat pour ta recherche" : "Crée ton premier événement"} />
        ) : (
          filtered.map(evt => {
            const st = stats[evt.id]
            const isOpen = expandedId === evt.id
            return (
              <View key={evt.id} style={s.card}>
                <TouchableOpacity style={s.cardTop} onPress={() => navigation.navigate('DetailEvenement', { eventId: evt.id })} activeOpacity={0.7}>
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
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setExpandedId(isOpen ? null : evt.id)}>
                    <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
                  </TouchableOpacity>
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

              </View>
            )
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabsScroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flexGrow: 0 },
  tabs: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'nowrap' },
  tab: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#fff' },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.mid },
  tabTextActive: { color: '#fff' },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchInput: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, paddingHorizontal: 16, height: 44,
    fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.slate,
  },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: fonts.outfit.regular, color: colors.mid, marginTop: spacing.sm },
  card: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#00C8FF',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  badgeText: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff' },
  info: { flex: 1 },
  nom: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  date: { fontSize: 12, fontFamily: fonts.outfit.regular, color: colors.mid, marginTop: 2 },
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
  miniStatLabel: { fontSize: 10, fontFamily: fonts.outfit.regular, color: colors.mid, marginTop: 2 },
  detailTitle: {
    fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 70, fontSize: 12, fontFamily: fonts.outfit.regular, color: colors.mid },
  barBg: { flex: 1, height: 8, backgroundColor: '#E0F7FF', borderRadius: 4, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#00C8FF' },
  barCount: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTickets: { marginTop: spacing.md, alignSelf: 'flex-end' },
  voirTicketsText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
})
