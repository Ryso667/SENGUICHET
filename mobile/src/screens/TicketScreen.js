// Écran ticket — style billet physique imprimable (référence pour PDF + navigateur)
// Fond page sombre, ticket blanc, header abstrait, QR noir/blanc, souche détachable
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import { formaterDateLisible } from '../utils/dateUtils'
import { genererTicketPDF } from '../services/ticketPdfService'
import { HMAC_SECRET } from '../config'

const QR_REFRESH_INTERVAL = 30

async function genererQRPayload(ticket) {
  const now = new Date().toISOString()
  const payload = `${ticket.uuid}|${ticket.numero}|${now}|${ticket.eventId}|${ticket.categorie}`
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + HMAC_SECRET
  )
  return JSON.stringify({
    uuid: ticket.uuid,
    hmac: signature,
    event_id: ticket.eventId,
    category: ticket.categorie,
    timestamp: now,
    transaction_ref: ticket.numero,
  })
}

function AbstractHeader() {
  return (
    <View style={styles.headerAbstract}>
      <View style={[styles.headerShape, { top: -20, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: '#00C8FF', opacity: 0.15 }]} />
      <View style={[styles.headerShape, { top: 10, right: 20, width: 100, height: 100, borderRadius: 50, backgroundColor: '#0077FF', opacity: 0.2 }]} />
      <View style={[styles.headerShape, { top: 40, right: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: '#00E5A0', opacity: 0.15 }]} />
      <View style={[styles.headerShape, { top: -10, right: 60, width: 50, height: 50, borderRadius: 25, backgroundColor: '#0077FF', opacity: 0.1 }]} />
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
  const prixStr = ticket?.prix ? `${Number(ticket.prix).toLocaleString('fr-FR')} FCFA` : '—'

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
      <View style={styles.bgFill} />
      <BlurBackground category={ticket?.categorie} showImage={false} gradientOverride={['rgba(0,229,160,0.5)', 'rgba(0,200,255,0.15)']} />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mon billet</Text>

        <View style={styles.ticketCard}>
          {/* HEADER — illustration abstraite + logo */}
          <View style={styles.header}>
            <AbstractHeader />
            <View style={styles.headerContent}>
              <Image
                source={require('../../assets/logo_mobile.jpeg')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>{organisateurNom}</Text>
            </View>
          </View>

          {/* REF VERTICALE — bande gauche */}
          <View style={styles.refVertical}>
            <Text style={styles.refVerticalText}>REF | {refStr}</Text>
          </View>

          {/* CORPS */}
          <View style={styles.body}>
            <View style={styles.bodySeparator} />

            <Text style={styles.eventName}>{eventNom.toUpperCase()}</Text>

            {dateStr ? (
              <Text style={styles.eventDate}>
                {dateStr}{heureStr ? ` à ${heureStr}` : ''}
              </Text>
            ) : null}

            {lieuStr ? (
              <Text style={styles.eventLieu}>{lieuStr.toUpperCase()}</Text>
            ) : null}

            <View style={styles.bodySpacer} />

            {/* ZONE QR */}
            <View style={styles.qrZone}>
              <View style={styles.qrWrapper}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={180}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                    ecl="H"
                    quietZone={12}
                    getRef={(c) => { qrRef.current = c }}
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <ActivityIndicator size="small" color="#00C8FF" />
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
            </View>

            {isScanned && (
              <Text style={styles.scannedText}>Contrôlé le {ticket?.dateScan || ''}</Text>
            )}
          </View>

          {/* SÉPARATEUR PERFORÉ */}
          <View style={styles.perforationContainer}>
            <View style={[styles.perforationCircle, { backgroundColor: '#0D1B2A' }]} />
            <View style={styles.perforationLine} />
            <View style={[styles.perforationCircle, { left: undefined, right: -10, backgroundColor: '#0D1B2A' }]} />
          </View>

          {/* SOUCHE / FOOTER */}
          <View style={styles.footer}>
            <View style={styles.categoriePill}>
              <Text style={styles.categorieText}>{catStr.toUpperCase()}</Text>
            </View>

            <Text style={styles.prixText}>{prixStr}</Text>
            <Text style={styles.nonTransf}>Entree unique et non transferable</Text>

            <Text style={styles.footerWatermark}>SENGUICHET</Text>
          </View>
        </View>

        {/* BOUTON EXPORT */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={exporting}
        >
          <Text style={styles.exportText}>
            {exporting ? 'GÉNÉRATION...' : 'EXPORTER EN PDF'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#9AD8D8' },
  bgFill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#9AD8D8' },
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
  },

  // TICKET CARD
  ticketCard: {
    width: '100%',
    backgroundColor: '#E8F5F0',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  // HEADER
  header: {
    height: 140,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  headerAbstract: { ...StyleSheet.absoluteFillObject },
  headerShape: { position: 'absolute' },
  headerContent: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    alignItems: 'flex-start',
  },
  headerLogo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    color: '#0D1B2A',
    letterSpacing: 3,
    marginTop: 4,
  },

  // RÉFÉRENCE VERTICALE — bande gauche
  refVertical: {
    position: 'absolute',
    left: 0,
    top: 140,
    bottom: 0,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  refVerticalText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: '#5A7090',
    letterSpacing: 1,
    transform: [{ rotate: '-90deg' }],
    width: 200,
    textAlign: 'center',
  },

  // BODY
  body: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: 'center',
  },
  bodySeparator: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  eventName: {
    fontFamily: fonts.outfit.black,
    fontSize: 22,
    color: '#0D1B2A',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 28,
    marginBottom: 8,
  },
  eventDate: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: '#5A7090',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventLieu: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: '#00C8FF',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bodySpacer: { height: 8 },

  // QR ZONE
  qrZone: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  qrWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrPlaceholder: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  redCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FF4D6D',
    alignItems: 'center', justifyContent: 'center',
  },
  redX: {
    fontSize: 36, color: '#FFFFFF',
    fontFamily: fonts.outfit.bold, lineHeight: 40,
  },
  scannedText: {
    fontFamily: fonts.outfit.bold, fontSize: 13,
    color: '#FF4D6D', textAlign: 'center', marginTop: 12,
  },

  // PERFORATION
  perforationContainer: {
    height: 20, flexDirection: 'row', alignItems: 'center', position: 'relative',
  },
  perforationCircle: {
    position: 'absolute', left: -10,
    width: 20, height: 20, borderRadius: 10, zIndex: 2,
  },
  perforationLine: {
    flex: 1, marginHorizontal: 20,
    borderBottomWidth: 1.5, borderColor: '#CCCCCC', borderStyle: 'dashed',
  },

  // FOOTER / SOUCHE
  footer: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 28,
    backgroundColor: '#F7F8FA', position: 'relative', gap: 6,
  },
  categoriePill: {
    backgroundColor: '#0D1B2A', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 9999,
  },
  categorieText: {
    fontFamily: fonts.outfit.bold, fontSize: 10,
    color: '#FFFFFF', letterSpacing: 2, textTransform: 'uppercase',
  },
  prixText: {
    fontFamily: fonts.outfit.black, fontSize: 26, color: '#0D1B2A', textAlign: 'center',
  },
  nonTransf: {
    fontFamily: fonts.jakarta.regular, fontSize: 10,
    color: '#A0B4C8', textAlign: 'center', fontStyle: 'italic',
  },
  footerWatermark: {
    position: 'absolute', bottom: 8, right: 16,
    fontFamily: fonts.outfit.bold, fontSize: 8, color: '#CCCCCC', letterSpacing: 1,
  },

  // BOUTON EXPORT
  exportBtn: {
    backgroundColor: '#00C8FF', borderRadius: 9999,
    paddingVertical: 14, paddingHorizontal: 32,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg, width: '100%',
  },
  exportText: {
    fontFamily: fonts.outfit.bold, fontSize: 14,
    color: '#0D1B2A', letterSpacing: 1, textTransform: 'uppercase',
  },
})
