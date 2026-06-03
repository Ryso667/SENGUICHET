// Tableau de bord organisateur - mode lecture seule
// Bannière info + stats 2x2 + activités récentes (données mockées)
import React from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import StatCard from '../../components/StatCard'
import SectionHeader from '../../components/SectionHeader'

const MOCK_STATS = {
  billetsVendus: 12580,
  revenus: 45250000,
  evenementsActifs: 3,
  prochainEvent: { date: '15 Juin 2026', nom: "Concert N'Dakaru" },
}

const MOCK_VENTES = [
  { id: '1', evenement: 'Festival Jazz St-Louis', date: '28 Mai 2026', montant: '25 000 FCFA' },
  { id: '2', evenement: "Concert N'Dakaru", date: '27 Mai 2026', montant: '15 000 FCFA' },
  { id: '3', evenement: 'Festival Jazz St-Louis', date: '26 Mai 2026', montant: '25 000 FCFA' },
  { id: '4', evenement: 'Expo Art Dakar', date: '25 Mai 2026', montant: '10 000 FCFA' },
  { id: '5', evenement: "Concert N'Dakaru", date: '24 Mai 2026', montant: '15 000 FCFA' },
]

function fmt(n) {
  return n.toLocaleString('fr-FR')
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C8FF" />}
      >
        <View style={styles.banner}>
          <View style={styles.bannerBorder} />
          <View style={styles.bannerContent}>
            <Feather name="info" size={16} color="#00C8FF" />
            <Text style={styles.bannerText}>
              Votre espace est en lecture seule. Pour toute modification, utilisez la section Mes demandes.
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="ticket" value={fmt(MOCK_STATS.billetsVendus)} label="Billets vendus" />
          <StatCard icon="dollar-sign" value={`${fmt(MOCK_STATS.revenus)} FCFA`} label="Revenus" />
          <StatCard icon="calendar" value={String(MOCK_STATS.evenementsActifs)} label="Événements actifs" />
          <StatCard icon="clock" value={MOCK_STATS.prochainEvent.date} label={MOCK_STATS.prochainEvent.nom} />
        </View>

        <View style={styles.ventes}>
          <SectionHeader title="Dernières ventes" />
          {MOCK_VENTES.map((v) => (
            <View key={v.id} style={styles.venteItem}>
              <View style={styles.venteIcon}>
                <Feather name="ticket" size={16} color="#00C8FF" />
              </View>
              <View style={styles.venteInfo}>
                <Text style={styles.venteNom}>{v.evenement}</Text>
                <Text style={styles.venteDate}>{v.date}</Text>
              </View>
              <Text style={styles.venteMontant}>{v.montant}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,200,255,0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerBorder: {
    width: 4,
    backgroundColor: '#00C8FF',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  ventes: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  venteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152232',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  venteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,200,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venteInfo: {
    flex: 1,
  },
  venteNom: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  venteDate: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    marginTop: 2,
  },
  venteMontant: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#00C8FF',
  },
})
