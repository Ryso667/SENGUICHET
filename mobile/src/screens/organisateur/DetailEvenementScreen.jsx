// Détail d'un événement (lecture seule)
// Design glass (Apple Invites)
import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { spacing, fonts, borderRadius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { fetchEvenementDetailAPI } from '../../services/eventService'
import { fetchBilletsEvenementAPI } from '../../services/billetService'
import { formaterDateLisible } from '../../utils/dateUtils'
import Skeleton from '../../components/Skeleton'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
import { hexToRgba } from '../../utils/colors'

const getStatutConfig = (colors) => ({
  actif: { label: 'Actif', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  en_attente: { label: 'En attente', color: colors.orange, bg: hexToRgba(colors.orange, 0.15) },
  refuse: { label: 'Refusé', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
  suspendu: { label: 'Suspendu', color: colors.warning, bg: hexToRgba(colors.warning, 0.15) },
  annule: { label: 'Annulé', color: colors.textSecondary, bg: hexToRgba(colors.textSecondary, 0.15) },
})

export default function DetailEvenementScreen({ route }) {
  const { colors, mode } = useTheme()
  const STATUT_CONFIG = useMemo(() => getStatutConfig(colors), [colors])
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { eventId } = route.params || {}
  const [evenement, setEvenement] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {}
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await fetchEvenementDetailAPI(eventId)
      setEvenement(data.evenement || data)
      setTickets(data.tickets || [])
    } catch {}
    setRefreshing(false)
  }, [eventId])

  const exporterCSV = async () => {
    setExporting(true)
    try {
      const billets = await fetchBilletsEvenementAPI(eventId)
      if (billets.length === 0) {
        Alert.alert('Aucun billet', 'Aucun billet à exporter pour cet événement')
        return
      }
      const echapper = v => `"${(v || '').toString().replace(/"/g, '""')}"`
      const lignes = [
        ['Nom', 'Email', 'Téléphone', 'Catégorie', 'Prix (FCFA)', "Date d'achat", 'Statut'].join(','),
        ...billets.map(b => [
          echapper(b.nom), echapper(b.email), echapper(b.telephone),
          echapper(b.categorie), b.prix,
          echapper(formaterDateLisible(b.dateAchat)),
          echapper(b.statut === 'actif' ? 'Payé' : b.statut === 'utilise' ? 'Utilisé' : b.statut),
        ].join(',')),
      ].join('\n')
      const uri = FileSystem.cacheDirectory + `billets-${eventId}.csv`
      await FileSystem.writeAsStringAsync(uri, lignes, { encoding: FileSystem.EncodingType.UTF8 })
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Exporter les billets' })
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'exporter les billets")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  if (!evenement) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Événement introuvable</Text>
      </View>
    )
  }

  const cfg = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.en_attente
  const pct = Math.min(100, Math.round(((evenement.remplis || 0) / (evenement.capacite || 1)) * 100))

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}>
        <GlassContainer blurType="light" style={s.header} intensity={35}>
          <Text style={s.title}>{evenement.nom}</Text>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </GlassContainer>

        <View style={s.infoGrid}>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Date</Text>
            <Text style={s.infoValue}>{formaterDateLisible(evenement.date)}</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Lieu</Text>
            <Text style={s.infoValue}>{evenement.lieu || 'Non spécifié'}</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Capacité</Text>
            <Text style={s.infoValue}>{evenement.capacite || 0} places</Text>
          </GlassContainer>
          <GlassContainer blurType="light" style={s.infoCard} intensity={30}>
            <Text style={s.infoLabel}>Code contrôleur</Text>
            <Text style={[s.infoValue, { fontFamily: 'monospace', letterSpacing: 4, color: colors.text }]}>{evenement.code || '-'}</Text>
          </GlassContainer>
        </View>

        <GlassContainer blurType="light" style={s.fillSection} intensity={35}>
          <Text style={s.fillTitle}>Remplissage</Text>
          <View style={s.barRow}>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.barCount}>{evenement.remplis || 0}/{evenement.capacite || 0}</Text>
          </View>
          <Text style={s.fillPct}>{pct}%</Text>
        </GlassContainer>

        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Statistiques', { eventId })}>
          <GlassContainer blurType="light" style={s.statsCard} intensity={30}>
            <Feather name="bar-chart-2" size={22} color={colors.accent} />
            <View style={s.statsCardContent}>
              <Text style={s.statsCardTitle}>Statistiques</Text>
              <Text style={s.statsCardSub}>Voir les ventes, remplissage et revenus</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </GlassContainer>
        </TouchableOpacity>

        {evenement.description ? (
          <GlassContainer blurType="light" style={s.section} intensity={30}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.description}>{evenement.description}</Text>
          </GlassContainer>
        ) : null}

        <GlassContainer blurType="light" style={s.section} intensity={30}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Billets ({tickets.length})</Text>
            <TouchableOpacity
              style={s.exportBtn}
              onPress={exporterCSV}
              disabled={exporting}
              activeOpacity={0.7}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Feather name="download" size={16} color={colors.accent} />
              )}
              <Text style={s.exportText}>{exporting ? 'Export...' : 'CSV'}</Text>
            </TouchableOpacity>
          </View>
          {tickets.length === 0 ? (
            <Text style={s.empty}>Aucun billet vendu</Text>
          ) : (
            tickets.map(t => (
              <View key={t.id} style={s.ticketRow}>
                <Text style={s.ticketCategorie}>{t.nom}</Text>
                <Text style={s.ticketPrix}>{t.prix || 0} FCFA</Text>
                <Text style={s.ticketStatut}>{t.statut || 'valide'}</Text>
              </View>
            ))
          )}
        </GlassContainer>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: spacing.lg, padding: spacing.md,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: fonts.outfit.semiBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md,
  },
  statsCardContent: { flex: 1 },
  statsCardTitle: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.text },
  statsCardSub: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  infoCard: {
    width: '47%', padding: spacing.md,
  },
  infoLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: colors.text, marginTop: 4 },
  fillSection: { margin: spacing.lg, padding: spacing.md },
  fillTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barBg: { flex: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.accent },
  barCount: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary },
  fillPct: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.text, marginTop: spacing.sm },
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.text },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)',
  },
  exportText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: colors.accent },
  description: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, lineHeight: 22 },
  empty: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,     borderBottomColor: colors.border,
  },
  ticketCategorie: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, flex: 1 },
  ticketPrix: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.green },
  ticketStatut: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(0,0,0,0.35)', marginLeft: spacing.sm, textTransform: 'capitalize' },
})
