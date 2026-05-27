// Historique des scans effectués par le contrôleur
// Statistiques par statut, liste chronologique avec détails événement, synchro offline
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { formaterDateHeure } from '../../utils/dateUtils'
import { getHistorique, synchroniser, getStats, reinitialiser } from '../../services/scanService'

// Couleurs par résultat de scan (fond pastel, texte, icône)
const PROFIL = {
  VALIDE: { bg: '#f0fdf4', text: '#166534', dot: '#22c55e', icon: 'check-circle', label: 'Valide' },
  DEJA_UTILISE: { bg: '#fff7ed', text: '#9a3412', dot: '#f97316', icon: 'alert-triangle', label: 'Déjà utilisé' },
  EXPIRE: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', icon: 'clock', label: 'Expiré' },
  INCONNU: { bg: '#fef2f2', text: '#7f1d1d', dot: '#b91c1c', icon: 'help-circle', label: 'Inconnu' },
  FRAUDE: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626', icon: 'shield-off', label: 'Fraude' },
}

// Ordre d'affichage des statuts dans les stats
const ORDRE_STATS = ['VALIDE', 'DEJA_UTILISE', 'EXPIRE', 'INCONNU', 'FRAUDE']

export default function ScanHistoryScreen() {
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState({ ticketsLocaux: 0 })
  const [sync, setSync] = useState(false)

  useEffect(() => {
    charger()
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
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Bandeau des stats : tickets locaux + chaque statut de scan */}
        <View style={styles.statsBanner}>
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
                  <Text style={[styles.statMiniNombre, { color: p.text }]}>{stats[cle] || 0}</Text>
                  <Text style={styles.statMiniLabel}>{p.label}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Barre d'actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSync]}
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

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionReset]}
            onPress={() => {
              reinitialiser()
              charger()
            }}
          >
            <Feather name="trash-2" size={16} color="#FFFFFF" />
            <Text style={styles.actionTexte}>Vider</Text>
          </TouchableOpacity>
        </View>

        {/* Résumé des événements scannés */}
        {evenementsUniques.length > 0 && (
          <Text style={styles.sectionTitre}>
            {evenementsUniques.length} événement{evenementsUniques.length > 1 ? 's' : ''} scanné{evenementsUniques.length > 1 ? 's' : ''} · {scans.length} scan{scans.length > 1 ? 's' : ''}
          </Text>
        )}

        {/* Liste des scans */}
        {scans.length === 0 ? (
          <View style={styles.vide}>
            <Feather name="camera-off" size={40} color="#cbd5e1" />
            <Text style={styles.videTexte}>Aucun scan pour le moment</Text>
            <Text style={styles.videSous}>Scanne un billet depuis l'onglet Scanner</Text>
          </View>
        ) : (
          scans.map((item) => {
            const p = PROFIL[item.resultat] || PROFIL.INCONNU
            return (
              <View key={item.id} style={[styles.carte, { backgroundColor: p.bg }]}>
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
                  <Text style={[styles.carteStatut, { color: p.text }]}>{p.label}</Text>
                  {item.synced === 0 && (
                    <View style={styles.badge}>
                      <Feather name="wifi-off" size={10} color="#f97316" />
                      <Text style={styles.badgeTexte}>OFFLINE</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8f9fc' },
  scroll: { paddingBottom: 40 },

  // Bandeau stats
  statsBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTicket: { alignItems: 'center', paddingRight: 16, minWidth: 80 },
  statTicketNombre: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: '#6366F1' },
  statTicketLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 60, backgroundColor: '#edf0f5', marginRight: 12 },
  statGrille: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  statMiniDot: { width: 8, height: 8, borderRadius: 4 },
  statMiniNombre: { fontFamily: 'Outfit_700Bold', fontSize: 14, minWidth: 20 },
  statMiniLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#64748b' },

  // Actions
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionSync: { backgroundColor: '#6366F1' },
  actionReset: { backgroundColor: '#ef4444' },
  actionTexte: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#FFFFFF' },

  // Section
  sectionTitre: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#64748b',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Liste des scans
  vide: { alignItems: 'center', paddingTop: 60 },
  videTexte: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: '#94a3b8', marginTop: 12 },
  videSous: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#cbd5e1', marginTop: 4 },

  carte: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 6,
    borderRadius: 12, padding: 12,
  },
  carteGauche: { width: 36, alignItems: 'center' },
  carteCentre: { flex: 1 },
  carteEvenement: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#0f172a' },
  carteDate: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#64748b', marginTop: 1 },
  carteUuid: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#94a3b8', marginTop: 1 },
  carteDroite: { alignItems: 'flex-end', gap: 4 },
  carteStatut: { fontFamily: 'Outfit_700Bold', fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeTexte: { fontFamily: 'Outfit_700Bold', fontSize: 9, color: '#f97316' },
})
