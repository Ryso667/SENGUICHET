import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={19} color={colors.slate} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Mon ticket</Text>
          <View style={{ width: 19 }} />
        </View>

        <View style={styles.card}>
          <View style={[styles.cardTop, { backgroundColor: ticket.bg || colors.slate }]}>
            <Text style={styles.cardEmoji}>{ticket.emoji || '🎶'}</Text>
            <Text style={styles.cardTitle}>{ticket.eventTitle}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={9} color="rgba(255,255,255,0.65)" />
              <Text style={styles.metaText}>{ticket.location}</Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={9} color="rgba(255,255,255,0.65)" />
              <Text style={styles.metaText}>{ticket.eventDate} · {ticket.time}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Catégorie</Text>
                <Text style={styles.infoValue}>{ticket.category}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prix</Text>
                <Text style={[styles.infoValue, { color: colors.accent }]}>{ticket.price.toLocaleString()}F</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{ticket.phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Statut</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Prêt</Text>
                </View>
              </View>
            </View>

            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <QRCode value={ticket.id} size={120} backgroundColor="white" color={colors.slate} />
              </View>
              <Text style={styles.ticketId}>{ticket.id}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => Alert.alert('Simulation', 'Ticket exporté en PDF')}>
                <Feather name="download" size={13} color="#fff" />
                <Text style={styles.btnPrimaryText}>Exporter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => Alert.alert('Simulation', 'Lien de partage généré')}>
                <Feather name="share-2" size={13} color={colors.slate} />
                <Text style={styles.btnSecondaryText}>Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Feather name="lock" size={11} color={colors.muted} />
          <Text style={styles.footerText}>Ticket sauvegardé localement · Sans compte</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },

  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  topBarTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.slate,
    letterSpacing: -0.2,
  },

  card: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardTop: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 5,
  },
  cardEmoji: { fontSize: 30, marginBottom: 4 },
  cardTitle: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fonts.jakarta.regular,
  },
  cardBody: {
    padding: spacing.lg,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  infoItem: {
    width: '44%',
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: fonts.jakarta.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.mid,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: colors.slate,
    letterSpacing: -0.1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: '#16a34a',
  },

  qrWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  qrBox: {
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  ticketId: {
    fontSize: 8,
    fontFamily: fonts.jakarta.semiBold,
    letterSpacing: 2.5,
    color: colors.muted,
    textTransform: 'uppercase',
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  btnPrimaryText: { fontFamily: fonts.outfit.bold, fontSize: 11, color: '#fff' },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: { fontFamily: fonts.outfit.bold, fontSize: 11, color: colors.slate },

  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
    textAlign: 'center',
  },
})
