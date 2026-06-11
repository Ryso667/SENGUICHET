// Écran ticket — style billet physique imprimé (design ESP)
// Fond sombre, ticket blanc/crème structuré en 5 zones : talon, perforation, corps, prix, série
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts, spacing } from '../constants/theme'
import OrganisateurLayout from '../components/OrganisateurLayout'
import BlurBackground from '../components/BlurBackground'
import { formaterDateLisible } from '../utils/dateUtils'
import { genererTicketPDF } from '../services/ticketPdfService'
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

// Palette du design ticket physique ESP
const C = {
  ticketBg: '#EEF2F7',
  white: '#FFFFFF',
  gold: '#D4A574',
  dark: '#1A1A2E',
  gray: '#5A5A60',
  labelGray: '#8A9AAE',
  border: '#CDD5DE',
  refGray: '#8A8A8A',
  legalGray: '#A0A098',
  watermarkGreen: '#66BB6A',
  watermarkRed: '#FF4D6D',
  greenDark: '#183828',
  greenLight: '#2E6040',
  greenText: '#8FC0A0',
  cyan: '#00BCD4',
  serialGray: '#B8C2CC',
  stubBg: '#EDE8E0',
}

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const [qrValue, setQrValue] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [exporting, setExporting] = useState(false)
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
      await genererTicketPDF(ticket, qrDataUrl)
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer le PDF. Réessayez.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={styles.container}>
      <OrganisateurLayout />
      <BlurBackground category={ticket?.categorie} showImage={false} gradientOverride={['rgba(121,134,203,0.15)', 'rgba(30,28,26,0.95)']} />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketWrapper}>
          {/* ===== CARTE TICKET ===== */}
          <View style={styles.ticketCard}>

            {/* 1. TALON SUPÉRIEUR — fond blanc, logo e, prix vertical, mini QR */}
            <View style={styles.stubTop}>
              <View style={styles.logoEBox}>
                <Text style={styles.logoEText}>e</Text>
              </View>
              <View style={styles.priceVertical}>
                <Text style={styles.priceVerticalText}>{prixStr}</Text>
              </View>
              <View style={styles.qrMini}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={36}
                    color="#000000"
                    backgroundColor={C.white}
                    ecl="H"
                    quietZone={0}
                  />
                ) : (
                  <ActivityIndicator size="small" color={C.gold} />
                )}
              </View>
            </View>

            {/* 2. SÉPARATEUR PERFORATION — pointillés + demi-cercles */}
            <View style={styles.perforation}>
              <View style={styles.halfCircleLeft} />
              <View style={styles.perfLine} />
              <View style={styles.halfCircleRight} />
            </View>

            {/* 3. CORPS PRINCIPAL — fond gris clair */}
            <View style={styles.mainBody}>

              {/* Filigrane diagonal ESP */}
              <View style={styles.watermarkBg} pointerEvents="none">
                <Text style={styles.watermarkBgText}>ESP</Text>
              </View>

              {/* Titre événement */}
              <Text style={styles.eventTitle}>{eventNom}</Text>

              <View style={styles.sep} />

              {/* Paires d'infos */}
              <View style={styles.infoPair}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{dateStr || '—'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Horaire</Text>
                  <Text style={styles.infoValue}>{heureStr || '—'}</Text>
                </View>
              </View>

              <View style={styles.infoPair}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Lieu</Text>
                  <Text style={styles.infoValue}>{lieuStr || '—'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{catStr}</Text>
                </View>
              </View>

              <View style={styles.sep} />

              {/* QR central 108x108 */}
              <View style={styles.qrCentral}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={94}
                    color="#000000"
                    backgroundColor={C.white}
                    ecl="H"
                    quietZone={3}
                    getRef={(c) => { qrRef.current = c }}
                  />
                ) : (
                  <ActivityIndicator size="small" color={C.gold} />
                )}
              </View>

              {/* Référence ticket */}
              <Text style={styles.ticketRef}>REF · {refStr}</Text>

              {/* Pied : numéro + badge catégorie */}
              <View style={styles.footerLine}>
                <Text style={styles.ticketNum}>#{ticket?.id || '00234'}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{catStr}</Text>
                </View>
              </View>
            </View>

            {/* 4. BANDE DE PRIX — dégradé vert foncé */}
            <View style={styles.priceBand}>
              <View>
                <Text style={styles.priceLabel}>TARIF</Text>
                <Text style={styles.priceAmount}>{prixStr}</Text>
                <Text style={styles.priceNote}>Entrée unique · Non transférable</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{catStr}</Text>
              </View>
            </View>

            {/* Watermark superposition (UTILISÉ / EXPIRÉ) */}
            {showWatermark ? (
              <View style={styles.watermarkOverlay} pointerEvents="none">
                <Text style={[styles.watermarkText, { color: watermarkColor }]}>
                  {watermarkLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bouton export PDF */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={exporting}
        >
          <Text style={styles.exportText}>
            {exporting ? 'Génération...' : 'Exporter en PDF'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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

  ticketWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  ticketCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.ticketBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },

  // ===== 1. TALON SUPÉRIEUR =====
  stubTop: {
    backgroundColor: C.white,
    height: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEBox: {
    width: 48,
    height: 48,
    borderWidth: 3,
    borderColor: C.cyan,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: C.cyan,
  },
  priceVertical: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  priceVerticalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.greenDark,
    letterSpacing: 1,
    writingDirection: 'rtl',
    transform: [{ rotate: '90deg' }],
  },
  qrMini: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    width: 42,
    height: 42,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== 2. PERFORATION =====
  perforation: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.ticketBg,
  },
  halfCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
    marginLeft: -10,
  },
  halfCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
    marginRight: -10,
  },
  perfLine: {
    flex: 1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.border,
  },

  // ===== 3. CORPS PRINCIPAL =====
  mainBody: {
    backgroundColor: C.ticketBg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkBg: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  watermarkBgText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4A6A8A',
    opacity: 0.09,
    transform: [{ rotate: '-30deg' }],
    letterSpacing: 4,
  },
  eventTitle: {
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: 'bold',
    color: C.dark,
    lineHeight: 16,
    marginBottom: 10,
    zIndex: 1,
  },
  sep: {
    borderTopWidth: 1,
    borderColor: C.border,
    marginVertical: 8,
  },
  infoPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    zIndex: 1,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 6.5,
    color: C.labelGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: fonts.outfit.bold,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.dark,
    fontFamily: fonts.outfit.semiBold,
  },
  qrCentral: {
    width: 108,
    height: 108,
    alignSelf: 'center',
    marginVertical: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  ticketRef: {
    textAlign: 'center',
    fontSize: 7,
    color: C.labelGray,
    letterSpacing: 1.5,
    marginBottom: 8,
    zIndex: 1,
  },
  footerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  ticketNum: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4A6A8A',
    fontFamily: fonts.outfit.bold,
  },
  categoryBadge: {
    backgroundColor: '#D4EDDA',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  categoryBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: C.greenLight,
  },

  // ===== 4. BANDE DE PRIX =====
  priceBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.greenDark,
  },
  priceLabel: {
    fontSize: 7,
    color: C.greenText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: fonts.outfit.bold,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: C.white,
    fontFamily: fonts.outfit.bold,
  },
  priceNote: {
    fontSize: 7,
    color: C.greenText,
    fontFamily: fonts.outfit.regular,
  },
  priceBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: C.white,
    textTransform: 'uppercase',
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
    fontSize: 60,
    letterSpacing: 8,
    opacity: 0.15,
    transform: [{ rotate: '-30deg' }],
  },

  // Bouton export PDF
  exportBtn: {
    backgroundColor: C.white,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.gold,
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
    color: C.gold,
    letterSpacing: 0.5,
  },
})
