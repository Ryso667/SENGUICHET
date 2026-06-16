// Statistiques avancées avec graphiques interactifs
// Affiche les stats globales + stats détaillées par événement (ventes/jour, répartition, taux de remplissage)
import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarChart, PieChart } from 'react-native-chart-kit'
import { spacing, borderRadius, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { fetchEvenementsAPI, fetchEvenementStats } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import GlassContainer from '../../components/GlassContainer'
import { useTabBarScroll } from '../../context/TabBarScrollContext'

const screenWidth = Dimensions.get('window').width

const getChartConfig = (colors) => ({
  backgroundColor: colors.bg,
  backgroundGradientFrom: colors.bg,
  backgroundGradientTo: colors.bgSecondary,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  labelColor: (opacity = 1) => colors.text,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: colors.accent },
  propsForBackgroundLines: { strokeDasharray: '', stroke: 'rgba(0,0,0,0.06)' },
})

export default function StatistiquesScreen() {
  const { colors } = useTheme()
  const chartConfig = useMemo(() => getChartConfig(colors), [colors])
  const s = useMemo(() => makeStyles(colors), [colors])

  const StatCard = ({ label, value, icon, color }) => (
    <GlassContainer blurType="light" style={s.card} borderLeftColor={color} borderLeftWidth={8} intensity={40}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={s.cardValue}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </GlassContainer>
  )

  const insets = useSafeAreaInsets()
  const { scrollY: tabScrollY } = useTabBarScroll()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [eventStats, setEventStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    setLoading(true)
    try {
      const data = await fetchEvenementsAPI()
      setEvents(data || [])
    } catch (err) {
      console.error('Erreur stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charge les stats détaillées d'un événement spécifique via l'API
  const chargerStatsEvenement = async (id) => {
    if (selectedEventId === id) {
      // Déselectionne si déjà actif
      setSelectedEventId(null)
      setEventStats(null)
      return
    }
    setSelectedEventId(id)
    setStatsLoading(true)
    setEventStats(null)
    try {
      const data = await fetchEvenementStats(id)
      setEventStats(data)
    } catch (err) {
      console.error('Erreur chargement stats événement:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalVendus = events.reduce((acc, e) => acc + (e.remplis || 0), 0)
    const totalCapacite = events.reduce((acc, e) => acc + (e.capacite || 0), 0)
    const revenusTotaux = events.reduce((acc, e) => {
      const val = e.revenus ? parseInt(String(e.revenus).replace(/\D/g, '')) || 0 : 0
      return acc + val
    }, 0)
    
    return {
      totalVendus,
      revenusTotaux,
      tauxRemplissage: totalCapacite > 0 ? Math.round((totalVendus / totalCapacite) * 100) : 0,
      nbEvents: events.length
    }
  }, [events])

  // Données pour le BarChart des ventes par jour (événement sélectionné)
  const ventesParJourData = useMemo(() => {
    if (!eventStats || !eventStats.ventesParJour || eventStats.ventesParJour.length === 0) return null
    const jours = eventStats.ventesParJour
    // Limiter à 7 labels max pour la lisibilité
    const maxLabels = 7
    const step = Math.max(1, Math.floor(jours.length / maxLabels))
    return {
      labels: jours.map((j, i) => {
        const d = new Date(j.date)
        return i % step === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : ''
      }),
      datasets: [{
        data: jours.map(j => j.total)
      }]
    }
  }, [eventStats])

  // Données pour le PieChart de répartition par catégorie
  const repartitionPieData = useMemo(() => {
    if (!eventStats || !eventStats.repartitionParCategorie || eventStats.repartitionParCategorie.length === 0) return null
    const pieColors = [colors.accent, colors.cyan, colors.violet, colors.orange, colors.green, colors.red]
    return eventStats.repartitionParCategorie.map((cat, i) => ({
      name: cat.categorie.length > 12 ? cat.categorie.substring(0, 12) + '…' : cat.categorie,
      population: cat.vendus,
      color: pieColors[i % pieColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }))
  }, [eventStats])

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { tabScrollY.setValue(e.nativeEvent.contentOffset.y) }}
        scrollEventThrottle={16}
      >
        <View style={s.header}>
          <Text style={s.title}>Statistiques</Text>
        </View>

        {/* Cartes récapitulatives globales */}
        <View style={s.statsGrid}>
          <StatCard label="Tickets" value={stats.totalVendus} icon="ticket-outline" color={colors.cyan} />
          <StatCard label="Revenus" value={`${Math.round(stats.revenusTotaux/1000)}k`} icon="cash" color={colors.green} />
          <StatCard label="Remplissage" value={`${stats.tauxRemplissage}%`} icon="chart-donut" color={colors.violet} />
          <StatCard label="Événements" value={stats.nbEvents} icon="calendar-star" color={colors.orange} />
        </View>

        {/* Sélecteur d'événement pour les stats détaillées */}
        {events.length > 0 && (
          <View style={s.eventPicker}>
            <Text style={s.sectionTitle}>Détails par événement</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.eventChips}>
              {events.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[s.eventChip, selectedEventId === e.id && s.eventChipActive]}
                  onPress={() => chargerStatsEvenement(e.id)}
                >
                  <Text style={[s.eventChipText, selectedEventId === e.id && s.eventChipTextActive]}>
                    {e.nom.length > 15 ? e.nom.substring(0, 15) + '…' : e.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats détaillées de l'événement sélectionné */}
        {statsLoading && (
          <View style={s.section}>
            <Skeleton type="card" count={3} />
          </View>
        )}

        {!statsLoading && eventStats && (
          <>
            {/* Cartes récapitulatives de l'événement */}
            <View style={s.statsGrid}>
              <StatCard label="Capacité" value={eventStats.totalBillets} icon="ticket-outline" color={colors.cyan} />
              <StatCard label="Vendus" value={eventStats.billetsVendus} icon="check-circle-outline" color={colors.green} />
              <StatCard label="Revenu" value={`${Math.round(eventStats.totalRevenu/1000)}k`} icon="cash" color={colors.orange} />
            </View>

            {/* Taux de remplissage — barre de progression */}
            <GlassContainer blurType="light" style={s.section} intensity={30}>
              <Text style={s.sectionTitle}>Taux de remplissage</Text>
              <View style={s.remplissageContainer}>
                <View style={s.remplissageBarBg}>
                  <View style={[s.remplissageBarFill, { width: `${Math.min(eventStats.tauxRemplissage, 100)}%` }]} />
                </View>
                <Text style={s.remplissageText}>{eventStats.tauxRemplissage}%</Text>
              </View>
              <Text style={s.remplissageSub}>
                {eventStats.billetsVendus} / {eventStats.totalBillets} billets vendus
              </Text>
            </GlassContainer>

            {/* Ventes par jour — BarChart */}
            <GlassContainer blurType="light" style={s.section} intensity={30}>
              <Text style={s.sectionTitle}>Ventes par jour</Text>
              <View style={s.chartWrapper}>
                {ventesParJourData ? (
                  <BarChart
                    data={ventesParJourData}
                    width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                    height={220}
                    chartConfig={chartConfig}
                    verticalLabelRotation={0}
                    fromZero
                    showValuesOnTopOfBars
                    style={s.chart}
                  />
                ) : (
                  <Text style={s.emptyText}>Aucune vente enregistrée</Text>
                )}
              </View>
            </GlassContainer>

            {/* Répartition par catégorie — PieChart */}
            <GlassContainer blurType="light" style={s.section} intensity={30}>
              <Text style={s.sectionTitle}>Répartition par catégorie</Text>
              <View style={s.chartWrapper}>
                {repartitionPieData ? (
                  <PieChart
                    data={repartitionPieData}
                    width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                ) : (
                  <Text style={s.emptyText}>Aucune catégorie de billet</Text>
                )}
              </View>
            </GlassContainer>
          </>
        )}

        {/* Message si aucun événement sélectionné */}
        {!statsLoading && !eventStats && events.length > 0 && (
          <GlassContainer blurType="light" style={s.section} intensity={30}>
            <Text style={s.emptyText}>Sélectionne un événement pour voir ses statistiques détaillées</Text>
          </GlassContainer>
        )}

        {events.length === 0 && (
          <GlassContainer blurType="light" style={s.section} intensity={30}>
            <Text style={s.emptyText}>Aucun événement créé pour le moment</Text>
          </GlassContainer>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

// Sera remplacé par API — composant de carte statistique
const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.text },
  pills: { flexDirection: 'row', gap: 8 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { 
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.text },
  cardLabel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },

  section: { marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.md },
  chartWrapper: { alignItems: 'center' },
  chart: { marginVertical: 8, borderRadius: 16 },
  emptyText: { padding: 40, color: colors.textTertiary, fontFamily: fonts.jakarta.regular },

  // Sélecteur d'événement
  eventPicker: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  eventChips: { flexDirection: 'row', marginTop: spacing.sm },
  eventChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  eventChipText: {
    fontSize: 13,
    fontFamily: fonts.jakarta.medium,
    color: colors.textSecondary,
  },
  eventChipTextActive: {
    color: colors.white,
  },

  // Barre de progression taux de remplissage
  remplissageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  remplissageBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  remplissageBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  remplissageText: {
    fontSize: 18,
    fontFamily: fonts.outfit.bold,
    color: colors.accent,
    minWidth: 50,
    textAlign: 'right',
  },
  remplissageSub: {
    fontSize: 12,
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
})
