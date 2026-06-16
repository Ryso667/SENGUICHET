// Statistiques Premium pour l'organisateur
// Design glass (Apple Invites)
import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarChart, PieChart } from 'react-native-chart-kit'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import GlassContainer from '../../components/GlassContainer'
import GlassChip from '../../components/GlassChip'
import { useTabBarScroll } from '../../context/TabBarScrollContext'

const screenWidth = Dimensions.get('window').width

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'rgba(0,0,0,0.03)',
  backgroundGradientTo: 'rgba(0,0,0,0.03)',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(92, 107, 192, ${opacity})`,
  labelColor: (opacity = 1) => colors.text,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: colors.accent },
}

export default function StatistiquesScreen() {
  const insets = useSafeAreaInsets()
  const { scrollY: tabScrollY } = useTabBarScroll()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('30j')

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

  const barColors = ['#5C6BC0', '#FFA726', '#66BB6A', '#FF4D6D', '#9575CD']

  const barData = useMemo(() => {
    const top5 = [...events].sort((a, b) => (b.remplis || 0) - (a.remplis || 0)).slice(0, 5)
    return {
      labels: top5.map(e => e.nom.length > 8 ? e.nom.substring(0, 8) + '…' : e.nom),
      datasets: [{
        data: top5.map(e => e.remplis || 0),
        colors: top5.map((_, i) => (opacity = 1) => barColors[i] + Math.round(opacity * 255).toString(16).padStart(2, '0'))
      }]
    }
  }, [events])

  const pieData = useMemo(() => {
    const top3 = [...events].sort((a, b) => (b.remplis || 0) - (a.remplis || 0)).slice(0, 3)

    const chartColors = ['#5C6BC0', '#FFA726', '#66BB6A']
    return top3.map((e, i) => ({
      name: e.nom.length > 12 ? e.nom.substring(0, 12) + '…' : e.nom,
      population: e.remplis || 0,
      color: chartColors[i],
      legendFontColor: colors.text,
      legendFontSize: 12
    }))
  }, [events])

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
          <View style={s.pills}>
            {['7j', '30j', 'Tout'].map(p => (
              <GlassChip
                key={p}
                label={p}
                active={periode === p}
                onPress={() => setPeriode(p)}
              />
            ))}
          </View>
        </View>

        <View style={s.statsGrid}>
          <StatCard label="Tickets" value={stats.totalVendus} icon="ticket-outline" color={colors.cyan} />
          <StatCard label="Revenus" value={`${Math.round(stats.revenusTotaux/1000)}k`} icon="cash" color={colors.green} />
          <StatCard label="Remplissage" value={`${stats.tauxRemplissage}%`} icon="chart-donut" color={colors.violet} />
          <StatCard label="Événements" value={stats.nbEvents} icon="calendar-star" color={colors.orange} />
        </View>

        <GlassContainer blurType="light" style={s.section} intensity={30}>
          <Text style={s.sectionTitle}>Top 5 Événements (Ventes)</Text>
          <View style={s.chartWrapper}>
            {barData.datasets[0].data.length > 0 ? (
              <BarChart
                data={barData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={220}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                showValuesOnTopOfBars
                withCustomBarColorFromData
                flatColor
                style={s.chart}
              />
            ) : (
              <Text style={s.emptyText}>Aucune donnée de vente</Text>
            )}
          </View>
        </GlassContainer>

        <GlassContainer blurType="light" style={s.section} intensity={30}>
          <Text style={s.sectionTitle}>Répartition des ventes</Text>
          <View style={s.chartWrapper}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={s.emptyText}>Aucun événement actif</Text>
            )}
          </View>
        </GlassContainer>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

// Sera remplacé par API — composant de carte statistique
function StatCard({ label, value, icon, color }) {
  return (
    <GlassContainer blurType="light" style={s.card} borderLeftColor={color} borderLeftWidth={8} intensity={40}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={s.cardValue}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </GlassContainer>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
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
  chartWrapper: { 
    alignItems: 'center',
  },
  chart: { marginVertical: 8, borderRadius: 16 },
  emptyText: { padding: 40, color: colors.textTertiary, fontFamily: fonts.jakarta.regular },
})
