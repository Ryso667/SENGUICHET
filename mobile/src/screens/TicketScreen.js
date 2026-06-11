// Écran ticket — style billet physique vert émeraude allongé
// Fond sombre #0F1A0F, ticket structuré : header vert → perforation → corps crème → perforation → souche beige
import { useRef, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, fonts, spacing } from '../constants/theme'
import OrganisateurLayout from '../components/OrganisateurLayout'
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
  watermarkRed: '#FF4D6D',
  watermarkGreen: '#66BB6A',
}

const NB_DASHES = 30

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
        const html = genererHtmlWeb(ticket, qrDataUrl)
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

  // Génère le HTML du ticket pour l'export web (format paysage 3 colonnes)
  function genererHtmlWeb(ticket, qrDataUrl) {
    const nomEvent = (ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()
    const dateFmt = ticket.eventDate
      ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : ''
    const heure = ticket.eventHeure || ''
    const lieu = (ticket.eventLieu || '').toUpperCase()
    const categorie = (ticket.categorie || 'STANDARD').toUpperCase()
    const prix = ticket.prix ? `${Number(ticket.prix).toLocaleString('fr-FR')} FCFA` : '—'
    const ref = ticket.numero || '—'
    const qrImg = qrDataUrl
      ? `<img src="${qrDataUrl}" style="width:160px;height:160px;display:block" />`
      : '<div style="width:160px;height:160px;"></div>'
    const usedOverlay = statut === 'utilise' || statut === 'expire'
      ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,0.9);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">✕</div>'
      : ''

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Billet ${nomEvent}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page{margin:0}*{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{background:#0F1A0F;display:flex;justify-content:center;align-items:center;height:100vh;padding:24px;font-family:'Outfit','Helvetica Neue',Arial,sans-serif}
  .t{display:flex;flex-direction:row;width:100%;max-width:780px;height:480px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative}
  .cl{width:25%;background:#5C6BC0;border-radius:20px 0 0 20px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:32px 20px;flex-shrink:0}
  .cl .o1{position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(92,107,192,0.35)}
  .cl .o2{position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;border-radius:50%;background:rgba(212,175,55,0.15)}
  .cl .brand{font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;position:relative;z-index:1}
  .cl .gl{width:60px;height:1px;background:#D4AF37;opacity:0.7;position:relative;z-index:1}
  .cl .en{font-size:22px;font-weight:800;color:#fff;text-align:center;line-height:1.25;position:relative;z-index:1}
  .cl .sub{font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;position:relative;z-index:1}
  .cl .lw{position:relative;z-index:1}
  .sp{width:24px;position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center}
  .sp.dc{background:linear-gradient(to right,#5C6BC0,#F9F6EE)}.sp.cb{background:linear-gradient(to right,#F9F6EE,#F0EAD6)}
  .sp .d{position:absolute;left:50%;top:0;bottom:0;border-left:2px dashed rgba(37,43,122,0.2)}
  .sp .sc{position:absolute;left:50%;transform:translateX(-50%);width:24px;height:24px;border-radius:50%;background:#0F1A0F;z-index:2}
  .sp .sc.t{top:-12px}.sp .sc.b{bottom:-12px}
  .cc{width:45%;background:#F9F6EE;padding:36px 28px;display:flex;flex-direction:column;justify-content:center;gap:16px;flex-shrink:0}
  .cc .r2{display:flex;justify-content:space-between;align-items:flex-start}
  .cc .lbl{font-size:8px;letter-spacing:2px;color:#B8944A;font-weight:600;text-transform:uppercase;margin-bottom:3px}
  .cc .lbl2{font-size:8px;letter-spacing:2px;color:#1E2250;font-weight:600;text-transform:uppercase;margin-bottom:3px}
  .cc .val{font-size:13px;color:#1E2250;font-weight:600}
  .cc .lieu{color:#B8944A;letter-spacing:0.5px;font-weight:700;font-size:13px}
  .cc .sl{height:1px;background:rgba(37,43,122,0.1)}
  .cc .ref{font-size:9px;color:#B8944A;letter-spacing:2px;text-align:center;font-family:monospace}
  .cc .qw{background:#fff;border-radius:12px;padding:12px;border:1px solid rgba(37,43,122,0.08);display:flex;justify-content:center;align-items:center;align-self:center;position:relative}
  .cr{width:30%;background:#F0EAD6;border-radius:0 20px 20px 0;padding:32px 24px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px;position:relative;flex-shrink:0}
  .cr .bdg{background:#5C6BC0;border-radius:999px;padding:6px 24px}
  .cr .bt{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#D4AF37;text-transform:uppercase}
  .cr .pr{font-size:32px;font-weight:800;color:#1E2250;letter-spacing:-0.5px;text-align:center}
  .cr .lg{font-size:9px;color:#B8944A;font-style:italic;text-align:center}
  .cr .ts{width:40px;height:1px;background:rgba(37,43,122,0.15)}
  .cr .wm{font-size:8px;color:rgba(37,43,122,0.25);letter-spacing:3px;position:absolute;bottom:16px;right:16px}
</style></head>
<body>
<div class="t">
  <div class="cl"><div class="o1"></div><div class="o2"></div><div class="lw"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='rgba(255,255,255,0.12)' stroke='rgba(255,255,255,0.2)' stroke-width='1'/%3E%3Ctext x='24' y='28' text-anchor='middle' font-size='20' font-weight='700' fill='%23D4AF37' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E" style="width:38px;height:38px;display:block;border-radius:8px" /></div><div class="brand">SENGUICHET</div><div class="gl"></div><div class="en">${nomEvent}</div><div class="sub">${categorie}</div></div>
  <div class="sp dc"><div class="d"></div><div class="sc t"></div><div class="sc b"></div></div>
  <div class="cc">
    <div class="r2"><div><div class="lbl">DATE</div><div class="val">${dateFmt}</div></div>${heure ? '<div style="text-align:right"><div class="lbl">HEURE</div><div class="val">' + heure + '</div></div>' : ''}</div>
    ${lieu ? '<div><div class="lbl">LIEU</div><div class="lieu">' + lieu + '</div></div>' : ''}
    <div class="sl"></div>
    <div class="ref">REF · ${ref}</div>
    <div class="qw" style="${usedOverlay ? 'position:relative' : ''}">${qrImg}${usedOverlay}</div>
  </div>
  <div class="sp cb"><div class="d"></div><div class="sc t"></div><div class="sc b"></div></div>
  <div class="cr"><div class="bdg"><div class="bt">${categorie}</div></div><div class="pr">${prix}</div><div class="lg">Entrée unique et non transférable</div><div class="ts"></div><div class="wm">SENGUICHET</div></div>
</div>
</body></html>`
  }

  return (
    <View style={styles.container}>
      <OrganisateurLayout />
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color="#fff" />
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
            <LinearGradient colors={['#5C6BC0', '#F9F6EE']} style={styles.perforation} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
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
              <View style={styles.qrWrapper}>
                {qrReady ? (
                  <QRCode
                    value={qrValue}
                    size={200}
                    color="#1E2250"
                    backgroundColor="#FFFFFF"
                    ecl="H"
                    quietZone={16}
                    getRef={(c) => { qrRef.current = c }}
                  />
                ) : (
                  <ActivityIndicator size="small" color={C.greenDark} />
                )}
                {showWatermark && (
                  <View style={styles.qrOverlay}>
                    <Text style={styles.qrCross}>✕</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ===== 4. PERFORATION BASSE — #F9F6EE → #F0EAD6 ===== */}
            <LinearGradient colors={['#F9F6EE', '#F0EAD6']} style={styles.perforation} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
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
          <Feather name="file-text" size={16} color={C.gold} style={{ marginRight: 8 }} />
          <Text style={styles.exportText}>
            {exporting ? 'GÉNÉRATION...' : 'EXPORTER EN PDF'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.pageBg,
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

  // ===== CARTE TICKET =====
  ticketWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
  ticketCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },

  // ===== 1. HEADER =====
  header: {
    backgroundColor: '#5C6BC0',
    paddingVertical: 32,
    paddingHorizontal: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  orbe1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(92,107,192,0.3)',
  },
  orbe2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  orbe3: {
    position: 'absolute', top: 60, left: -20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 28, height: 28, borderRadius: 6,
  },
  brandLabel: {
    fontSize: 10,
    fontFamily: fonts.outfit.bold,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.7)',
  },
  goldLine: {
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.5,
    marginTop: 20,
    marginBottom: 18,
  },
  eventName: {
    fontSize: 22,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  catPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  catPillText: {
    fontSize: 9,
    fontFamily: fonts.outfit.bold,
    letterSpacing: 2,
    color: '#D4AF37',
  },

  // ===== 2. PERFORATION =====
  perforation: {
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    zIndex: 1,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 30,
    position: 'absolute',
    left: 0, right: 0,
  },
  perfDot: {
    width: 5,
    height: 2,
    backgroundColor: '#3D4356',
    borderRadius: 1,
  },
  halfCircle: {
    position: 'absolute',
    top: '50%',
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: C.pageBg,
    zIndex: 2,
    marginTop: -12,
  },
  halfCircleLeft: {
    left: -12,
  },
  halfCircleRight: {
    right: -12,
  },

  // ===== 3. CORPS =====
  body: {
    backgroundColor: '#F9F6EE',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoBlock: {
    flex: 1,
  },
  infoBlockRight: {
    alignItems: 'flex-end',
  },
  infoDateLabel: {
    fontSize: 8,
    fontFamily: fonts.outfit.bold,
    letterSpacing: 2,
    color: '#B8944A',
    marginBottom: 3,
  },
  infoDateValue: {
    fontSize: 14,
    fontFamily: fonts.outfit.semiBold,
    color: '#1E2250',
  },
  lieuBlock: {
    marginTop: 14,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: fonts.outfit.bold,
    letterSpacing: 2,
    color: '#B8944A',
    marginBottom: 3,
  },
  lieuValue: {
    fontSize: 13,
    fontFamily: fonts.outfit.semiBold,
    color: '#B8944A',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(37,43,122,0.08)',
    marginVertical: 18,
  },
  refText: {
    fontSize: 9,
    fontFamily: fonts.jakarta.regular,
    color: '#B8944A',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
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
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FF4D6D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  qrCross: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ===== 4. FOOTER =====
  footer: {
    backgroundColor: '#F0EAD6',
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  categoryBadge: {
    backgroundColor: '#5C6BC0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: fonts.outfit.bold,
    letterSpacing: 2.5,
    color: '#D4AF37',
  },
  priceText: {
    fontSize: 28,
    fontFamily: fonts.outfit.bold,
    color: '#1E2250',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  legalText: {
    fontSize: 9,
    fontFamily: fonts.jakarta.regular,
    color: '#B8944A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wmText: {
    fontSize: 8,
    color: 'rgba(37,43,122,0.25)',
    fontFamily: fonts.outfit.bold,
    letterSpacing: 3,
    alignSelf: 'flex-end',
    marginTop: 4,
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
    opacity: 0.12,
    transform: [{ rotate: '-30deg' }],
  },

  // Bouton export PDF
  exportBtn: {
    backgroundColor: '#5C6BC0',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.lg,
    width: '100%',
  },
  exportText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#D4AF37',
    letterSpacing: 1,
  },
})
