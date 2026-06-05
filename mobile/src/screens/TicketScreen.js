// Écran ticket — design vertical thermique avec 4 sections, texte rotatif, double QR
// Fond sombre, carte ticket blanche type thermique avec souches détachables
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing, borderRadius, glass, textShadow } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import { formaterDateLisible } from '../utils/dateUtils'
import { genererTicketPDF } from '../services/ticketPdfService'
import { getHMACSecret } from '../services/hmacService'

const QR_REFRESH_INTERVAL = 30
const QR_SIZE_SMALL = 70
const QR_SIZE_LARGE = 110
const FONT_MONO = 'Courier New'

// Génère le payload JSON du QR avec HMAC-SHA256 (uuid, ref, timestamp, event_id, category)
async function genererQRPayload(ticket) {
  const secret = await getHMACSecret()
  const now = new Date().toISOString()
  const payload = `${ticket.id}|${ticket.numero}|${now}|${ticket.eventId}|${ticket.categorie}`
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + secret
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

// Ligne de perforation décorative (tirets + points)
function Perforation() {
  return (
    <View style={perfStyles.container}>
      <View style={perfStyles.line} />
      <Text style={perfStyles.dots}>{'∘ '.repeat(28)}</Text>
    </View>
  )
}

const perfStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    position: 'absolute',
    top: 6,
  },
  dots: {
    fontSize: 5,
    color: '#94a3b8',
    letterSpacing: 3,
    textAlign: 'center',
    position: 'absolute',
    top: -1,
  },
})

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const [qrValue, setQrValue] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const qrRef = useRef(null)

  // Génère le QR payload à l'ouverture et le rafraîchit toutes les 30s
  useEffect(() => {
    const init = async () => {
      const v = await genererQRPayload(ticket)
      setQrValue(v)
      setQrReady(true)
    }
    init()
    if (ticket?.statut !== 'utilise') {
      const interval = setInterval(async () => {
        const nouveau = await genererQRPayload(ticket)
        setQrValue(nouveau)
      }, QR_REFRESH_INTERVAL * 1000)
      return () => clearInterval(interval)
    }
  }, [ticket])

  // Capture le QR en base64 pour l'inclure dans le PDF
  async function getQRDataURL() {
    return new Promise((resolve) => {
      if (qrRef.current?.toDataURL) {
        qrRef.current.toDataURL((b64) => resolve(`data:image/png;base64,${b64}`))
      } else {
        resolve(null)
      }
    })
  }

  const isScanned = ticket?.statut === 'utilise'
  const numero = ticket?.numero || '—'
  const prix = ticket?.prix ? `${ticket.prix.toLocaleString()} FCFA` : '—'
  const codeBarres = (numero || '').padStart(16, '0').replace(/(.{4})/g, '$1-').slice(0, 19)
  const evenement = ticket?.eventNom || ticket?.evenement || 'ÉVÉNEMENT'
  const categorie = ticket?.categorie || 'STANDARD'
  const lieu = ticket?.eventLieu || ''
  const dateStr = ticket?.eventDate ? formaterDateLisible(ticket.eventDate) : ''
  const heureStr = ticket?.eventHeure || ''

  const statusColor = isScanned ? '#991b1b' : '#166534'
  const statusBg = isScanned ? '#fee2e2' : '#dcfce7'
  const statusLabel = isScanned ? '✕ UTILISÉ' : '✓ VALIDE'

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const qrDataUrl = await getQRDataURL()
      await genererTicketPDF(ticket, qrDataUrl)
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer le PDF. Réessayez.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={ticket?.categorie} />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mon billet</Text>

        {/* Carte ticket blanc — style thermique */}
        <View style={styles.ticketCard}>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {/* Section A — Souche supérieure (rotated 90°) */}
          <View style={styles.sectionA}>
            <Text style={styles.numText}>{`#${numero}`}</Text>
            <View style={styles.qrSmallWrap}>
              {qrReady ? (
                <QRCode
                  value={qrValue}
                  size={QR_SIZE_SMALL}
                  backgroundColor="transparent"
                  color="#0f172a"
                  ecl="H"
                  quietZone={4}
                  getRef={(c) => { qrRef.current = c }}
                />
              ) : (
                <View style={styles.qrPlaceholderSmall}>
                  <ActivityIndicator size="small" color="#94a3b8" />
                </View>
              )}
            </View>
            <Text style={styles.barcodeText}>{codeBarres}</Text>
          </View>

          <Perforation />

          {/* Section B — Souche intermédiaire (rotated 270°) */}
          <View style={styles.sectionB}>
            <Text style={styles.numText}>{`#${numero}`}</Text>
            <Text style={styles.priceText}>{prix}</Text>
            <Text style={styles.barcodeText}>{codeBarres}</Text>
          </View>

          <Perforation />

          {/* Section C — Corps principal */}
          <View style={styles.sectionC}>
            <Text style={styles.watermark}>{'SENGUICHET '.repeat(4)}</Text>
            <View style={styles.qrLargeWrap}>
              {qrReady ? (
                <QRCode
                  value={qrValue}
                  size={QR_SIZE_LARGE}
                  backgroundColor="transparent"
                  color="#0f172a"
                  ecl="H"
                  quietZone={6}
                  getRef={(c) => { qrRef.current = c }}
                />
              ) : (
                <View style={styles.qrPlaceholderLarge}>
                  <ActivityIndicator size="small" color="#94a3b8" />
                </View>
              )}
            </View>
            <Text style={styles.priceSide}>{prix}</Text>
          </View>

          <Perforation />

          {/* Section D — Talon inférieur bleu */}
          <View style={styles.sectionD}>
            <Text style={styles.platformText}>S E N G U I C H E T</Text>
            <Text style={styles.eventTitle}>{(categorie ? `${evenement.toUpperCase()} — ${categorie.toUpperCase()}` : evenement.toUpperCase())}</Text>
            {lieu ? <Text style={styles.venueText}>{lieu.toUpperCase()}</Text> : null}
            <Text style={styles.datetimeText}>{(heureStr ? `${dateStr} À ${heureStr}` : dateStr).toUpperCase()}</Text>
            <Text style={styles.legalText}>Entrée unique et non transférable</Text>
          </View>

        </View>

        <View style={styles.actions}>
          <GlassChip label={exporting ? 'Génération...' : 'Exporter PDF'} icon="file-text" onPress={handleExport} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f2a' },
  backBtn: {
    position: 'absolute', left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
    ...textShadow,
  },

  // Carte ticket blanc
  ticketCard: {
    width: 220,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 5,
  },
  statusText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // Section A — rotated 90°
  sectionA: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
    marginVertical: 32,
    width: 180,
  },
  numText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: '#0f172a',
    letterSpacing: 1,
    marginHorizontal: 8,
  },
  qrSmallWrap: {
    width: QR_SIZE_SMALL,
    height: QR_SIZE_SMALL,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  qrPlaceholderSmall: {
    width: QR_SIZE_SMALL,
    height: QR_SIZE_SMALL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeText: {
    fontFamily: FONT_MONO,
    fontSize: 8,
    color: '#64748b',
    letterSpacing: 2,
    marginHorizontal: 8,
  },

  // Section B — rotated 270°
  sectionB: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '270deg' }],
    marginVertical: 32,
    width: 180,
  },
  priceText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#0f172a',
    marginHorizontal: 8,
  },

  // Section C — Main body
  sectionC: {
    width: '100%',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: spacing.md,
  },
  watermark: {
    position: 'absolute',
    fontSize: 12,
    color: 'rgba(99, 102, 241, 0.06)',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 20,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlignVertical: 'center',
    width: '100%',
  },
  qrLargeWrap: {
    width: QR_SIZE_LARGE,
    height: QR_SIZE_LARGE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    zIndex: 1,
  },
  qrPlaceholderLarge: {
    width: QR_SIZE_LARGE,
    height: QR_SIZE_LARGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSide: {
    position: 'absolute',
    right: 8,
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: '#0f172a',
    letterSpacing: 1,
    writingDirection: 'rtl',
    borderLeftWidth: 1,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 6,
  },

  // Section D — Blue footer
  sectionD: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  platformText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
    marginBottom: 6,
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  venueText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 14,
  },
  datetimeText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 6,
  },
  legalText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 7,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
})
