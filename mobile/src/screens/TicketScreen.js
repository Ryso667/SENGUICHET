// Écran ticket — design 4 sections (A-souche dégradé, B-infos, C-QR+filigrane, D-talon)
// QR rafraîchi toutes les 30s avec nouveau HMAC (sécurité anti-rejeu)
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing, borderRadius, glass, textShadow } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
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

function PerfRow() {
  return (
    <View style={styles.perfRow}>
      <View style={styles.perfDot} />
      <View style={styles.perfLine} />
      <View style={styles.perfDot} />
      <View style={styles.perfLine} />
      <View style={styles.perfDot} />
      <View style={styles.perfLine} />
      <View style={styles.perfDot} />
    </View>
  )
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
  const organisateurNom = 'SENGUICHET'
  const eventNom = ticket?.eventNom || ticket?.evenement || 'ÉVÉNEMENT'
  const dateStr = ticket?.eventDate ? formaterDateLisible(ticket.eventDate) : ''
  const heureStr = ticket?.eventHeure || ''
  const lieuStr = ticket?.eventLieu || ''
  const refStr = ticket?.numero || '—'
  const catStr = ticket?.categorie || 'STANDARD'
  const prixStr = ticket?.prix ? `${ticket.prix.toLocaleString()} FCFA` : '—'
  const catColor = ticket?.couleurHex || '#6366F1'

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

        <GlassContainer style={styles.ticketCard} blurType="light" intensity={60}>

          {/* SECTION A : Souche dégradé */}
          <LinearGradient
            colors={['#6366F1', catColor, '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionA}
          >
            <View style={styles.sectionALeft}>
              <View style={styles.qrStub}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={62}
                    backgroundColor="#fff"
                    color="#0f172a"
                    ecl="H"
                    quietZone={4}
                  />
                ) : (
                  <ActivityIndicator size="small" color="#6366F1" />
                )}
              </View>
              <Text style={styles.refStub}>#{refStr}</Text>
            </View>
            <View style={styles.sectionARight}>
              <Text style={styles.verticalText}>SENGUICHET</Text>
            </View>
          </LinearGradient>

          <PerfRow />

          {/* SECTION B : Infos événement */}
          <View style={styles.sectionB}>
            <Text style={styles.eventTitle}>{eventNom.toUpperCase()}</Text>
            <Text style={styles.eventDate}>{dateStr}{heureStr ? ` à ${heureStr}` : ''}</Text>
            {lieuStr ? <Text style={styles.eventLieu}>{lieuStr.toUpperCase()}</Text> : null}
            <View style={styles.eventMeta}>
              <Text style={styles.metaChip}>{catStr.toUpperCase()}</Text>
              <Text style={styles.metaChip}>{prixStr}</Text>
            </View>
          </View>

          <PerfRow />

          {/* SECTION C : Corps QR + filigrane */}
          <View style={styles.sectionC}>
            <Text style={styles.watermarkText}>SENGUICHET</Text>
            <View style={styles.qrMainWrap}>
              {qrReady ? (
                <QRCode
                  value={qrValue}
                  size={130}
                  backgroundColor="rgba(255,255,255,0.95)"
                  color="#0f172a"
                  ecl="H"
                  quietZone={6}
                  getRef={(c) => { qrRef.current = c }}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="small" color="#6366F1" />
                </View>
              )}
              {isScanned && (
                <View style={styles.scannedOverlay}>
                  <View style={styles.redCircle}>
                    <Text style={styles.redX}>✕</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={[styles.statutBadge, { backgroundColor: isScanned ? '#94A3B8' : '#00E5A0' }]}>
              <Text style={styles.statutText}>{isScanned ? 'Utilisé' : 'Valide'}</Text>
            </View>
          </View>

          <PerfRow />

          {/* SECTION D : Talon gris */}
          <View style={styles.sectionD}>
            <Text style={styles.dLogo}>SENGUICHET</Text>
            <Text style={styles.dLine}>Billeterie événementielle</Text>
            <Text style={styles.dLine}>Entrée unique et non transférable</Text>
            <View style={styles.dBarcode} />
          </View>

        </GlassContainer>

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
  ticketCard: {
    width: '100%',
    padding: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },

  // SECTION A
  sectionA: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionALeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrStub: {
    width: 70, height: 70,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refStub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.outfit.bold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  sectionARight: {
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalText: {
    fontFamily: fonts.outfit.black,
    fontSize: 18,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 6,
    transform: [{ rotate: '90deg' }],
  },

  // Perforation
  perfRow: {
    width: '100%',
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  perfDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#0f0f2a',
  },
  perfLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    marginHorizontal: 2,
  },

  // SECTION B
  sectionB: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 20,
    ...textShadow,
  },
  eventDate: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  eventLieu: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metaChip: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    color: '#818CF8',
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  // SECTION C
  sectionC: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  watermarkText: {
    position: 'absolute',
    fontFamily: fonts.outfit.black,
    fontSize: 48,
    color: 'rgba(99,102,241,0.04)',
    letterSpacing: 8,
    transform: [{ rotate: '-20deg' }],
    textAlign: 'center',
  },
  qrMainWrap: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 6,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrPlaceholder: {
    width: 130, height: 130,
    alignItems: 'center', justifyContent: 'center',
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(220,38,38,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  redX: {
    fontSize: 28, color: '#fff',
    fontFamily: fonts.outfit.bold,
    lineHeight: 32,
  },
  statutBadge: {
    zIndex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statutText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 11,
    color: '#fff',
  },

  // SECTION D
  sectionD: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dLogo: {
    fontFamily: fonts.outfit.bold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 3,
  },
  dLine: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 12,
  },
  dBarcode: {
    width: '70%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 4,
    borderRadius: 1,
    overflow: 'hidden',
  },

  scannedText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    ...textShadow,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
})
