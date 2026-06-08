// Ecran ticket - style billet physique vert emeraude (design premium)
// Fond page vert nuit, ticket avec header vert foret, corps creme, souche beige, QR blanc
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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

// Couleurs du design vert emeraude
const C = {
  vertForet: '#1B4332',
  vertMoyen: '#40916C',
  creme: '#F9F6EE',
  beige: '#F0EAD6',
  or: '#D4AF37',
  fondPage: '#0F1A0F',
  blanc: '#FFFFFF',
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
      <BlurBackground category={ticket?.categorie} showImage={false} gradientOverride={['rgba(27,67,50,0.8)', 'rgba(15,26,15,0.95)']} />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mon billet</Text>

        {/* TICKET */}
        <View style={styles.ticketCard}>

          {/* HEADER — vert forêt */}
          <View style={styles.header}>
            <View style={[styles.headerOrbe, { top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(64,145,108,0.35)' }]} />
            <View style={[styles.headerOrbe, { bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,175,55,0.15)' }]} />
            <View style={styles.headerContent}>
              <View style={styles.logoOuter}>
                <Image source={require('../../assets/logo_mobile.jpeg')} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={styles.headerTitle}>SENGUICHET</Text>
            </View>
            <View style={styles.ligneDoree} />
            <Text style={styles.eventName}>{eventNom.toUpperCase()}</Text>
            <Text style={styles.eventCategory}>{catStr.toUpperCase()}</Text>
          </View>

          {/* PERFORATION HAUTE */}
          <LinearGradient colors={[C.vertForet, C.creme]} style={styles.perfContainer}>
            <View style={styles.perfLine} />
            <View style={[styles.perfCircle, { left: -11 }]} />
            <View style={[styles.perfCircle, { right: -11 }]} />
          </LinearGradient>

          {/* CORPS — crème */}
          <View style={styles.body}>
            <View style={styles.bodyRow}>
              <View style={styles.bodyBlock}>
                <Text style={styles.bodyLabel}>DATE</Text>
                <Text style={styles.bodyValue}>{dateStr}</Text>
              </View>
              {heureStr ? (
                <View style={[styles.bodyBlock, { alignItems: 'flex-end' }]}>
                  <Text style={styles.bodyLabel}>HEURE</Text>
                  <Text style={styles.bodyValue}>{heureStr}</Text>
                </View>
              ) : null}
            </View>

            {lieuStr ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.bodyLabel}>LIEU</Text>
                <Text style={styles.bodyLieu}>{lieuStr.toUpperCase()}</Text>
              </View>
            ) : null}

            <View style={styles.bodySeparator} />

            <Text style={styles.bodyRef}>REF · {refStr}</Text>

            {/* ZONE QR */}
            <View style={styles.qrZone}>
              <View style={styles.qrWrapper}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={180}
                    color={C.vertForet}
                    backgroundColor={C.blanc}
                    ecl="H"
                    quietZone={12}
                    getRef={(c) => { qrRef.current = c }}
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <ActivityIndicator size="small" color={C.vertMoyen} />
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

          {/* PERFORATION BASSE */}
          <LinearGradient colors={[C.creme, C.beige]} style={styles.perfContainer}>
            <View style={styles.perfLine} />
            <View style={[styles.perfCircle, { left: -11 }]} />
            <View style={[styles.perfCircle, { right: -11 }]} />
          </LinearGradient>

          {/* SOUCHE — beige */}
          <View style={styles.footer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{catStr.toUpperCase()}</Text>
            </View>
            <Text style={styles.prixText}>{prixStr}</Text>
            <Text style={styles.legalText}>Entree unique et non transferable</Text>
            <Text style={styles.watermark}>SENGUICHET</Text>
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
  container: { flex: 1, backgroundColor: C.fondPage },
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },

  // HEADER
  header: {
    backgroundColor: C.vertForet,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  headerOrbe: { position: 'absolute' },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoOuter: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoImg: {
    width: 28, height: 28, borderRadius: 6,
  },
  headerTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.7)',
  },
  ligneDoree: {
    height: 1,
    backgroundColor: C.or,
    opacity: 0.6,
    marginVertical: 16,
  },
  eventName: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  eventCategory: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 6,
  },

  // PERFORATION
  perfContainer: {
    height: 22,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfLine: {
    position: 'absolute',
    left: 11, right: 11,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(27,67,50,0.2)',
  },
  perfCircle: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.fondPage,
    zIndex: 2,
  },

  // BODY
  body: {
    backgroundColor: C.creme,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyBlock: {},
  bodyLabel: {
    fontFamily: fonts.outfit.bold,
    fontSize: 8,
    letterSpacing: 2,
    color: C.vertMoyen,
    marginBottom: 2,
  },
  bodyValue: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 12,
    color: C.vertForet,
  },
  bodyLieu: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 12,
    color: C.vertMoyen,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bodySeparator: {
    height: 1,
    backgroundColor: 'rgba(27,67,50,0.1)',
    marginVertical: 14,
  },
  bodyRef: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: C.vertMoyen,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  qrZone: {
    backgroundColor: C.blanc,
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.08)',
    alignItems: 'center',
  },
  qrWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrPlaceholder: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,77,109,0.85)',
    borderRadius: 4,
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
    color: '#FF4D6D', textAlign: 'center', marginTop: -8, marginBottom: 12,
  },

  // FOOTER / SOUCHE
  footer: {
    backgroundColor: C.beige,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: C.vertForet,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 20,
  },
  badgeText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 9,
    letterSpacing: 2.5,
    color: C.or,
  },
  prixText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 28,
    color: C.vertForet,
    letterSpacing: -0.5,
  },
  legalText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 9,
    color: C.vertMoyen,
    fontStyle: 'italic',
  },
  watermark: {
    fontSize: 8,
    color: 'rgba(27,67,50,0.3)',
    letterSpacing: 2,
    alignSelf: 'flex-end',
    marginRight: 4,
  },

  // BOUTON EXPORT
  exportBtn: {
    backgroundColor: C.vertForet,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  exportText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: C.or,
    letterSpacing: 1,
  },
})
