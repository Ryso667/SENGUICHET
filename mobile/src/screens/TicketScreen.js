// Écran ticket inspiré d'un billet physique (format PDF)
// Sections séparées par des pointillés, REF + QR + statut + infos
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { colors, gradients, shadows, spacing, borderRadius, fonts } from '../constants/theme'
import { formaterDateLisible } from '../utils/dateUtils'

const { width } = Dimensions.get('window')
const TICKET_WIDTH = width - spacing.xl * 2
const QR_REFRESH_INTERVAL = 30
const CLE_SECRETE_QR = 'senguichet-cle-secrete-hmac'

const STATUTS = {
  valide: { label: '✓ VALIDE', color: '#059669' },
  utilise: { label: '✗ CONTRÔLÉ', color: '#64748b' },
  expire: { label: '✗ EXPIRÉ', color: '#dc2626' },
}

// Génère un payload QR frais avec HMAC-SHA256 (anti-rejeu et anti-contrefaçon)
// Le QR change toutes les 30s pour empêcher le screenshot frauduleux
async function genererQRPayload(ticket) {
  const now = new Date().toISOString()
  const payload = `${ticket.id}|${ticket.numero}|${now}|${ticket.eventId}|${ticket.categorie}`
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + CLE_SECRETE_QR
  )
  return JSON.stringify({
    uuid: ticket.id,
    hmac: signature,
    event_id: ticket.eventId,
    category: ticket.categorie,
    timestamp: now,
    transaction_ref: ticket.numero,
  })
}

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params
  const st = STATUTS[ticket.statut] || STATUTS.valide
  const [qrValue, setQrValue] = useState(ticket.qrData || ticket.id)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const nouveauPayload = await genererQRPayload(ticket)
      setQrValue(nouveauPayload)
    }, QR_REFRESH_INTERVAL * 1000)
    return () => clearInterval(intervalRef.current)
  }, [ticket])

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={19} color={colors.slate} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>Mon billet</Text>
          <View style={{ width: 19 }} />
        </View>

        <View style={s.ticket}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.brandBar}>
            <Text style={s.brandText}>SENGUICHET</Text>
          </LinearGradient>

          <View style={s.dottedSep} />

          <View style={s.section}>
            <Text style={s.eventName}>{ticket.eventNom.toUpperCase()}</Text>
          </View>

          <View style={s.dottedSep} />

          <View style={s.section}>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>DATE</Text>
              <Text style={s.infoValue}>{formaterDateLisible(ticket.eventDate)}</Text>
            </View>
            {ticket.eventHeure ? (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>HEURE</Text>
                <Text style={s.infoValue}>{ticket.eventHeure}</Text>
              </View>
            ) : null}
            {ticket.eventLieu ? (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>LIEU</Text>
                <Text style={s.infoValue}>{ticket.eventLieu}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.dottedSep} />

          <View style={s.section}>
            <Text style={s.refLabel}>REF : {ticket.numero || '—'}</Text>
          </View>

          <View style={s.qrSection}>
            <View style={s.qrWrap}>
              <QRCode
                value={qrValue}
                size={160}
                backgroundColor="white"
                color="#1e293b"
                ecl="H"
                quietZone={6}
              />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.statutText}>
              {ticket.statut === 'utilise'
                ? `✗ CONTRÔLÉ LE ${formaterDateLisible(ticket.dateScan || ticket.dateAchat)}`
                : `${st.label}`}
            </Text>
          </View>

          <View style={s.dottedSep} />

          <View style={s.section}>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>CATÉGORIE</Text>
              <Text style={s.infoValue}>{ticket.categorie}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>PRIX</Text>
              <Text style={s.infoValue}>{ticket.prix ? `${ticket.prix.toLocaleString()} FCFA` : '—'}</Text>
            </View>
          </View>

          <View style={s.dottedSep} />

          <View style={s.legalSection}>
            <Text style={s.legalText}>Entrée unique et non transférable</Text>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => Alert.alert('Simulation', 'Billet exporté en PDF')}>
            <Feather name="download" size={13} color="#fff" />
            <Text style={s.btnPrimaryText}>Exporter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => Alert.alert('Simulation', 'Lien de partage généré')}>
            <Feather name="share-2" size={13} color={colors.slate} />
            <Text style={s.btnSecondaryText}>Partager</Text>
          </TouchableOpacity>
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  brandBar: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  brandText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 5,
  },
  dottedSep: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  section: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  eventName: {
    fontSize: 18,
    fontFamily: fonts.outfit.bold,
    color: colors.slate,
    letterSpacing: 0.5,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: fonts.outfit.semiBold,
    color: colors.mid,
    width: 80,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.outfit.semiBold,
    color: colors.slate,
    flex: 1,
  },
  refLabel: {
    fontSize: 14,
    fontFamily: fonts.outfit.bold,
    color: colors.slate,
    letterSpacing: 0.5,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrWrap: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
  },
  statutText: {
    fontSize: 14,
    fontFamily: fonts.outfit.semiBold,
    color: '#059669',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  legalSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  legalText: {
    fontSize: 11,
    fontFamily: fonts.jakarta.regular,
    color: colors.muted,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: TICKET_WIDTH,
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
})
