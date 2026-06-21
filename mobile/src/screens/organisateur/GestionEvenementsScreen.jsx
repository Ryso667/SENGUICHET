// Gestion des événements : liste complète calquée sur l'app web
// Design glass (Apple Invites) — cartes avec hero image, overlay, stats
import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, categoryGradients, gradients, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { fetchEvenementsAPI } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import { getCategoryImageUrl } from '../../config/images'
import { formaterDateLisible } from '../../utils/dateUtils'
import GlassContainer from '../../components/GlassContainer'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'
import { useTabBarScroll } from '../../context/TabBarScrollContext'
import { hexToRgba } from '../../utils/colors'

const getStatutConfig = (colors) => ({
  actif: { label: 'Actif', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  en_attente: { label: 'En attente', color: colors.orange, bg: hexToRgba(colors.orange, 0.15) },
  refuse: { label: 'Refusé', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
  suspendu: { label: 'Suspendu', color: colors.warning, bg: hexToRgba(colors.warning, 0.15) },
  annule: { label: 'Annulé', color: colors.textSecondary, bg: hexToRgba(colors.textSecondary, 0.15) },
})

const TABS = ['Tous', 'Actifs', 'En attente', 'Terminés', 'Annulés']

export default function GestionEvenementsScreen({ navigation }) {
  const { colors, mode, isDark } = useTheme()
  const STATUT_CONFIG = useMemo(() => getStatutConfig(colors), [colors])
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { scrollY: tabScrollY } = useTabBarScroll()
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
      <View style={{ paddingTop: insets.top, flex: 1 }}>
          <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
          onScroll={(e) => { tabScrollY.setValue(e.nativeEvent.contentOffset.y) }}
          scrollEventThrottle={16}
        >
          {/* Header : titre + boutons actions */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Mes événements</Text>
            <View style={s.headerActions}>
              <TouchableOpacity onPress={() => navigation.navigate('Statistiques')} activeOpacity={0.8} style={s.statBtn}>
                <MaterialCommunityIcons name="chart-bar" size={16} color={colors.accent} />
                <Text style={s.statBtnText}>Statistiques</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Demandes')} activeOpacity={0.8}>
                <LinearGradient colors={gradients.primary} style={s.demanderBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#fff" />
                  <Text style={s.demanderBtnText}>Demander</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {!loading && filtered.length > 0 && (
            <Text style={s.refreshHint}>↓ Tirer vers le bas pour actualiser</Text>
          )}

          {/* Tabs — calquées sur le web */}
          <View style={s.tabsBar}>
            {TABS.map(tab => {
              const isActive = activeTab === tab
              return (
                <TouchableOpacity key={tab} style={[s.tab, isActive && s.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
                  {isActive ? (
                    <LinearGradient colors={gradients.primary} style={s.tabGradient}>
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
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Rechercher un événement..."
              placeholderTextColor={colors.textTertiary}
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
            <EmptyState
              icon="🎫"
              title="Aucun événement trouvé"
              subtitle="Vous n'avez pas encore d'événement. Faites une demande à l'équipe SENGUICHET."
              actionLabel="Demander un événement"
              onAction={() => navigation.navigate('Demandes')}
            />
          ) : (
            /* Liste d'événements — cartes calquées sur le web (version mobile) */
            <View style={s.eventsList}>
              {filtered.map(evt => {
                const cfg = STATUT_CONFIG[evt.statut] || STATUT_CONFIG.en_attente
                const capa = evt.capacite || 1
                const pct = Math.min(100, Math.round(((evt.remplis || 0) / capa) * 100))
                return (
                  <GlassContainer blurType="light" key={evt.id} style={s.eventCard}>
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
                        <Text style={s.cardMeta} numberOfLines={1}>{formaterDateLisible(evt.date)} · {evt.lieu || 'Non spécifié'}</Text>
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

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },

  /* Header */
  header: { marginBottom: spacing.md },
  headerTitle: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.text, marginBottom: spacing.sm },
  refreshHint: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  statBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  statBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  demanderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  demanderBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.white },

  /* Tabs */
  tabsBar: {
    flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md,
    padding: 6, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  tab: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  tabActive: {},
  tabGradient: { paddingVertical: 8, alignItems: 'center', borderRadius: 14 },
  tabText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.textTertiary, textAlign: 'center', paddingVertical: 8 },
  tabTextActive: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.white, textAlign: 'center' },

  /* Search */
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: 14,
    paddingHorizontal: 14, height: 44, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.outfit.regular, fontSize: 14, color: colors.text },

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
  cardPlaces: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },
  cardRevenu: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.green },

  cardBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 3, overflow: 'hidden' },
  cardBarFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  cardBarPct: { fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary, width: 36, textAlign: 'right' },

  cardBtn: {
    backgroundColor: colors.accent + '1F', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  cardBtnText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.green },
})
