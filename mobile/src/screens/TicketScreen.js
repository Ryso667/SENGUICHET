// Écran ticket — affichage mobile + export PDF imprimable
// Layout ticket classique : en-tête organisateur, QR, infos, prix
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { colors, shadows, spacing, borderRadius, fonts } from '../constants/theme'
import { genererTicketPDF } from '../services/ticketPdfService'
import BuyerLayout from '../components/BuyerLayout'

const { width } = Dimensions.get('window')
const TICKET_WIDTH = width - spacing.xl * 2
const QR_REFRESH_INTERVAL = 30
const CLE_SECRETE_QR = 'senguichet-cle-secrete-hmac'

const DASHES = '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'

function formatDateTicket(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    return `${j.padStart(2, '0')}-${m.padStart(2, '0')}-${a}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    }
  }
  return dateStr
}

function formatDatetimeLong(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('T')) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const jj = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const sec = String(d.getSeconds()).padStart(2, '0')
      return `${jj}-${mm}-${d.getFullYear()} ${hh}:${min}:${sec}`
    }
  }
  return dateStr
}

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
  const [qrValue, setQrValue] = useState(ticket.qrData || null)
  const [exporting, setExporting] = useState(false)
  const intervalRef = useRef(null)
  const qrRef = useRef(null)

  useEffect(() => {
    genererQRPayload(ticket).then(setQrValue)
    intervalRef.current = setInterval(async () => {
      const nouveauPayload = await genererQRPayload(ticket)
      setQrValue(nouveauPayload)
    }, QR_REFRESH_INTERVAL * 1000)
    return () => clearInterval(intervalRef.current)
  }, [ticket])

  async function getQRDataURL() {
    return new Promise((resolve) => {
      if (qrRef.current?.toDataURL) {
        qrRef.current.toDataURL((b64) => resolve(`data:image/png;base64,${b64}`))
      } else {
        resolve(null)
      }
    })
  }

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const qrDataUrl = await getQRDataURL()
      await genererTicketPDF(ticket, qrDataUrl)
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer le PDF. Réessayez.')
      console.error('Export PDF failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const isScanned = ticket.statut === 'utilise'
  const organisateurNom = 'SENGUICHET'
  const dateStr = formatDateTicket(ticket.eventDate)
  const scannedStr = ticket.dateScan ? formatDatetimeLong(ticket.dateScan) : null

  return (
    <BuyerLayout>
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
            {/* 1. En-tête organisateur centré */}
            <View style={s.headerCentered}>
              <View style={s.logoCircle}>
                <Text style={s.logoEmoji}>🎫</Text>
              </View>
              <Text style={s.organisateurText}>{organisateurNom.toUpperCase()}</Text>
            </View>
            <Text style={s.dash}>{DASHES}</Text>

            {/* 2. Nom de l'événement */}
            <Text style={s.eventName}>{ticket.eventNom?.toUpperCase() || 'ÉVÉNEMENT'}</Text>
            <Text style={s.dash}>{DASHES}</Text>

            {/* 3. Date, heure et lieu */}
            <Text style={s.infoText}>
              {dateStr}{ticket.eventHeure ? ` à ${ticket.eventHeure}` : ''}
            </Text>
            <Text style={s.venueText}>{ticket.eventLieu?.toUpperCase() || ''}</Text>
            <Text style={s.dash}>{DASHES}</Text>

            {/* 4. Référence */}
            <Text style={s.refText}>REF : {ticket.numero || '—'}</Text>

            {/* 5. QR Code avec overlay si scanné */}
            <View style={s.qrSection}>
              <View style={s.qrWrapper}>
                <QRCode
                  value={qrValue}
                  size={200}
                  backgroundColor="white"
                  color="#0f172a"
                  ecl="H"
                  quietZone={8}
                  getRef={(c) => { qrRef.current = c }}
                />
                {isScanned && (
                  <View style={s.scannedOverlay}>
                    <View style={s.redCircle}>
                      <Text style={s.redX}>✕</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
            {isScanned && (
              <Text style={s.scannedText}>
                Contrôlé le{scannedStr ? ` ${scannedStr}` : ''}
              </Text>
            )}

            {/* 6. Catégorie et prix */}
            <Text style={s.dash}>{DASHES}</Text>
            <Text style={s.categorieText}>{ticket.categorie?.toUpperCase() || 'STANDARD'}</Text>
            <Text style={s.prixText}>
              PRIX: {ticket.prix ? `${ticket.prix.toLocaleString()} FCFA` : '—'}
            </Text>
            <Text style={s.dash}>{DASHES}</Text>

            {/* 7. Footer */}
            <Text style={s.footerText}>Entrée unique et non transférable</Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btnPrimary, exporting && s.btnDisabled]}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="download" size={13} color="#fff" />
              )}
              <Text style={s.btnPrimaryText}>{exporting ? 'Génération...' : 'Exporter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSecondary, exporting && s.btnDisabled]}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.slate} />
              ) : (
                <Feather name="share-2" size={13} color={colors.slate} />
              )}
              <Text style={s.btnSecondaryText}>{exporting ? 'Génération...' : 'Partager'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BuyerLayout>
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
    paddingVertical: spacing.lg,
    ...shadows.lg,
  },
  /* En-tête centré */
  headerCentered: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 15 },
  organisateurText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 11,
    color: colors.mid,
    letterSpacing: 2,
  },
  /* Ligne de tirets */
  dash: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 7,
    color: colors.border,
    letterSpacing: 0,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  /* Nom événement */
  eventName: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: colors.slate,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  /* Infos */
  infoText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
  },
  venueText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
  },
  /* Référence */
  refText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: colors.mid,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  /* QR */
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrWrapper: {
    position: 'relative',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redX: {
    fontSize: 36,
    color: '#ffffff',
    fontFamily: fonts.outfit.bold,
    lineHeight: 40,
  },
  scannedText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  /* Catégorie et prix */
  categorieText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: colors.slate,
    textAlign: 'center',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
  },
  prixText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: colors.slate,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  /* Footer */
  footerText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    lineHeight: 14,
  },
  /* Boutons */
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
  btnDisabled: { opacity: 0.6 },
})
