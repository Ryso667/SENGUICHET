// Historique des scans effectués par le contrôleur
// Statistiques par statut, liste chronologique, synchro offline
import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formaterDateHeure } from '../../utils/dateUtils'
import { getHistorique, getStats } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import GlassContainer from '../../components/GlassContainer'
import EmptyState from '../../components/EmptyState'
import { useTabBarScroll } from '../../context/TabBarScrollContext'

const PROFIL = {
  VALIDE: { dot: '#66BB6A', icon: 'check-circle', label: 'Valide' },
  DEJA_UTILISE: { dot: '#FFA726', icon: 'alert-triangle', label: 'Déjà utilisé' },
  EXPIRE: { dot: '#FF4D6D', icon: 'clock', label: 'Expiré' },
  INCONNU: { dot: '#B71C1C', icon: 'help-circle', label: 'Inconnu' },
  FRAUDE: { dot: '#B71C1C', icon: 'shield-off', label: 'Fraude' },
}

const ORDRE_STATS = ['VALIDE', 'DEJA_UTILISE', 'EXPIRE', 'INCONNU', 'FRAUDE']

export default function ScanHistoryScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { evenementId, evenementTitre } = useAuth()
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState({ ticketsLocaux: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const insets = useSafeAreaInsets()

  const charger = useCallback(async () => {
    const [data, statuts] = await Promise.all([getHistorique(evenementId), getStats()])
    setScans(data)
    setStats(statuts)
  }, [evenementId])

  useFocusEffect(
    useCallback(() => { charger() }, [charger])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [charger])

  const { scrollY: tabScrollY } = useTabBarScroll()

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        onScroll={(e) => { tabScrollY.setValue(e.nativeEvent.contentOffset.y) }}
        scrollEventThrottle={16}
      >
        <GlassContainer style={styles.statsBanner}>
          <View style={styles.statTicket}>
            <Text style={styles.statTicketNombre}>{stats.ticketsLocaux || 0}</Text>
            <Text style={styles.statTicketLabel}>Tickets locaux</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statGrille}>
            {ORDRE_STATS.map((cle) => {
              const p = PROFIL[cle]
              return (
                <View key={cle} style={styles.statMini}>
                  <Feather name={p.icon} size={14} color={p.dot} />
                  <Text style={styles.statMiniNombre}>{stats[cle] || 0}</Text>
                  <Text style={styles.statMiniLabel}>{p.label}</Text>
                </View>
              )
            })}
          </View>
        </GlassContainer>

        {evenementTitre && (
          <Text style={styles.eventName}>{evenementTitre}</Text>
        )}

        <Text style={styles.infoAuto}>Scans triés du plus récent au plus ancien</Text>

        {scans.length === 0 ? (
          <EmptyState
            icon={<Feather name="clipboard" size={48} color={colors.textSecondary} />}
            title="Aucun scan"
            subtitle="Les scans apparaîtront ici"
          />
        ) : (
          scans.map((item) => {
            const p = PROFIL[item.resultat] || PROFIL.INCONNU
            return (
              <GlassContainer key={item.id} style={styles.carte}>
                <View style={[styles.carteGauche, { backgroundColor: p.dot + '18', borderColor: p.dot + '30' }]}>
                  <Feather name={p.icon} size={18} color={p.dot} />
                </View>
                <View style={styles.carteCentre}>
                  <Text style={styles.carteNumero} numberOfLines={1}>{item.numero || item.uuid_billet?.substring(0, 12) || '—'}</Text>
                  <Text style={styles.carteDate}>{formaterDateHeure(item.timestamp_scan)}</Text>
                </View>
                <View style={styles.carteDroite}>
                  <View style={[styles.carteStatutBadge, { backgroundColor: p.dot + '18' }]}>
                    <Text style={[styles.carteStatut, { color: p.dot }]}>{p.label}</Text>
                  </View>
                </View>
              </GlassContainer>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  scroll: { paddingBottom: 100 },
  statsBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTicket: { alignItems: 'center', paddingRight: 16, minWidth: 80 },
  statTicketNombre: { fontFamily: fonts.outfit.bold, fontSize: 28, color: colors.text },
  statTicketLabel: { fontFamily: fonts.outfit.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 60, backgroundColor: colors.border, marginRight: 12 },
  statGrille: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '46%' },
  statMiniNombre: { fontFamily: fonts.outfit.bold, fontSize: 14, color: colors.text, minWidth: 18 },
  statMiniLabel: { fontFamily: fonts.outfit.regular, fontSize: 10, color: colors.textSecondary },
  eventName: {
    fontFamily: fonts.outfit.medium, fontSize: 13, color: colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 12, textAlign: 'center',
  },
  infoAuto: {
    fontFamily: fonts.outfit.regular, fontSize: 12, color: colors.textSecondary,
    textAlign: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  carte: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    padding: 14, gap: 14,
  },
  carteGauche: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  carteCentre: { flex: 1, gap: 3 },
  carteNumero: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.text },
  carteDate: { fontFamily: fonts.outfit.regular, fontSize: 12, color: colors.textSecondary },
  carteDroite: { alignItems: 'flex-end', gap: 6 },
  carteStatutBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  carteStatut: { fontFamily: fonts.outfit.bold, fontSize: 11 },
})
