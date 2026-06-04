// Écran ticket — affichage complet : logo, QR, infos, prix, perforations
// Design ticket classique avec habillage glass (fond gradient + carte glass)
// QR rafraîchi toutes les 30s avec nouveau HMAC (sécurité anti-rejeu)
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
import { HMAC_SECRET } from '../config'

const QR_REFRESH_INTERVAL = 30

// Génère le payload JSON du QR avec HMAC-SHA256 (uuid, ref, timestamp, event_id, category)
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

// Ligne de perforation décorative (tirets)
function DashLine() {
  return <Text style={styles.dash}>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
}

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const [qrValue, setQrValue] = useState(null)
  const [qrReady, setQrReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const qrRef = useRef(null)

  // Génère le QR payload à l'ouverture et le rafraîchit toutes les 30s
  useEffect(() => {
    genererQRPayload(ticket).then((v) => { setQrValue(v); setQrReady(true) })
    const interval = setInterval(async () => {
      const nouveau = await genererQRPayload(ticket)
      setQrValue(nouveau)
    }, QR_REFRESH_INTERVAL * 1000)
    return () => clearInterval(interval)
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
  const organisateurNom = 'SENGUICHET'
  const eventNom = ticket?.eventNom || ticket?.evenement || 'ÉVÉNEMENT'
  const dateStr = ticket?.eventDate ? formaterDateLisible(ticket.eventDate) : ''
  const heureStr = ticket?.eventHeure || ''
  const lieuStr = ticket?.eventLieu || ''
  const refStr = ticket?.numero || '—'
  const catStr = ticket?.categorie || 'STANDARD'
  const prixStr = ticket?.prix ? `${ticket.prix.toLocaleString()} FCFA` : '—'

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

      {/* Bouton retour flottant */}
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Titre */}
        <Text style={styles.pageTitle}>Mon billet</Text>

        {/* Carte ticket glass */}
        <GlassContainer style={styles.ticketCard} blurType="light" intensity={60}>

          {/* 1. En-tête organisateur centré avec logo */}
          <View style={styles.headerCentered}>
            <Image
              source={require('../../assets/logo_mobile.jpeg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.organisateurText}>{organisateurNom}</Text>
          </View>
          <DashLine />

          {/* 2. Nom de l'événement */}
          <Text style={styles.eventName}>{eventNom.toUpperCase()}</Text>
          <DashLine />

          {/* 3. Date, heure et lieu */}
          {dateStr ? <Text style={styles.infoText}>{dateStr}{heureStr ? ` à ${heureStr}` : ''}</Text> : null}
          {lieuStr ? <Text style={styles.venueText}>{lieuStr.toUpperCase()}</Text> : null}
          <DashLine />

          {/* 4. Référence */}
          <Text style={styles.refText}>REF : {refStr}</Text>

          {/* 5. QR Code avec HMAC (rafraîchi toutes les 30s) */}
          <View style={styles.qrSection}>
            <View style={styles.qrWrapper}>
              {qrReady ? (
                <QRCode
                  value={qrValue}
                  size={200}
                  backgroundColor="rgba(255,255,255,0.1)"
                  color="#fff"
                  ecl="H"
                  quietZone={8}
                  getRef={(c) => { qrRef.current = c }}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="small" color="#fff" />
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

          {/* 6. Catégorie et prix */}
          <DashLine />
          <Text style={styles.categorieText}>{catStr.toUpperCase()}</Text>
          <Text style={styles.prixText}>PRIX: {prixStr}</Text>
          <DashLine />

          {/* 7. Footer */}
          <Text style={styles.footerText}>Entrée unique et non transférable</Text>
        </GlassContainer>

        {/* Actions */}
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
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  headerCentered: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  logoImage: {
    width: 40, height: 40, borderRadius: 8,
    marginBottom: 4,
  },
  organisateurText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    ...textShadow,
  },
  dash: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 7,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  eventName: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    ...textShadow,
  },
  infoText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
    ...textShadow,
  },
  venueText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    ...textShadow,
  },
  refText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...textShadow,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrWrapper: {
    position: 'relative',
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.sm,
  },
  qrPlaceholder: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(220,38,38,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  redX: {
    fontSize: 36, color: '#fff',
    fontFamily: fonts.outfit.bold,
    lineHeight: 40,
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
  categorieText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
    ...textShadow,
  },
  prixText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...textShadow,
  },
  footerText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    lineHeight: 14,
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
