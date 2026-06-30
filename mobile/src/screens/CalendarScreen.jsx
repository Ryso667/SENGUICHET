// Écran calendrier — vue mensuelle des événements
// Permet de naviguer par mois et de voir les événements d'un jour spécifique
import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { spacing, fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { formaterDateLisible } from '../utils/dateUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'
import AsyncStorage from '@react-native-async-storage/async-storage'

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

// Convertit une date stockée en chaîne YYYY-MM-DD pour la comparaison
function toDateKey(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${j}`
}

// Génère le tableau des jours pour un mois donné
function genererJoursMois(annee, mois) {
  const premier = new Date(annee, mois, 1)
  const dernier = new Date(annee, mois + 1, 0)
  const decalage = (premier.getDay() + 6) % 7 // Lundi = 0
  const jours = []
  for (let i = 0; i < decalage; i++) jours.push(null)
  for (let i = 1; i <= dernier.getDate(); i++) jours.push(i)
  return jours
}

export default function CalendarScreen({ navigation }) {
  const { colors, mode, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const maintenant = new Date()
  const [annee, setAnnee] = useState(maintenant.getFullYear())
  const [mois, setMois] = useState(maintenant.getMonth())
  const [selection, setSelection] = useState(toDateKey(maintenant))
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreCalendrier, setFiltreCalendrier] = useState('tout')
  const [ticketsDates, setTicketsDates] = useState({})
  const [loadingTickets, setLoadingTickets] = useState(false)
  const { numeroTel, email } = useAuth()
  const styles = useMemo(() => makeStyles(colors), [colors])

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEvenementsPublics()
        setEvenements(data)
      } catch { /* silencieux */ }
      setChargement(false)
    })()
  }, [])

  // Charge les billets de l'acheteur quand le filtre est actif
  useFocusEffect(
    useCallback(() => {
      if (filtreCalendrier !== 'mes-billets') return
      let actif = true
      ;(async () => {
        setLoadingTickets(true)
        try {
          const telStocke = numeroTel || await AsyncStorage.getItem('@senguichet_telephone')
          const tickets = await mesBillets(telStocke, email)
          if (!actif) return
          const map = {}
          tickets.forEach(t => {
            const key = toDateKey(t.eventDate)
            if (key) {
              if (!map[key]) map[key] = []
              map[key].push(t)
            }
          })
          setTicketsDates(map)
        } catch { /* silencieux */ }
        if (actif) setLoadingTickets(false)
      })()
      return () => { actif = false }
    }, [filtreCalendrier, numeroTel, email])
  )

  // Indexe les événements par date pour un lookup rapide
  const eventsParDate = useMemo(() => {
    const map = {}
    evenements.forEach(e => {
      const key = toDateKey(e.date)
      if (key) {
        if (!map[key]) map[key] = []
        map[key].push(e)
      }
    })
    return map
  }, [evenements])

  // Événements du jour sélectionné
  const eventsDuJour = useMemo(() => {
    return eventsParDate[selection] || []
  }, [eventsParDate, selection])

  const jours = useMemo(() => genererJoursMois(annee, mois), [annee, mois])
  const titreMois = `${MOIS[mois]} ${annee}`

  const naviguerMois = (delta) => {
    let nouveauMois = mois + delta
    let nouvelleAnnee = annee
    if (nouveauMois < 0) { nouveauMois = 11; nouvelleAnnee-- }
    if (nouveauMois > 11) { nouveauMois = 0; nouvelleAnnee++ }
    setMois(nouveauMois)
    setAnnee(nouvelleAnnee)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendrier</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Navigation mois */}
      <View style={styles.moisNav}>
        <TouchableOpacity onPress={() => naviguerMois(-1)} style={styles.moisArrow}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.moisTitre}>{titreMois}</Text>
        <TouchableOpacity onPress={() => naviguerMois(1)} style={styles.moisArrow}>
          <Feather name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filtre calendrier */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filtreCalendrier === 'tout' && styles.filterChipActive]}
          onPress={() => setFiltreCalendrier('tout')}
        >
          <Text style={[styles.filterText, filtreCalendrier === 'tout' && styles.filterTextActive]}>
            Tous les événements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filtreCalendrier === 'mes-billets' && styles.filterChipActive]}
          onPress={() => setFiltreCalendrier('mes-billets')}
        >
          <Text style={[styles.filterText, filtreCalendrier === 'mes-billets' && styles.filterTextActive]}>
            Mes billets
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.joursHeader}>
        {JOURS_SEMAINE.map(j => (
          <Text key={j} style={styles.jourNom}>{j}</Text>
        ))}
      </View>

      {/* Grille des jours */}
      <View style={styles.grille}>
        {jours.map((jour, i) => {
          if (jour === null) return <View key={`v-${i}`} style={styles.cellVide} />
          const dateKey = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
          const estSelection = dateKey === selection
          const aEvents = !!eventsParDate[dateKey]
          const aTickets = filtreCalendrier === 'mes-billets' && !!ticketsDates[dateKey]
          return (
            <TouchableOpacity
              key={`${mois}-${jour}`}
              style={[styles.cell, estSelection && styles.cellActive]}
              onPress={() => {
                if (filtreCalendrier === 'mes-billets' && ticketsDates[dateKey]) {
                  navigation.navigate('RecuAchat', {
                    reference: ticketsDates[dateKey][0].numero,
                    billetsAchetes: ticketsDates[dateKey],
                  })
                } else {
                  setSelection(dateKey)
                }
              }}
            >
              <Text style={[styles.cellJour, estSelection && styles.cellJourActive]}>
                {jour}
              </Text>
              {aTickets && <View style={[styles.dotVert, estSelection && styles.dotVertActive]} />}
              {!aTickets && aEvents && <View style={[styles.dot, estSelection && styles.dotActive]} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Liste événements du jour */}
      <View style={styles.eventSection}>
        <Text style={styles.eventSectionTitre}>
          {eventsDuJour.length > 0
            ? `${eventsDuJour.length} événement${eventsDuJour.length > 1 ? 's' : ''}`
            : "Aucun événement"}
        </Text>
        {chargement ? (
          <View style={styles.centrer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : eventsDuJour.length > 0 ? (
          <FlatList
            data={eventsDuJour}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
                activeOpacity={0.7}
              >
                <Text style={styles.eventEmoji}>{item.emoji || '\uD83C\uDFAB'}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitre} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.eventMeta}>
                    {item.time || ''}{item.time && item.lieu ? ' · ' : ''}{item.lieu || ''}
                  </Text>
                </View>
                <Text style={styles.eventPrix}>{item.priceLabel || ''}</Text>
                <Feather name="chevron-right" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}
          />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun événement ce jour</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text },
  moisNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  moisArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  moisTitre: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.text },
  joursHeader: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  jourNom: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: colors.textSecondary },
  grille: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellVide: { width: `${100 / 7}%` },
  cellActive: { backgroundColor: colors.accent },
  cellJour: { fontSize: 14, fontFamily: fonts.jakarta.medium, color: colors.text },
  cellJourActive: { color: colors.white, fontFamily: fonts.jakarta.bold },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.bgSecondary },
  filterChipActive: { backgroundColor: colors.accent },
  filterText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 2 },
  dotActive: { backgroundColor: colors.white },
  dotVert: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981', marginTop: 2 },
  dotVertActive: { backgroundColor: colors.white },
  eventSection: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  eventSectionTitre: { fontSize: 14, fontFamily: fonts.jakarta.semiBold, color: colors.textSecondary, marginBottom: 8 },
  centrer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  eventEmoji: { fontSize: 24, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTitre: { fontSize: 14, fontFamily: fonts.jakarta.semiBold, color: colors.text },
  eventMeta: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 2 },
  eventPrix: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: colors.accent, marginRight: 8 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, fontFamily: fonts.jakarta.medium, color: colors.textTertiary, marginTop: 8 },
})
