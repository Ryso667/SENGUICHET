// Gestion des événements : liste complète calquée sur l'app web
// Design glass (Apple Invites) — cartes avec hero image, overlay, stats
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, borderRadius, fonts, textShadow, categoryGradients } from '../../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { getCategoryImageUrl } from '../../config/images'
import { formaterDateLisible } from '../../utils/dateUtils'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'
import Skeleton from '../../components/Skeleton'

const STATUT_CONFIG = {
  actif: { label: 'Actif', color: '#00E5A0', bg: 'rgba(0,229,160,0.2)' },
  en_attente: { label: 'En attente', color: '#F97316', bg: 'rgba(249,115,22,0.2)' },
  refuse: { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
  suspendu: { label: 'Suspendu', color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
  annule: { label: 'Annulé', color: '#6B7280', bg: 'rgba(107,114,128,0.2)' },
}

const TABS = ['Tous', 'Actifs', 'En attente', 'Terminés', 'Annulés']

export default function GestionEvenementsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tous')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const charger = useCallback(async () => {
    try {
      const evts = await fetchEvenementsAPI()
      setEvents(evts)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    charger()
    const unsub = navigation.addListener('focus', charger)
    return unsub
  }, [charger, navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [charger])

  const filtered = events.filter(evt => {
    if (activeTab === 'Actifs') return evt.statut === 'actif'
    if (activeTab === 'En attente') return evt.statut === 'en_attente'
    if (activeTab === 'Terminés') return evt.statut === 'termine' || evt.statut === 'refuse' || evt.statut === 'suspendu'
    if (activeTab === 'Annulés') return evt.statut === 'annule'
    return true
  }).filter(evt =>
    !search || evt.nom?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={s.container}>
      <BlurBackground category="Conference" />
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor="#fff" />}
        >
          {/* Header : titre + bouton demander — calqué sur le web */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Mes événements</Text>
            <TouchableOpacity style={s.demanderBtn} onPress={() => navigation.navigate('MesDemandesTab')}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#fff" />
              <Text style={s.demanderBtnText}>Demander</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs — calquées sur le web */}
          <View style={s.tabsBar}>
            {TABS.map(tab => {
              const isActive = activeTab === tab
              return (
                <TouchableOpacity key={tab} style={[s.tab, isActive && s.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
                  {isActive ? (
                    <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.tabGradient}>
                      <Text style={s.tabTextActive}>{tab}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={s.tabText}>{tab}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Barre de recherche */}
          <View style={s.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Rechercher un événement..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* État chargement */}
          {loading ? (
            <View style={{ marginTop: spacing.lg }}>
              <Skeleton type="card" count={3} />
            </View>
          ) : filtered.length === 0 ? (
            /* État vide — calqué sur le web */
            <GlassContainer style={s.emptyState}>
              <MaterialCommunityIcons name="ticket-outline" size={56} color="rgba(255,255,255,0.3)" />
              <Text style={s.emptyTitle}>Aucun événement trouvé</Text>
              <Text style={s.emptySub}>Vous n'avez pas encore d'événement. Faites une demande à l'équipe SENGUICHET.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('MesDemandesTab')}>
                <Text style={s.emptyBtnText}>Demander un événement</Text>
              </TouchableOpacity>
            </GlassContainer>
          ) : (
            /* Liste d'événements — cartes calquées sur le web (version mobile) */
            <View style={s.eventsList}>
              {filtered.map(evt => {
                const cfg = STATUT_CONFIG[evt.statut] || STATUT_CONFIG.en_attente
                const capa = evt.capacite || 1
                const pct = Math.min(100, Math.round(((evt.remplis || 0) / capa) * 100))
                return (
                  <GlassContainer key={evt.id} style={s.eventCard}>
                    {/* Hero image avec gradient overlay */}
                    <View style={s.cardHero}>
                      {evt.affiche_url || evt.categorie ? (
                        <Image source={{ uri: evt.affiche_url || getCategoryImageUrl(evt.categorie) }} style={s.cardHeroBg} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={categoryGradients[evt.categorie] || categoryGradients.default} style={s.cardHeroBg}>
                          <MaterialCommunityIcons name="image-outline" size={36} color="rgba(255,255,255,0.15)" />
                        </LinearGradient>
                      )}
                      <LinearGradient colors={['transparent', 'rgba(10,11,26,0.9)']} style={s.cardHeroOverlay} />
                      {/* Badge statut — position top-right */}
                      <View style={s.cardBadgeWrap}>
                        <View style={[s.cardBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[s.cardBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                      </View>
                      {/* Overlay infos en bas */}
                      <View style={s.cardHeroBottom}>
                        <Text style={s.cardName} numberOfLines={1}>{evt.nom}</Text>
                        <Text style={s.cardMeta} numberOfLines={1}>{evt.date} · {evt.lieu || 'Non spécifié'}</Text>
                      </View>
                    </View>
                    {/* Corps : places + revenus + bouton */}
                    <View style={s.cardBody}>
                      <View style={s.cardStats}>
                        <Text style={s.cardPlaces}>{evt.remplis || 0}/{evt.capacite || 0} places</Text>
                        <Text style={s.cardRevenu}>{evt.revenus || '0 FCFA'}</Text>
                      </View>
                      {/* Barre de progression */}
                      <View style={s.cardBarRow}>
                        <View style={s.cardBarBg}>
                          <View style={[s.cardBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={s.cardBarPct}>{pct}%</Text>
                      </View>
                      {/* Bouton d'action */}
                      <TouchableOpacity
                        style={s.cardBtn}
                        onPress={() => navigation.navigate('DetailEvenement', { eventId: evt.id })}
                        activeOpacity={0.7}
                      >
                        <Text style={s.cardBtnText}>Voir les détails</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassContainer>
                )
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  demanderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  demanderBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff' },

  /* Tabs */
  tabsBar: {
    flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md,
    padding: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tab: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  tabActive: {},
  tabGradient: { paddingVertical: 8, alignItems: 'center', borderRadius: 14 },
  tabText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 8 },
  tabTextActive: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: '#fff', textAlign: 'center' },

  /* Search */
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
    paddingHorizontal: 14, height: 44, marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: { flex: 1, fontFamily: fonts.outfit.regular, fontSize: 14, color: '#fff' },

  /* État vide */
  emptyState: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', ...textShadow },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(0,200,255,0.15)', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },

  /* Liste */
  eventsList: { gap: spacing.md },

  /* Carte événement — calquée sur le web */
  eventCard: { overflow: 'hidden', borderRadius: 16 },

  cardHero: { height: 130, position: 'relative', overflow: 'hidden', justifyContent: 'flex-end' },
  cardHeroBg: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cardHeroOverlay: { ...StyleSheet.absoluteFillObject },
  cardBadgeWrap: { position: 'absolute', top: 10, right: 10 },
  cardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardBadgeText: { fontSize: 10, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardHeroBottom: { position: 'absolute', bottom: 10, left: 14, right: 14 },
  cardName: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  cardMeta: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  cardBody: { padding: spacing.md },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardPlaces: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },
  cardRevenu: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },

  cardBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  cardBarFill: { height: 6, borderRadius: 3, backgroundColor: '#00C8FF' },
  cardBarPct: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'right' },

  cardBtn: {
    backgroundColor: 'rgba(0,200,255,0.12)', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  cardBtnText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: '#00C8FF' },
})
