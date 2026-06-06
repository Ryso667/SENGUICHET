// Écran ticket — format physique vertical type billet de concert
// Dimensions fixes (340×640), 3 zones, encoches + perforation
// QR rafraîchi toutes les 30s (sécurité anti-rejeu HMAC)
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../constants/theme'
import GlassChip from '../components/GlassChip'
import { formaterDateLisible } from '../utils/dateUtils'
import { genererTicketPDF } from '../services/ticketPdfService'
import { HMAC_SECRET } from '../config'

const QR_REFRESH_INTERVAL = 30
const TICKET_W = 340
const ZONE1_H = 260
const ZONE2_H = 280
const ZONE3_H = 100

async function genererQRPayload(ticket) {
  const now = new Date().toISOString()
  const payload = `${ticket.id}|${ticket.numero}|${now}|${ticket.eventId}|${ticket.categorie}`
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + HMAC_SECRET
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
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const [qrValue, setQrValue] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const qrRef = useRef(null)

  useEffect(() => {
    genererQRPayload(ticket).then((v) => { setQrValue(v); setQrReady(true) })
    const interval = setInterval(async () => {
      const nouveau = await genererQRPayload(ticket)
      setQrValue(nouveau)
    }, QR_REFRESH_INTERVAL * 1000)
    return () => clearInterval(interval)
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

  const refStr = ticket?.numero || '—'
  const eventNom = (ticket?.eventNom || ticket?.evenement || 'ÉVÉNEMENT').toUpperCase()
  const dateStr = ticket?.eventDate ? formaterDateLisible(ticket.eventDate) : ''
  const heureStr = ticket?.eventHeure || ''
  const lieuStr = (ticket?.eventLieu || '').toUpperCase()
  const prixStr = ticket?.prix ? `${ticket.prix.toLocaleString()} FCFA` : ''
  const dateAchatStr = ticket?.dateAchat ? formaterDateLisible(ticket.dateAchat) : ''

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
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Mon billet</Text>

        <View style={styles.ticketCard}>
          {/* ZONE 1 : QR Code + ID (260px) */}
          <View style={styles.zone1}>
            <View style={styles.qrWrap}>
              {qrReady ? (
                <QRCode
                  value={qrValue}
                  size={180}
                  backgroundColor="#fff"
                  color="#000"
                  ecl="H"
                  quietZone={4}
                  getRef={(c) => { qrRef.current = c }}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="small" color="#999" />
                </View>
              )}
            </View>
            <Text style={styles.refText}>#{refStr}</Text>

            {/* Encoches de découpe à cheval sur la perforation */}
            <View style={styles.cutoutLeft} />
            <View style={styles.cutoutRight} />
          </View>

          {/* ZONE 2 : Infos événement + Prix (280px) */}
          <View style={styles.zone2}>
            {/* Filigrane subtil 'S' */}
            <Text style={styles.watermark}>S</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Text style={styles.eventTitle}>{eventNom}</Text>
                <Text style={styles.eventDate}>
                  {dateStr}{heureStr ? ` à ${heureStr}` : ''}
                </Text>
                <Text style={styles.eventLieu}>{lieuStr}</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Prix</Text>
                <Text style={styles.priceValue}>{prixStr}</Text>
              </View>
            </View>
          </View>

          {/* ZONE 3 : Mentions légales (100px) */}
          <View style={styles.zone3}>
            <Text style={styles.brandText}>SENGUICHET</Text>
            <Text style={styles.legalText}>
              Billetterie événementielle • Entrée unique et non transférable
            </Text>
            {dateAchatStr ? (
              <Text style={styles.legalDate}>Acheté le {dateAchatStr}</Text>
            ) : null}
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
  container: {
    flex: 1,
    backgroundColor: '#0f0f2a',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
  },
  pageTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 20,
  },

  // Ticket — dimensions fixes (340×640)
  ticketCard: {
    width: TICKET_W,
    height: ZONE1_H + ZONE2_H + ZONE3_H,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // ── ZONE 1 : QR (260px) ──────────────────────
  zone1: {
    height: ZONE1_H,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderBottomColor: '#D1D5DB',
    position: 'relative',
  },
  qrWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  refText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 1.5,
    marginTop: 8,
  },

  // Encoches demi-cercles
  cutoutLeft: {
    position: 'absolute',
    bottom: -12,
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f0f2a',
  },
  cutoutRight: {
    position: 'absolute',
    bottom: -12,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f0f2a',
  },

  // ── ZONE 2 : Infos (280px) ───────────────────
  zone2: {
    height: ZONE2_H,
    paddingHorizontal: 24,
    paddingVertical: 24,
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    right: 5,
    top: 30,
    fontFamily: fonts.outfit.black,
    fontSize: 140,
    color: 'rgba(0,0,0,0.02)',
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
    gap: 12,
    paddingRight: 16,
    maxWidth: '70%',
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#030712',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  eventDate: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  eventLieu: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  verticalDivider: {
    width: 1,
    height: 120,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  priceCol: {
    width: 80,
    paddingLeft: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 120,
    alignSelf: 'center',
  },
  priceLabel: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#111827',
  },

  // ── ZONE 3 : Mentions (100px) ───────────────
  zone3: {
    height: ZONE3_H,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  brandText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  legalText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 12,
  },
  legalDate: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 8,
    color: '#B0B7C3',
  },

  // ── Actions ──────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
    justifyContent: 'center',
  },
})
