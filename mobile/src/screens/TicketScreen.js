// Écran ticket — format vertical type billet physique
// Fond blanc, encoches latérales, QR + infos + prix détaché
// QR rafraîchi toutes les 30s avec nouveau HMAC (sécurité anti-rejeu)
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import GlassChip from '../components/GlassChip'
import { formaterDateLisible } from '../utils/dateUtils'
import { genererTicketPDF } from '../services/ticketPdfService'
import { HMAC_SECRET } from '../config'

const QR_REFRESH_INTERVAL = 30

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

  const isScanned = ticket?.statut === 'utilise'
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

        <View style={styles.ticketOuter}>
          <View style={styles.ticketCard}>
            {/* ZONE HAUTE : QR Code */}
            <View style={styles.qrSection}>
              <View style={styles.qrWrap}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={110}
                    backgroundColor="#fff"
                    color="#000"
                    ecl="H"
                    quietZone={6}
                    getRef={(c) => { qrRef.current = c }}
                  />
                ) : (
                  <ActivityIndicator size="small" color="#000" />
                )}
              </View>
              <Text style={styles.refText}>#{refStr}</Text>
              {isScanned && (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>UTILISÉ</Text>
                </View>
              )}
              <Text style={styles.serialText}>{refStr}</Text>
            </View>

            <View style={styles.divider} />

            {/* ZONE INFOS : Événement + Prix */}
            <View style={styles.infoSection}>
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
                  <Text style={styles.priceValue}>{prixStr}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ZONE BASSE : Mentions légales */}
            <View style={styles.legalSection}>
              <Text style={styles.legalText}>
                SENGUICHET - Billetterie événementielle. Entrée unique et non transférable.
              </Text>
              {dateAchatStr ? (
                <Text style={styles.legalDate}>Acheté le {dateAchatStr}</Text>
              ) : null}
            </View>
          </View>

          {/* Encoches latérales */}
          <View style={styles.cutoutLeft} />
          <View style={styles.cutoutRight} />
        </View>

        <View style={styles.actions}>
          <GlassChip label={exporting ? 'Génération...' : 'Exporter PDF'} icon="file-text" onPress={handleExport} />
        </View>
      </ScrollView>
    </View>
  )
}

const CARD_WIDTH_PCT = '82%'

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
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },

  // Conteneur ticket + encoches
  ticketOuter: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  ticketCard: {
    width: CARD_WIDTH_PCT,
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  // Encoches demi-cercles
  cutoutLeft: {
    position: 'absolute',
    left: '9%',
    top: 135,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0f0f2a',
    marginLeft: -9,
  },
  cutoutRight: {
    position: 'absolute',
    right: '9%',
    top: 135,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0f0f2a',
    marginRight: -9,
  },

  // ZONE QR
  qrSection: {
    alignItems: 'center',
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  qrWrap: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#666',
    letterSpacing: 1.5,
    marginTop: spacing.md,
  },
  serialText: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl + 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 8,
    color: '#bbb',
    letterSpacing: 0.5,
  },
  usedBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: '#f0f0f0',
  },
  usedBadgeText: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 9,
    color: '#999',
    letterSpacing: 1.5,
  },

  // Séparateur horizontal fin
  divider: {
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    marginHorizontal: spacing.lg,
  },

  // ZONE INFOS
  infoSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -5,
    top: -5,
    fontFamily: fonts.outfit.black,
    fontSize: 120,
    color: 'rgba(0,0,0,0.03)',
    letterSpacing: 0,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 120,
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    paddingRight: spacing.md,
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: '#1a1a1a',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  eventDate: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: '#555',
  },
  eventLieu: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },

  // Séparateur vertical + prix
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  priceCol: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  priceValue: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // ZONE MENTIONS
  legalSection: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  legalText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 13,
  },
  legalDate: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: '#bbb',
    textAlign: 'center',
  },

  // Boutons actions
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
})
