// Écran ticket — style billet physique vert émeraude allongé
// Fond sombre #0F1A0F, ticket structuré : header vert → perforation → corps crème → perforation → souche beige
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image, Dimensions, Modal } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, fonts, spacing } from '../constants/theme'
import { formaterDateLisible } from '../utils/dateUtils'
import { scale, fontScale, lineHeightScale, isPad } from '../utils/responsive'
import { genererTicketPDF, genererHtmlWebTicket } from '../services/ticketPdfService'
import { HMAC_SECRET } from '../config'

const QR_REFRESH_INTERVAL = 30

// Génère le payload signé HMAC pour le QR code
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

// Palette indigo (harmonisée avec le thème de l'app)
const C = {
  headerBg: '#5C6BC0',
  surface: '#6C7BD0',
  accent: '#D4AF37',
  label: '#B8944A',
  cream: '#F9F6EE',
  beige: '#F0EAD6',
  pageBg: '#0F1A0F',
  white: '#FFFFFF',
  dark: '#1E2250',
  watermarkRed: '#FF4D6D',
  watermarkGreen: '#66BB6A',
  perfDot: '#3D4356',
}

const SCREEN_WIDTH = Dimensions.get('window').width
const NB_DASHES = Math.max(15, Math.min(40, Math.floor((Math.min(SCREEN_WIDTH, 340) - 60) / 9)))

// Rendu des pointillés de perforation
function PerfLigne() {
  return (
    <View style={styles.perfRow}>
      {Array.from({ length: NB_DASHES }).map((_, i) => (
        <View key={i} style={styles.perfDot} />
      ))}
    </View>
  )
}

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const [qrValue, setQrValue] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const qrRef = useRef(null)

  // Génération initiale + rafraîchissement toutes les 30s
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

  const statut = (ticket?.statut || '').toLowerCase()
  const isUsed = statut === 'utilise'
  const isExpired = statut === 'expire'
  const showWatermark = isUsed || isExpired
  const watermarkLabel = isExpired ? 'EXPIRÉ' : 'UTILISÉ'
  const watermarkColor = isExpired ? C.watermarkRed : C.watermarkGreen

  const eventNom = ticket?.eventNom || ticket?.evenement || 'ÉVÉNEMENT'
  const dateStr = ticket?.eventDate ? formaterDateLisible(ticket.eventDate) : ''
  const heureStr = ticket?.eventHeure || ''
  const lieuStr = ticket?.eventLieu || ''
  const refStr = ticket?.numero || 'TKT-XXXXXXX'
  const catStr = ticket?.categorie || 'STANDARD'
  const prixStr = ticket?.prix ? `${Number(ticket.prix).toLocaleString('fr-FR')} FCFA` : '—'

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const qrDataUrl = await getQRDataURL()

      if (Platform.OS === 'web') {
        const { default: Print } = await import('expo-print')
        const html = genererHtmlWebTicket(ticket, qrDataUrl)
        const { uri } = await Print.printToFileAsync({
          html,
          width: 841,
          height: 595,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        })
        const rep = await fetch(uri)
        const blob = await rep.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Billet - ${ticket.eventNom || 'senguichet'}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        await genererTicketPDF(ticket, qrDataUrl)
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer le PDF. Réessayez.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color={C.white} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketWrapper}>
          <View style={styles.ticketCard}>

            {/* ===== 1. HEADER — vert forêt #5C6BC0 ===== */}
            <View style={styles.header}>
              {/* Orbes décoratifs */}
              <View style={styles.orbe1} />
              <View style={styles.orbe2} />
              <View style={styles.orbe3} />
              {/* Logo + marque */}
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Image source={require('../../assets/logo_mobile.jpeg')} style={styles.logoImg} />
                </View>
                <Text style={styles.brandLabel}>SENGUICHET</Text>
              </View>
              {/* Ligne dorée décorative */}
              <View style={styles.goldLine} />
              {/* Nom de l'événement */}
              <Text style={styles.eventName}>{(eventNom || '').toUpperCase()}</Text>
              {/* Catégorie */}
              <View style={styles.catPill}>
                <Text style={styles.catPillText}>{(catStr || 'STANDARD').toUpperCase()}</Text>
              </View>
            </View>

            {/* ===== 2. PERFORATION HAUTE — #5C6BC0 → #F9F6EE ===== */}
            <LinearGradient colors={[C.headerBg, C.cream]} style={styles.perforation} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
              <PerfLigne />
              {/* Demi-cercles de bord */}
              <View style={[styles.halfCircle, styles.halfCircleLeft]} />
              <View style={[styles.halfCircle, styles.halfCircleRight]} />
            </LinearGradient>

            {/* ===== 3. CORPS — crème #F9F6EE ===== */}
            <View style={styles.body}>
              {/* Ligne date/heure */}
              <View style={styles.infoRow}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoDateLabel}>DATE</Text>
                  <Text style={styles.infoDateValue}>{dateStr || '—'}</Text>
                </View>
                <View style={[styles.infoBlock, styles.infoBlockRight]}>
                  <Text style={styles.infoDateLabel}>HEURE</Text>
                  <Text style={styles.infoDateValue}>{heureStr || '—'}</Text>
                </View>
              </View>

              {/* Lieu */}
              <View style={styles.lieuBlock}>
                <Text style={styles.infoLabel}>LIEU</Text>
                <Text style={styles.lieuValue}>{(lieuStr || '').toUpperCase()}</Text>
              </View>

              {/* Séparateur fin */}
              <View style={styles.separator} />

              {/* Référence */}
              <Text style={styles.refText}>REF · {refStr}</Text>

              {/* QR code central */}
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                <View style={styles.qrWrapper}>
                  {qrReady ? (
                    <QRCode
                      value={qrValue}
                      size={scale(200)}
                      color={C.dark}
                      backgroundColor={C.white}
                      ecl="H"
                      quietZone={scale(16)}
                      getRef={(c) => { qrRef.current = c }}
                    />
                  ) : (
                    <ActivityIndicator size="small" color={C.headerBg} />
                  )}
                  {showWatermark && (
                    <View style={styles.qrOverlay}>
                      <Text style={styles.qrCross}>✕</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* ===== 4. PERFORATION BASSE — #F9F6EE → #F0EAD6 ===== */}
            <LinearGradient colors={[C.cream, C.beige]} style={styles.perforation} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
              <PerfLigne />
              <View style={[styles.halfCircle, styles.halfCircleLeft]} />
              <View style={[styles.halfCircle, styles.halfCircleRight]} />
            </LinearGradient>

            {/* ===== 5. FOOTER / SOUCHE — beige #F0EAD6 ===== */}
            <View style={styles.footer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{(catStr || 'STANDARD').toUpperCase()}</Text>
              </View>
              <Text style={styles.priceText}>{prixStr}</Text>
              <Text style={styles.legalText}>Entrée unique et non transférable</Text>
              <Text style={styles.wmText}>SENGUICHET</Text>
            </View>

            {/* Watermark superposition (UTILISÉ / EXPIRÉ) */}
            {showWatermark && (
              <View style={styles.watermarkOverlay} pointerEvents="none">
                <Text style={[styles.watermarkText, { color: watermarkColor }]}>
                  {watermarkLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton export PDF */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={exporting}
        >
          <Feather name="file-text" size={16} color={C.accent} style={{ marginRight: 8 }} />
          <Text style={styles.exportText}>
            {exporting ? 'GÉNÉRATION...' : 'EXPORTER EN PDF'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal QR plein écran */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            {qrReady && (
              <>
                <QRCode
                  value={qrValue}
                  size={SCREEN_WIDTH * 0.75}
                  color={C.dark}
                  backgroundColor={C.white}
                  ecl="H"
                  quietZone={scale(16)}
                />
                <Text style={styles.modalRef}>REF · {refStr}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  backBtn: {
    position: 'absolute', left: scale(24), zIndex: 10,
    width: scale(40), height: scale(40), borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  // ===== CARTE TICKET =====
  ticketWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: scale(340),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
  ticketCard: {
    width: '100%',
    borderRadius: scale(20),
    overflow: 'hidden',
    position: 'relative',
  },

  // ===== 1. HEADER =====
  header: {
    backgroundColor: C.headerBg,
    paddingVertical: scale(32),
    paddingHorizontal: scale(28),
    position: 'relative',
    overflow: 'hidden',
  },
  orbe1: {
    position: 'absolute', top: scale(-40), right: scale(-40),
    width: scale(140), height: scale(140), borderRadius: scale(70),
    backgroundColor: 'rgba(92,107,192,0.3)',
  },
  orbe2: {
    position: 'absolute', bottom: scale(-30), left: scale(-30),
    width: scale(100), height: scale(100), borderRadius: scale(50),
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  orbe3: {
    position: 'absolute', top: scale(60), left: scale(-20),
    width: scale(60), height: scale(60), borderRadius: scale(30),
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  logoBox: {
    width: scale(38), height: scale(38), borderRadius: scale(10),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: scale(1), borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: scale(28), height: scale(28), borderRadius: scale(6),
  },
  brandLabel: {
    fontSize: fontScale(10),
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(3),
    color: 'rgba(255,255,255,0.7)',
  },
  goldLine: {
    height: 1,
    backgroundColor: C.accent,
    opacity: 0.5,
    marginTop: scale(20),
    marginBottom: scale(18),
  },
  eventName: {
    fontSize: fontScale(22),
    fontFamily: fonts.outfit.bold,
    color: C.white,
    textAlign: 'center',
    letterSpacing: fontScale(0.5),
    lineHeight: lineHeightScale(28),
  },
  catPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 999,
    paddingVertical: scale(4),
    paddingHorizontal: scale(14),
    marginTop: scale(10),
  },
  catPillText: {
    fontSize: fontScale(9),
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(2),
    color: C.accent,
  },

  // ===== 2. PERFORATION =====
  perforation: {
    height: scale(24),
    position: 'relative',
    justifyContent: 'center',
    zIndex: 1,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: scale(30),
    position: 'absolute',
    left: 0, right: 0,
  },
  perfDot: {
    width: scale(5),
    height: scale(2),
    backgroundColor: C.perfDot,
    borderRadius: scale(1),
  },
  halfCircle: {
    position: 'absolute',
    top: '50%',
    width: scale(24), height: scale(24),
    borderRadius: scale(12),
    backgroundColor: C.pageBg,
    zIndex: 2,
    marginTop: scale(-12),
  },
  halfCircleLeft: {
    left: scale(-12),
  },
  halfCircleRight: {
    right: scale(-12),
  },

  // ===== 3. CORPS =====
  body: {
    backgroundColor: C.cream,
    paddingHorizontal: scale(28),
    paddingTop: scale(28),
    paddingBottom: scale(16),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(4),
  },
  infoBlock: {
    flex: 1,
  },
  infoBlockRight: {
    alignItems: 'flex-end',
  },
  infoDateLabel: {
    fontSize: fontScale(8),
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(2),
    color: C.label,
    marginBottom: scale(3),
  },
  infoDateValue: {
    fontSize: fontScale(14),
    fontFamily: fonts.outfit.semiBold,
    color: C.dark,
  },
  lieuBlock: {
    marginTop: scale(14),
  },
  infoLabel: {
    fontSize: fontScale(8),
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(2),
    color: C.label,
    marginBottom: scale(3),
  },
  lieuValue: {
    fontSize: fontScale(13),
    fontFamily: fonts.outfit.semiBold,
    color: C.label,
    letterSpacing: fontScale(0.5),
  },
  separator: {
    height: scale(1),
    backgroundColor: 'rgba(37,43,122,0.08)',
    marginVertical: scale(18),
  },
  refText: {
    fontSize: fontScale(9),
    fontFamily: fonts.jakarta.regular,
    color: C.label,
    textAlign: 'center',
    letterSpacing: scale(2),
    marginBottom: scale(6),
  },
  qrWrapper: {
    backgroundColor: '#fff',
    borderRadius: scale(14),
    padding: scale(16),
    marginTop: scale(10),
    marginBottom: scale(6),
    borderWidth: scale(1),
    borderColor: 'rgba(37,43,122,0.06)',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  qrOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: scale(56), height: scale(56), borderRadius: scale(28),
    backgroundColor: C.watermarkRed,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  qrCross: {
    fontSize: fontScale(26),
    color: C.white,
    fontWeight: '700',
  },

  // ===== 4. FOOTER =====
  footer: {
    backgroundColor: C.beige,
    paddingVertical: scale(24),
    paddingHorizontal: scale(28),
    alignItems: 'center',
    gap: scale(10),
    position: 'relative',
  },
  categoryBadge: {
    backgroundColor: C.headerBg,
    borderRadius: 999,
    paddingVertical: scale(6),
    paddingHorizontal: scale(24),
  },
  categoryBadgeText: {
    fontSize: fontScale(9),
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(2.5),
    color: C.accent,
  },
  priceText: {
    fontSize: fontScale(28),
    fontFamily: fonts.outfit.bold,
    color: C.dark,
    letterSpacing: scale(-0.5),
    textAlign: 'center',
  },
  legalText: {
    fontSize: fontScale(9),
    fontFamily: fonts.jakarta.regular,
    color: C.label,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wmText: {
    fontSize: fontScale(8),
    color: 'rgba(37,43,122,0.25)',
    fontFamily: fonts.outfit.bold,
    letterSpacing: scale(3),
    alignSelf: 'flex-end',
    marginTop: scale(4),
  },

  // Watermark diagonal (UTILISÉ / EXPIRÉ)
  watermarkOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(60),
    letterSpacing: scale(8),
    opacity: 0.12,
    transform: [{ rotate: '-30deg' }],
  },

  // Modal QR plein écran
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: scale(-60),
    right: 0,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: fontScale(20),
    color: C.white,
    fontWeight: '700',
  },
  modalRef: {
    fontSize: fontScale(14),
    fontFamily: fonts.outfit.semiBold,
    color: 'rgba(255,255,255,0.8)',
    marginTop: scale(20),
    letterSpacing: scale(2),
  },

  // Bouton export PDF
  exportBtn: {
    backgroundColor: C.headerBg,
    borderRadius: 999,
    paddingVertical: scale(14),
    paddingHorizontal: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.lg,
    width: '100%',
  },
  exportText: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(14),
    color: C.accent,
    letterSpacing: scale(1),
  },
})
