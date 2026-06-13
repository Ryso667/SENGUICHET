// Historique des scans effectués par le contrôleur
// Statistiques par statut, liste chronologique, synchro offline
import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formaterDateHeure } from '../../utils/dateUtils'
import { telechargerTickets, getHistorique, synchroniser, getStats, reinitialiser } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts } from '../../constants/theme'
import ControleurLayout from '../../components/ControleurLayout'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
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
  const { evenementId, evenementTitre } = useAuth()
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState({ ticketsLocaux: 0 })
  const [sync, setSync] = useState(false)
  const [download, setDownload] = useState(false)
  const [downloadMsg, setDownloadMsg] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => { charger() }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [])

  const charger = async () => {
    const [data, statuts] = await Promise.all([getHistorique(), getStats()])
    setScans(data)
    setStats(statuts)
  }

  const handleSync = async () => {
    setSync(true)
    try {
      await synchroniser()
      await charger()
    } catch {
    } finally {
      setSync(false)
    }
  }

  const handleDownload = async () => {
    setDownload(true)
    setDownloadMsg(null)
    try {
      const zone = 'STANDARD'
      const nb = await telechargerTickets(evenementId, zone)
      setDownloadMsg({ type: 'success', text: `${nb} ticket${nb > 1 ? 's' : ''} téléchargé${nb > 1 ? 's' : ''}` })
      await charger()
    } catch (err) {
      setDownloadMsg({ type: 'error', text: err.message || 'Échec du téléchargement' })
    } finally {
      setDownload(false)
    }
  }

  const handleVider = () => {
    Alert.alert(
      'Vider l\'historique',
      'Cette action remet tous les tickets à DISPONIBLE et efface l\'historique des scans. Les scans non synchronisés seront perdus.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider', style: 'destructive',
          onPress: async () => { await reinitialiser(); charger() },
        },
      ],
    )
  }

  const { scrollY: tabScrollY } = useTabBarScroll()

  return (
    <View style={{flex: 1}}>
      <ControleurLayout />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={["#FFFFFF"]} />}
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
                  <View style={[styles.statMiniDot, { backgroundColor: p.dot }]} />
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

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, sync && { opacity: 0.6 }]}
            onPress={handleSync}
            disabled={sync}
          >
            {sync ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="upload-cloud" size={16} color={colors.accent} />
                <Text style={styles.actionTexte}>Synchroniser</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, download && { opacity: 0.6 }]}
            onPress={handleDownload}
            disabled={download}
          >
            {download ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="download-cloud" size={16} color={colors.accent} />
                <Text style={styles.actionTexte}>Télécharger</Text>
              </>
            )}
          </TouchableOpacity>
          <GlassButton title="Vider" icon="trash-2" onPress={handleVider} style={{flex: 1}} />
        </View>

        {downloadMsg && (
          <Text style={[styles.downloadMsg, downloadMsg.type === 'error' && styles.downloadMsgError]}>
            {downloadMsg.text}
          </Text>
        )}

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
                <View style={styles.carteGauche}>
                  <Feather name={p.icon} size={18} color={p.dot} />
                </View>
                <View style={styles.carteCentre}>
                  <Text style={styles.carteNumero}>{item.numero || item.uuid_billet?.substring(0, 12) || '—'}</Text>
                  <Text style={styles.carteDate}>{formaterDateHeure(item.timestamp_scan)}</Text>
                </View>
                <View style={styles.carteDroite}>
                  <Text style={styles.carteStatut}>{p.label}</Text>
                  {item.synced === 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTexte}>OFFLINE</Text>
                    </View>
                  )}
                </View>
              </GlassContainer>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  statMiniDot: { width: 8, height: 8, borderRadius: 4 },
  statMiniNombre: { fontFamily: fonts.outfit.bold, fontSize: 14, color: colors.text, minWidth: 20 },
  statMiniLabel: { fontFamily: fonts.outfit.regular, fontSize: 10, color: colors.textSecondary },
  eventName: {
    fontFamily: fonts.outfit.medium, fontSize: 13, color: colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 12, textAlign: 'center',
  },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.glassWhite, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder,
  },
  actionTexte: { fontFamily: fonts.outfit.semiBold, fontSize: 13, color: colors.text },
  downloadMsg: {
    fontFamily: fonts.outfit.medium, fontSize: 12, color: colors.green,
    paddingHorizontal: 16, paddingTop: 8, textAlign: 'center',
  },
  downloadMsgError: { color: colors.orange },
  sectionTitre: {
    fontFamily: fonts.outfit.semiBold, fontSize: 13, color: colors.text,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  carte: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 6,
    padding: 12,
  },
  carteGauche: { width: 36, alignItems: 'center' },
  carteCentre: { flex: 1 },
  carteDate: { fontFamily: fonts.outfit.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  carteNumero: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.text },
  carteDroite: { alignItems: 'flex-end', gap: 4 },
  carteStatut: { fontFamily: fonts.outfit.bold, fontSize: 12, color: colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeTexte: { fontFamily: fonts.outfit.bold, fontSize: 9, color: colors.accent },
})
