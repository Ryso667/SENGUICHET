// Statistiques organisateur avec graphiques
// LineChart (ventes), PieChart (répartition), BarChart (revenus cumulés)
import React from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'

const screenWidth = Dimensions.get('window').width

const chartConfig = {
  backgroundColor: '#152232',
  backgroundGradientFrom: '#152232',
  backgroundGradientTo: '#152232',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 200, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(160, 180, 200, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#00C8FF' },
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)' },
}

const ventesData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [{ data: [120, 450, 280, 800, 540, 920] }],
}

const revenusData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [{ data: [1200, 5400, 3200, 9600, 6500, 11000] }],
}

const pieData = [
  { name: 'Jazz', population: 35, color: '#00C8FF', legendFontColor: '#A0B4C8', legendFontSize: 12 },
  { name: 'Concert', population: 30, color: '#0077FF', legendFontColor: '#A0B4C8', legendFontSize: 12 },
  { name: 'Expo', population: 20, color: '#00E5A0', legendFontColor: '#A0B4C8', legendFontSize: 12 },
  { name: 'Sport', population: 15, color: '#FFB347', legendFontColor: '#A0B4C8', legendFontSize: 12 },
]

const labelStyle = { fontFamily: 'Outfit_400Regular' }

export default function StatistiquesScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ventes par jour</Text>
        <LineChart
          data={ventesData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Répartition par catégorie</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenus cumulés (x1000 FCFA)</Text>
        <BarChart
          data={revenusData}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(0, 200, 255, ${opacity})`,
          }}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    padding: 16,
  },
  card: {
    backgroundColor: '#152232',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
})
