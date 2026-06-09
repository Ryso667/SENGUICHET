// Liste des tickets de l'acheteur — charge SQLite (hors-ligne) + API (synchro fond)
// Cartes redesignées : bande latérale colorée, StatusBadge réutilisable, RefreshControl doré
import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import StatusBadge from '../components/StatusBadge'
import { mesTicketsLocaux, sauvegarderTicketAcheteur } from '../database/database'
import { mesBillets } from '../services/billetService'
import { GET } from '../utils/secureStorage'
import { formaterDateLisible } from '../utils/dateUtils'
import { hapticLight } from '../utils/haptics'

// Mapping des statuts tickets vers le composant StatusBadge réutilisable
const STATUS_MAP = {
  actif: 'VALIDE',
  en_attente: 'EN_ATTENTE',
  utilise: 'TERMINE',
  rembourse: 'ANNULE',
}

// Couleurs des bandes latérales selon le statut du ticket
const STRIP_COLORS = {
  actif: '#D4A574',      // or — billet valide
  en_attente: '#E8A868', // orange — en attente
  utilise: '#6CD4A0',    // vert — utilisé
  rembourse: '#E86868',  // rouge — remboursé/annulé
}

export default function MesTicketsScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [tickets, setTickets] = useState([])
  const [syncing, setSyncing] = useState(false)
  const categoryForBg = tickets[0]?.categorie || null

  // Charge les tickets depuis SQLite, puis synchronise avec l'API
  const loadTickets = useCallback(async () => {
    // 1. Affichage immédiat depuis le cache SQLite (hors-ligne)
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
      // Pas de réseau — on conserve les données SQLite existantes
    } finally {
      setSyncing(false)
    }
  }, [])

  // Recharge les tickets à chaque fois que l'écran est affiché
  useFocusEffect(useCallback(() => { loadTickets() }, [loadTickets]))

  // Affiche une carte ticket individuelle avec bande latérale colorée
  const renderItem = ({ item }) => {
    const stripColor = STRIP_COLORS[item.statut] || '#8A8A92'
    const badgeStatus = STATUS_MAP[item.statut] || 'VALIDE'
    return (
      <TouchableOpacity
        onPress={() => {
          hapticLight()
          navigation.navigate('Ticket', { ticket: item })
        }}
        activeOpacity={0.7}
        style={styles.card}
      >
        {/* Bande latérale de 4px — couleur selon le statut */}
        <View style={[styles.strip, { backgroundColor: stripColor }]} />
        <View style={styles.cardBody}>
          {/* Ligne supérieure : nom de l'événement + badge de statut */}
          <View style={styles.topRow}>
            <Text style={styles.eventName} numberOfLines={1}>
              {item.eventNom || 'Événement'}
            </Text>
            <StatusBadge status={badgeStatus} />
          </View>
          {/* Ligne date avec icône calendrier */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#B0B0B8" />
            <Text style={styles.infoText}>
              {formaterDateLisible(item.eventDate)}
            </Text>
          </View>
          {/* Ligne lieu (affichée uniquement si disponible) */}
          {item.lieu ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#B0B0B8" />
              <Text style={styles.infoText} numberOfLines={1}>{item.lieu}</Text>
            </View>
          ) : null}
          {/* Coin inférieur droit : icône QR code */}
          <View style={styles.bottomRow}>
            <Ionicons name="qr-code-outline" size={22} color="rgba(255,255,255,0.25)" />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={categoryForBg} showImage={false} gradientOverride={['rgba(0,229,160,0.5)', 'rgba(212,165,116,0.15)']} />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Header natif avec bouton retour et compteur */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes tickets</Text>
          <View style={styles.headerRight}>
            {syncing && <ActivityIndicator size="small" color="#D4A574" />}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={syncing}
              onRefresh={loadTickets}
              tintColor="#D4A574"
              colors={['#D4A574']}
              progressBackgroundColor="#2C2C30"
            />
          }
          ListEmptyComponent={
            !syncing ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={80} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyTitle}>Aucun billet pour le moment</Text>
                <Text style={styles.emptySubtitle}>
                  Explore les événements et achète ton premier billet
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => {
                    hapticLight()
                    navigation.navigate('Home')
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyCtaText}>Explorer</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1E' },
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
  },

  // SÉPARATEUR entre les cartes — ligne subtile
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 8,
  },

  // CARTE TICKET — fond #2C2C30 avec bande latérale colorée
  card: {
    backgroundColor: '#2C2C30',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  strip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    paddingLeft: 10,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventName: {
    fontSize: 17,
    fontFamily: fonts.outfit.semiBold,
    color: '#FFFFFF',
    flex: 1,
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B8',
    fontFamily: fonts.jakarta.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },

  // ÉTAT VIDE — centré avec grande icône ticket
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.outfit.semiBold,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.jakarta.regular,
    color: '#B0B0B8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 32,
    backgroundColor: '#D4A574',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 15,
    fontFamily: fonts.outfit.semiBold,
    color: '#1A1A1E',
  },
})
