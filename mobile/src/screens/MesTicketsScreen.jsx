// Liste des tickets de l'acheteur — version glass
// FlatList avec stagger animation, chaque item est une carte glass
import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { fonts, colors, spacing, borderRadius, glass, textShadow } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { mesBillets } from '../services/billetService'
import { formaterDateLisible } from '../utils/dateUtils'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#00E5A0', bg: '#00E5A015' },
  en_attente: { label: 'EN ATTENTE', color: '#F97316', bg: '#F9731615' },
  utilise: { label: 'UTILISÉ', color: '#94A3B8', bg: '#94A3B815' },
  rembourse: { label: 'REMBOURSÉ', color: '#FF4D6D', bg: '#FF4D6D15' },
}

export default function MesTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const { numeroTel, profil } = useAuth()
  const categoryForBg = tickets[0]?.categorie || null

  // Charge les tickets depuis le service billetService
  const loadTickets = useCallback(async () => {
    const identifiant = numeroTel || profil?.email
    if (identifiant) {
      const data = await mesBillets(identifiant)
      setTickets(data || [])
    }
  }, [numeroTel, profil])

  // Recharge les tickets à chaque focus de l'écran
  useFocusEffect(useCallback(() => { loadTickets() }, [loadTickets]))

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    setRefreshing(false)
  }

  // Affiche un ticket sous forme de carte glass
  const renderItem = ({ item }) => {
    const s = STATUTS[item.statut] || STATUTS.actif
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Ticket', { ticket: item })}
        activeOpacity={0.7}
      >
        <GlassContainer style={styles.ticketCard} intensity={40}>
          <View style={styles.eventThumb}>
            <LinearGradient colors={['#6366F1', '#EC4899']} style={styles.thumbGradient}>
              <Feather name="ticket" size={18} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle} numberOfLines={1}>{item.eventNom || 'Événement'}</Text>
            <Text style={styles.ticketMeta}>
              {item.categorie} · {formaterDateLisible(item.eventDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </GlassContainer>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={categoryForBg} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes tickets</Text>
          {tickets.length > 0 && (
            <GlassContainer style={styles.countBadge} intensity={50}>
              <Text style={styles.countText}>{tickets.length}</Text>
            </GlassContainer>
          )}
        </View>

        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.numero || item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <EmptyState
              icon="ticket"
              title="Aucun ticket"
              subtitle="Explore les événements et achète ton premier ticket"
              actionLabel="Explorer"
              onAction={() => navigation.navigate('Home')}
            />
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.5, ...textShadow },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: 10 },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12,
  },
  eventThumb: {
    width: 52, height: 52, borderRadius: borderRadius.md, overflow: 'hidden',
  },
  thumbGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff', letterSpacing: -0.1, ...textShadow },
  ticketMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.jakarta.regular, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 10, fontFamily: fonts.jakarta.semiBold },
})
