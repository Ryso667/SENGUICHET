// Écran affichage d'un ticket acheté
// Design premium : dégradé Indigo→Rose, QR code, ligne de perforation, statut
import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { colors, gradients, shadows, spacing, borderRadius, fonts } from '../constants/theme'

const { width } = Dimensions.get('window')
const TICKET_WIDTH = width - spacing.xl * 2

// Configuration des statuts possibles avec leurs couleurs
const STATUTS = {
  valide: { label: '✓ VALIDE', color: colors.green, bg: '#ECFDF5' },
  utilise: { label: '✗ UTILISÉ', color: colors.mid, bg: '#F1F5F9' },
  expire: { label: '✗ EXPIRÉ', color: colors.red, bg: '#FEF2F2' },
}

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params
  const st = STATUTS[ticket.statut] || STATUTS.valide

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={19} color={colors.slate} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>Mon ticket</Text>
          <View style={{ width: 19 }} />
        </View>

        <View style={s.ticket}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
            <Text style={s.eventName}>{ticket.eventNom}</Text>
            <Text style={s.eventDate}>{ticket.eventDate}</Text>
          </LinearGradient>

          <View style={s.qrSection}>
            <View style={s.qrWrap}>
              <QRCode value={ticket.id} size={140} backgroundColor="white" color={colors.slate} />
            </View>
            <Text style={s.ticketNum}>{ticket.numero || 'TKT-000'}</Text>
          </View>

          <View style={s.perforation} />

          <View style={s.infoGrid}>
            {[
              { label: 'Catégorie', value: ticket.categorie },
              { label: 'Prix', value: ticket.prix ? `${ticket.prix.toLocaleString()} CFA` : '—' },
              { label: 'Téléphone', value: ticket.telephone },
              { label: 'Statut', value: st.label, color: st.color },
            ].map((item, i) => (
              <View key={i} style={s.infoItem}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={[s.infoValue, item.color && { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => Alert.alert('Simulation', 'Ticket exporté en PDF')}>
              <Feather name="download" size={13} color="#fff" />
              <Text style={s.btnPrimaryText}>Exporter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => Alert.alert('Simulation', 'Lien de partage généré')}>
              <Feather name="share-2" size={13} color={colors.slate} />
              <Text style={s.btnSecondaryText}>Partager</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>
              Acheté le {new Date(ticket.dateAchat).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
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
  ticket: {
    width: TICKET_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  eventName: {
    fontSize: 22,
    fontFamily: fonts.outfit.bold,
    color: colors.white,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  qrSection: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  ticketNum: {
    fontSize: 16,
    fontFamily: fonts.outfit.bold,
    color: colors.slate,
    marginTop: spacing.md,
    letterSpacing: 2,
  },
  perforation: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
    marginHorizontal: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
  },
  infoItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: fonts.jakarta.regular,
    color: colors.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: fonts.outfit.semiBold,
    color: colors.slate,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.jakarta.regular,
    color: colors.muted,
  },
})
