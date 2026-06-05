// Historique des scans effectués par le contrôleur
// Statistiques par statut, liste chronologique avec détails événement, synchro offline
import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formaterDateHeure } from '../../utils/dateUtils'
import { getHistorique, synchroniser, getStats, reinitialiser } from '../../services/scanService'
import { textShadow } from '../../constants/theme'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
import EmptyState from '../../components/EmptyState'

// Couleurs par résultat de scan (fond pastel, texte, icône)
const PROFIL = {
  VALIDE: { bg: '#f0fdf4', text: '#166534', dot: '#22c55e', icon: 'check-circle', label: 'Valide' },
  DEJA_UTILISE: { bg: '#fff7ed', text: '#9a3412', dot: '#f97316', icon: 'alert-triangle', label: 'Déjà utilisé' },
  EXPIRE: { bg: '#fef2f2', text: '#991b1b', dot: '#FF4D6D', icon: 'clock', label: 'Expiré' },
  INCONNU: { bg: '#fef2f2', text: '#7f1d1d', dot: '#b91c1c', icon: 'help-circle', label: 'Inconnu' },
  FRAUDE: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626', icon: 'shield-off', label: 'Fraude' },
}

// Ordre d'affichage des statuts dans les stats
const ORDRE_STATS = ['VALIDE', 'DEJA_UTILISE', 'EXPIRE', 'INCONNU', 'FRAUDE']

export default function ScanHistoryScreen() {
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState({ ticketsLocaux: 0 })
  const [sync, setSync] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    charger()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [])

  // Charge l'historique enrichi + stats depuis la base SQLite
  const charger = async () => {
    const [data, statuts] = await Promise.all([getHistorique(), getStats()])
    setScans(data)
    setStats(statuts)
  }

  // Synchronise les scans offline vers le serveur (batch)
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

  // Extraction des événements uniques depuis l'historique
  const evenementsUniques = [...new Set(scans.filter(s => s.event_id).map(s => s.event_id))]

  return (
    <View style={{flex: 1}}>
      <BlurBackground category="Concert" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#fff']} />}
      >
        {/* Bandeau des stats : tickets locaux + chaque statut de scan */}
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

        {/* Barre d'actions */}
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
                <Feather name="upload-cloud" size={16} color="#FFFFFF" />
                <Text style={styles.actionTexte}>Synchroniser</Text>
              </>
            )}
          </TouchableOpacity>

          <GlassButton title="Vider" icon="trash-2" onPress={() => { reinitialiser(); charger() }} style={{flex: 1}} />
        </View>

        {/* Résumé des événements scannés */}
        {evenementsUniques.length > 0 && (
          <Text style={styles.sectionTitre}>
            {evenementsUniques.length} événement{evenementsUniques.length > 1 ? 's' : ''} scanné{evenementsUniques.length > 1 ? 's' : ''} · {scans.length} scan{scans.length > 1 ? 's' : ''}
          </Text>
        )}

        {/* Liste des scans */}
        {scans.length === 0 ? (
          <EmptyState icon={<Feather name="clipboard" size={48} color="rgba(255,255,255,0.5)" />} title="Aucun scan" subtitle="Les scans apparaîtront ici" />
        ) : (
          scans.map((item) => {
            const p = PROFIL[item.resultat] || PROFIL.INCONNU
            return (
              <GlassContainer key={item.id} style={styles.carte}>
                <View style={styles.carteGauche}>
                  <Feather name={p.icon} size={18} color={p.dot} />
                </View>
                <View style={styles.carteCentre}>
                  <Text style={styles.carteEvenement}>
                    {item.event_id ? `Événement #${item.event_id}${item.category ? ` · ${item.category}` : ''}` : 'Inconnu'}
                  </Text>
                  <Text style={styles.carteDate}>{formaterDateHeure(item.timestamp_scan)}</Text>
                  <Text style={styles.carteUuid}>#{item.uuid_billet?.slice(0, 8)}</Text>
                </View>
                <View style={styles.carteDroite}>
                  <Text style={styles.carteStatut}>{p.label}</Text>
                  {item.synced === 0 && (
                    <View style={styles.badge}>
                      <Feather name="wifi-off" size={10} color="#fff" />
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
  scroll: { paddingBottom: 40 },

  // Bandeau stats
  statsBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTicket: { alignItems: 'center', paddingRight: 16, minWidth: 80 },
  statTicketNombre: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: '#FFFFFF', ...textShadow },
  statTicketLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 },
  statGrille: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  statMiniDot: { width: 8, height: 8, borderRadius: 4 },
  statMiniNombre: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FFFFFF', minWidth: 20 },
  statMiniLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  // Actions
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  actionTexte: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#FFFFFF' },

  // Section
  sectionTitre: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#FFFFFF',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    ...textShadow,
  },

  // Liste des scans
  vide: { alignItems: 'center', paddingTop: 60 },
  videTexte: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: '#fff', marginTop: 12 },
  videSous: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  carte: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 6,
    padding: 12,
  },
  carteGauche: { width: 36, alignItems: 'center' },
  carteCentre: { flex: 1 },
  carteEvenement: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#FFFFFF' },
  carteDate: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  carteUuid: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  carteDroite: { alignItems: 'flex-end', gap: 4 },
  carteStatut: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#FFFFFF' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeTexte: { fontFamily: 'Outfit_700Bold', fontSize: 9, color: '#FFFFFF' },
})
