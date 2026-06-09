// Statistiques Premium pour l'organisateur
// Design glass (Apple Invites)
import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarChart, PieChart } from 'react-native-chart-kit'
import { colors, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'
import GlassChip from '../../components/GlassChip'

const screenWidth = Dimensions.get('window').width

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'rgba(255,255,255,0.05)',
  backgroundGradientTo: 'rgba(255,255,255,0.05)',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: colors.accent },
}

export default function StatistiquesScreen() {
  const insets = useSafeAreaInsets()
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

  const barData = useMemo(() => {
    const top5 = [...events].sort((a, b) => (b.remplis || 0) - (a.remplis || 0)).slice(0, 5)
    return {
      labels: top5.map(e => e.nom.substring(0, 6) + '.'),
      datasets: [{ data: top5.map(e => e.remplis || 0) }]
    }
  }, [events])

  const pieData = useMemo(() => {
    const top3 = [...events].sort((a, b) => {
      const rb = b.revenus ? parseInt(String(b.revenus).replace(/\D/g, '')) || 0 : 0
      const ra = a.revenus ? parseInt(String(a.revenus).replace(/\D/g, '')) || 0 : 0
      return rb - ra
    }).slice(0, 3)

    const chartColors = [colors.accent, colors.orange, '#6CD4A0']
    return top3.map((e, i) => ({
      name: e.nom.substring(0, 10),
      population: e.remplis || 0,
      color: chartColors[i],
      legendFontColor: 'rgba(255,255,255,0.8)',
      legendFontSize: 12
    }))
  }, [events])

  if (loading) {
    return (
      <View style={s.container}>
        <OrganisateurLayout />
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Performances</Text>
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
          <StatCard label="Tickets" value={stats.totalVendus} icon="ticket-outline" color={colors.accent} />
          <StatCard label="Revenus" value={`${Math.round(stats.revenusTotaux/1000)}k`} icon="cash" color="#00E5A0" />
          <StatCard label="Remplissage" value={`${stats.tauxRemplissage}%`} icon="chart-donut" color="#F97316" />
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

// Sera remplacé par API — composant de carte statistique
function StatCard({ label, value, icon, color }) {
  return (
    <GlassContainer blurType="light" style={[s.card, { borderLeftColor: color, borderLeftWidth: 4 }]} intensity={40}>
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
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  pills: { flexDirection: 'row', gap: 8 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { 
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.md,
  },
  cardValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  cardLabel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },

  section: { marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', marginBottom: spacing.md, ...textShadow },
  chartWrapper: { 
    alignItems: 'center',
  },
  chart: { marginVertical: 8, borderRadius: 16 },
  emptyText: { padding: 40, color: 'rgba(255,255,255,0.5)', fontFamily: fonts.jakarta.regular },
})
