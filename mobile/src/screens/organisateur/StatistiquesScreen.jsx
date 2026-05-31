// Statistiques Premium pour l'organisateur
// Utilise react-native-chart-kit pour une stabilité maximale sur iOS/Android
import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BarChart, PieChart } from 'react-native-chart-kit'
import { colors, spacing, borderRadius, fonts, shadows } from '../../constants/theme'
import { fetchEvenementsAPI } from '../../services/eventService'
import Skeleton from '../../components/Skeleton'

const screenWidth = Dimensions.get('window').width

// Configuration esthétique des graphiques
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#00C8FF' },
}

export default function StatistiquesScreen() {
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

  // Calculs mémoïsés pour la performance
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

  // Données pour le graphique en barres (Top 5 événements)
  const barData = useMemo(() => {
    const top5 = [...events].sort((a, b) => (b.remplis || 0) - (a.remplis || 0)).slice(0, 5)
    return {
      labels: top5.map(e => e.nom.substring(0, 6) + '.'),
      datasets: [{ data: top5.map(e => e.remplis || 0) }]
    }
  }, [events])

  // Données pour le graphique circulaire (Répartition revenus)
  const pieData = useMemo(() => {
    const top3 = [...events].sort((a, b) => {
      const rb = b.revenus ? parseInt(String(b.revenus).replace(/\D/g, '')) || 0 : 0
      const ra = a.revenus ? parseInt(String(a.revenus).replace(/\D/g, '')) || 0 : 0
      return rb - ra
    }).slice(0, 3)

    const colors = ['#00C8FF', '#0077FF', '#00E5A0']
    return top3.map((e, i) => ({
      name: e.nom.substring(0, 10),
      population: e.remplis || 0,
      color: colors[i],
      legendFontColor: '#64748b',
      legendFontSize: 12
    }))
  }, [events])

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg }}><Skeleton type="card" count={4} /></View>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Sélecteur de période simplifié */}
      <View style={s.header}>
        <Text style={s.title}>Performances</Text>
        <View style={s.pills}>
          {['7j', '30j', 'Tout'].map(p => (
            <TouchableOpacity 
              key={p} 
              style={[s.pill, periode === p && s.pillActive]}
              onPress={() => setPeriode(p)}
            >
              <Text style={[s.pillText, periode === p && s.pillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cartes de synthèse */}
      <View style={s.statsGrid}>
        <StatCard label="Tickets" value={stats.totalVendus} icon="ticket-outline" color="#00C8FF" />
        <StatCard label="Revenus" value={`${Math.round(stats.revenusTotaux/1000)}k`} icon="cash" color="#00E5A0" />
        <StatCard label="Remplissage" value={`${stats.tauxRemplissage}%`} icon="chart-donut" color="#F97316" />
        <StatCard label="Événements" value={stats.nbEvents} icon="calendar-star" color="#0077FF" />
      </View>

      {/* Graphique de Ventes */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Top 5 Événements (Ventes)</Text>
        <View style={s.chartWrapper}>
          {barData.datasets[0].data.length > 0 ? (
            <BarChart
              data={barData}
              width={screenWidth - spacing.lg * 2}
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
      </View>

      {/* Graphique de Répartition */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Répartition des ventes</Text>
        <View style={s.chartWrapper}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - spacing.lg * 2}
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
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[s.card, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={s.cardValue}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, marginBottom: spacing.md
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.mid },
  pillTextActive: { color: '#fff' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { 
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    borderLeftWidth: 4, ...shadows.sm
  },
  cardIcon: { marginBottom: 4 },
  cardValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.slate },
  cardLabel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.md },
  chartWrapper: { 
    backgroundColor: '#fff', borderRadius: borderRadius.xl, padding: spacing.sm, 
    alignItems: 'center', ...shadows.sm 
  },
  chart: { marginVertical: 8, borderRadius: 16 },
  emptyText: { padding: 40, color: colors.muted, fontFamily: fonts.jakarta.regular },
})
