// Liste des tickets de l'acheteur — charge SQLite (hors-ligne) + API (synchro fond)
import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import EmptyState from '../components/EmptyState'
import { mesTicketsLocaux, sauvegarderTicketAcheteur } from '../database/database'
import { mesBillets } from '../services/billetService'
import { GET } from '../utils/secureStorage'
import { formaterDateLisible } from '../utils/dateUtils'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#00E5A0', bg: '#00E5A020' },
  en_attente: { label: 'EN ATTENTE', color: '#F97316', bg: '#F9731620' },
  utilise: { label: 'UTILISÉ', color: '#94A3B8', bg: '#94A3B820' },
  rembourse: { label: 'REMBOURSÉ', color: '#FF4D6D', bg: '#FF4D6D20' },
}

export default function MesTicketsScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [tickets, setTickets] = useState([])
  const [syncing, setSyncing] = useState(false)
  const categoryForBg = tickets[0]?.categorie || null

  const loadTickets = useCallback(async () => {
    // 1. Charge immédiat depuis SQLite (hors-ligne)
    const data = await mesTicketsLocaux()
    setTickets(data || [])

    // 2. Synchro API en fond pour récupérer les tickets récents
    setSyncing(true)
    try {
      const telephone = await GET('@senguichet_telephone')
      const email = await GET('@senguichet_acheteur_email')
      const identifiant = telephone || email
      if (identifiant) {
        const apiTickets = await mesBillets(identifiant)
        if (apiTickets.length > 0) {
          // Sauvegarde chaque ticket dans SQLite
          for (const t of apiTickets) {
            await sauvegarderTicketAcheteur(t)
          }
          // Recharge depuis SQLite pour avoir les données à jour
          const frais = await mesTicketsLocaux()
          setTickets(frais || [])
        }
      }
    } catch (_) {
      // Pas de réseau — on garde les données SQLite
    } finally {
      setSyncing(false)
    }
  }, [])

  // Recharge à chaque focus
  useFocusEffect(useCallback(() => { loadTickets() }, [loadTickets]))

  const renderItem = ({ item }) => {
    const s = STATUTS[item.statut] || STATUTS.actif
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Ticket', { ticket: item })}
        activeOpacity={0.7}
        style={styles.ticketCard}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <Feather name="tag" size={18} color="#00C8FF" />
          </View>
        </View>
        <View style={styles.cardCenter}>
          <Text style={styles.ticketTitle} numberOfLines={1}>{item.eventNom || 'Événement'}</Text>
          <Text style={styles.ticketMeta}>
            {item.categorie} | {formaterDateLisible(item.eventDate)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={categoryForBg} showImage={false} gradientOverride={['rgba(0,229,160,0.5)', 'rgba(0,200,255,0.15)']} />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Header natif */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes tickets</Text>
          <View style={styles.headerRight}>
            {syncing && <ActivityIndicator size="small" color="#00C8FF" />}
            {tickets.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{tickets.length}</Text>
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.numero || item.uuid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !syncing ? (
              <EmptyState
                icon="ticket"
                title="Aucun ticket"
                subtitle="Explore les événements et achète ton premier ticket"
                actionLabel="Explorer"
                onAction={() => navigation.navigate('Home')}
              />
            ) : null
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  content: { flex: 1 },

  // HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },

  // LISTE
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: 10,
  },

  // CARTE TICKET
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#152232',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3448',
    gap: 12,
  },
  cardLeft: {},
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,200,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: { flex: 1 },
  ticketTitle: {
    fontSize: 14,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  ticketMeta: {
    fontSize: 11,
    color: '#5A7090',
    fontFamily: fonts.jakarta.regular,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },
})
