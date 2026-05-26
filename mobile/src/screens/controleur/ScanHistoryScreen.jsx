// Historique des scans effectués par le contrôleur
// Stats, synchro batch des scans offline, téléchargement tickets pour offline
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getHistorique, synchroniser, telechargerTickets, reinitialiser } from '../../services/scanService'

// Couleurs par résultat de scan (fond + texte)
const COULEURS = {
  VALIDE: { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  DEJA_UTILISE: { bg: '#fff7ed', text: '#9a3412', dot: '#f97316' },
  EXPIRE: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
  INCONNU: { bg: '#fef2f2', text: '#7f1d1d', dot: '#b91c1c' },
  FRAUDE: { bg: '#fef2f2', text: '#dc2626', dot: '#dc2626' },
}

export default function ScanHistoryScreen() {
  const [scans, setScans] = useState([])
  const [sync, setSync] = useState(false)
  const [telechargement, setTelechargement] = useState(false)

  // Charge l'historique des scans au montage du composant
  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    const data = await getHistorique()
    setScans(data)
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

  // Télécharge les tickets pour vérification offline
  const handleDownload = async () => {
    setTelechargement(true)
    try {
      await telechargerTickets(1, 'STANDARD')
      alert('Tickets téléchargés avec succès')
    } catch {
      alert('Erreur de téléchargement')
    } finally {
      setTelechargement(false)
    }
  }

  // Réinitialisation complète de la base locale SQLite
  const handleReset = async () => {
    await reinitialiser()
    await charger()
    alert('Base locale réinitialisée')
  }

  // Statistiques : total, valides, en attente de synchro
  const stats = {
    total: scans.length,
    valides: scans.filter((s) => s.resultat === 'VALIDE').length,
    enAttente: scans.filter((s) => s.synced === 0).length,
  }

  return (
    <View style={styles.conteneur}>
      {/* Entête avec stats */}
      <View style={styles.header}>
        <Text style={styles.titre}>Historique des scans</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNombre}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNombre, { color: '#22c55e' }]}>{stats.valides}</Text>
            <Text style={styles.statLabel}>Valides</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNombre, { color: '#f97316' }]}>{stats.enAttente}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>
      </View>

      {/* Boutons d'action : synchro, téléchargement, reset */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSync]}
          onPress={handleSync}
          disabled={sync}
        >
          {sync ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionTexte}>Synchroniser</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDownload]}
          onPress={handleDownload}
          disabled={telechargement}
        >
          {telechargement ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionTexte}>Télécharger tickets</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionReset]} onPress={handleReset}>
          <Text style={styles.actionTexte}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des scans */}
      <FlatList
        data={scans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucun scan pour le moment</Text>
        }
        renderItem={({ item }) => {
          const c = COULEURS[item.resultat] || COULEURS.INCONNU
          return (
            <View style={[styles.carte, { backgroundColor: c.bg }]}>
              <View style={[styles.dot, { backgroundColor: c.dot }]} />
              <View style={styles.carteInfo}>
                <Text style={styles.carteUuid}>{item.uuid_billet?.slice(0, 8)}...</Text>
                <Text style={styles.carteDate}>
                  {new Date(item.timestamp_scan).toLocaleString('fr-FR')}
                </Text>
              </View>
              <Text style={[styles.carteStatut, { color: c.text }]}>
                {item.resultat}
              </Text>
              {/* Badge OFFLINE pour les scans non encore synchronisés */}
              {item.synced === 0 && <Text style={styles.badge}>OFFLINE</Text>}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  titre: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#0f172a', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, backgroundColor: '#f8f9fc', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNombre: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#0f172a' },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionSync: { backgroundColor: '#6366F1' },
  actionDownload: { backgroundColor: '#22c55e' },
  actionReset: { backgroundColor: '#ef4444' },
  actionTexte: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  liste: { paddingHorizontal: 20, paddingBottom: 40 },
  vide: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  carte: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  carteInfo: { flex: 1 },
  carteUuid: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#0f172a' },
  carteDate: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#64748b', marginTop: 2 },
  carteStatut: { fontFamily: 'Outfit_700Bold', fontSize: 13 },
  badge: { fontFamily: 'Outfit_700Bold', fontSize: 10, color: '#f97316', backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
})
