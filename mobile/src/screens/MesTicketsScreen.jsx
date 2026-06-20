// Liste des tickets de l'acheteur — charge SQLite (hors-ligne) + API (synchro fond)
// Cartes redesignées : bande latérale colorée, StatusBadge réutilisable, RefreshControl doré
import { useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

import StatusBadge from '../components/StatusBadge'
import Skeleton from '../components/Skeleton'
import { mesTicketsLocaux, sauvegarderTicketAcheteur } from '../database/database'
import { useTabBarScroll } from '../context/TabBarScrollContext'
import { mesBillets } from '../services/billetService'
import { GET } from '../utils/secureStorage'
import { formaterDateLisible, estDatePassee } from '../utils/dateUtils'
import { hapticLight } from '../utils/haptics'

// Mapping des statuts tickets vers le composant StatusBadge réutilisable
const STATUS_MAP = {
  actif: 'VALIDE',
  en_attente: 'EN_ATTENTE',
  utilise: 'TERMINE',
  rembourse: 'ANNULE',
}

export default function MesTicketsScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { scrollY: tabScrollY } = useTabBarScroll()
  const navigation = useNavigation()
  const [tickets, setTickets] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [ongletActif, setOngletActif] = useState('actifs')
  const categoryForBg = tickets[0]?.categorie || null

  // Couleurs des bandes latérales selon le statut du ticket
  const STRIP_COLORS = {
    actif: colors.accent,
    en_attente: colors.orange,
    utilise: colors.green,
    rembourse: colors.danger,
  }

  const ticketsActifs = tickets.filter(t => !estDatePassee(t.eventDate))
  const ticketsPasses = tickets.filter(t => estDatePassee(t.eventDate))
  const ticketsAffiches = ongletActif === 'actifs' ? ticketsActifs : ticketsPasses

  // Charge les tickets depuis SQLite, puis synchronise avec l'API
  const loadTickets = useCallback(async () => {
    setChargement(true)
    // 1. Affichage immédiat depuis le cache SQLite (hors-ligne)
    const data = await mesTicketsLocaux()
    setTickets(data || [])
    setChargement(false)

    // 2. Synchro API en fond pour récupérer les tickets récents
    setSyncing(true)
    try {
      const telephone = await GET('@senguichet_telephone')
      const email = await GET('@senguichet_acheteur_email')
      const apiTickets = await mesBillets(telephone, email)
      if (apiTickets.length > 0) {
        // Sauvegarde chaque ticket dans SQLite
        for (const t of apiTickets) {
          await sauvegarderTicketAcheteur(t)
        }
        // Recharge depuis SQLite pour avoir les données à jour
        const frais = await mesTicketsLocaux()
        setTickets(frais || [])
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
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {formaterDateLisible(item.eventDate)}
            </Text>
          </View>
          {/* Ligne lieu (affichée uniquement si disponible) */}
          {item.lieu ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>{item.lieu}</Text>
            </View>
          ) : null}
          {/* Coin inférieur droit : icône QR code */}
          <View style={styles.bottomRow}>
            <Ionicons name="qr-code-outline" size={22} color={colors.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
          <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Header natif avec compteur */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Mes tickets</Text>
          <View style={styles.headerRight}>
            {syncing && <ActivityIndicator size="small" color={colors.accent} />}
            {ticketsAffiches.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{ticketsAffiches.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Onglets Actifs / Passés */}
        <View style={styles.tabBar}>
          {['actifs', 'passés'].map(tab => {
            const isActif = ongletActif === tab
            const count = tab === 'actifs' ? ticketsActifs.length : ticketsPasses.length
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActif && styles.tabBtnActif]}
                onPress={() => setOngletActif(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActif && styles.tabTextActif]}>
                  {tab === 'actifs' ? 'Actifs' : 'Passés'}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, isActif && styles.tabCountActif]}>
                    <Text style={[styles.tabCountText, isActif && styles.tabCountTextActif]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {chargement && tickets.length === 0 ? (
          <View style={styles.list}>
            <Skeleton type="ticket-row" count={5} />
          </View>
        ) : (
          <FlatList
            data={ticketsAffiches}
            renderItem={renderItem}
            keyExtractor={(item) => item.numero || item.uuid}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            removeClippedSubviews
            windowSize={5}
            refreshControl={
              <RefreshControl
                refreshing={syncing}
                onRefresh={loadTickets}
                tintColor={colors.accent}
                colors={[colors.accent]}
                progressBackgroundColor={colors.surface}
              />
            }
            onScroll={(e) => { tabScrollY.setValue(e.nativeEvent.contentOffset.y) }}
            scrollEventThrottle={16}
              ListEmptyComponent={
                !syncing ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="ticket-outline" size={80} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>
                      {ongletActif === 'actifs' ? 'Aucun billet actif' : 'Aucun billet passé'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {ongletActif === 'actifs'
                        ? 'Explore les événements et achète ton premier billet'
                        : 'Tes billets utilisés ou expirés apparaîtront ici'}
                    </Text>
                    {ongletActif === 'actifs' && (
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
                    )}
                  </View>
                ) : null
              }
          />
        )}
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.outfit.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  countText: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.text,
  },

  // ONGLETS Actifs / Passés
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActif: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.textSecondary,
  },
  tabTextActif: {
    color: colors.text,
  },
  tabCount: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  tabCountActif: {
    backgroundColor: colors.accent,
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.textSecondary,
  },
  tabCountTextActif: {
    color: colors.white,
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
    backgroundColor: colors.border,
    marginVertical: 8,
  },

  // CARTE TICKET — fond clair avec ombre légère et bordure
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    color: colors.text,
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
    color: colors.textSecondary,
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
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 32,
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 15,
    fontFamily: fonts.outfit.semiBold,
    color: colors.white,
  },
})
