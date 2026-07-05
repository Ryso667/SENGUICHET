// Écran de scan : caméra + vérification offline du QR code
// Télécharge les tickets automatiquement au focus et périodiquement (30s)
// Utilise le barcode natif avec fallback silencieux
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { hapticSuccess, hapticError } from '../../utils/haptics'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { verifierBillet, telechargerTickets, synchroniser, nettoyerTicketsHorsEvenement } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { scale, fontScale } from '../../utils/responsive'
import GlassButton from '../../components/GlassButton'

const INTERVAL_REFRESH = 30000

const COULEURS = {
  VALIDE: { fond: '#66BB6A', icone: 'check-circle', label: 'Entrée autorisée ✅' },
  DEJA_UTILISE: { fond: '#FFA726', icone: 'alert-circle', label: 'Déjà scanné ⚠️' },
  EXPIRE: { fond: '#FF4D6D', icone: 'clock-outline', label: 'QR code expiré ⏳' },
  INCONNU: { fond: '#FF4D6D', icone: 'help-circle', label: 'Billet non trouvé ❓' },
  FRAUDE: { fond: '#FF4D6D', icone: 'alert-octagon', label: 'QR code falsifié 🚫' },
}

export default function ScannerScreen({ navigation, route }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [permission, requestPermission] = useCameraPermissions()
  const [scanne, setScanne] = useState(null)
  const [pret, setPret] = useState(false)
  const [nbTickets, setNbTickets] = useState(0)
  const [chargeTickets, setChargeTickets] = useState(false)
  const [synchro, setSynchro] = useState(null)
  const [camError, setCamError] = useState(null)
  const intervalRef = useRef(null)
  const { evenementId, evenementTitre } = useAuth()
  const animation = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  const eventId = evenementId || route?.params?.eventId || 1
  const zone = route?.params?.zone || 'STANDARD'
  const dernierScanRef = useRef(null)
  const DELAI_ANTI_DOUBLON = 10000

  const rafraichirTickets = useCallback(async () => {
    setChargeTickets(true)
    setSynchro('chargement')
    try {
      // Nettoie les tickets d'anciens événements AVANT le téléchargement
      // Empêche la faille : résidu de session précédente dans la DB locale
      await nettoyerTicketsHorsEvenement(eventId)
      const nb = await telechargerTickets(eventId, zone)
      setNbTickets(nb)
      setSynchro('ok')
    } catch {
      setSynchro('erreur')
    } finally {
      setChargeTickets(false)
    }
  }, [eventId, zone])

  useFocusEffect(
    useCallback(() => {
      rafraichirTickets().finally(() => setPret(true))
      intervalRef.current = setInterval(rafraichirTickets, INTERVAL_REFRESH)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, [rafraichirTickets])
  )

  useEffect(() => {
    if (synchro !== 'ok') return
    const t = setTimeout(() => setSynchro(null), 3000)
    return () => clearTimeout(t)
  }, [synchro])

  const handleScan = async (donnees) => {
    if (scanne || !pret) return
    // Extraire l'uuid du billet depuis le QR (anti-doublon par billet, pas par chaîne complète)
    let uuid
    try { const p = JSON.parse(typeof donnees === 'string' ? donnees : donnees); uuid = p.uuid } catch { uuid = donnees }
    const maintenant = Date.now()
    if (dernierScanRef.current && dernierScanRef.current.uuid === uuid && (maintenant - dernierScanRef.current.temps) < DELAI_ANTI_DOUBLON) return
    dernierScanRef.current = { uuid, temps: maintenant }
    try {
      const resultat = await verifierBillet(donnees, eventId)
      if (resultat.resultat === 'VALIDE') {
        hapticSuccess()
      } else if (['FRAUDE', 'EXPIRE', 'INCONNU'].includes(resultat.resultat)) {
        hapticError()
      }
      setScanne(resultat)
      synchroniser().catch((e) => console.warn('[Sync] Échec synchronisation post-scan:', e))
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setScanne(null)
        animation.setValue(0)
      })
    } catch (err) {
      setScanne({ resultat: 'ERREUR', message: err.message })
    }
  }

  if (!permission || !permission.granted) {
    return (
      <View style={{flex: 1}}>
        <View style={styles.centre}>
          <Text style={styles.textePermission}>
            {!permission ? "Demande d'accès..." : 'Accès caméra refusé'}
          </Text>
          {permission && !permission.granted && (
            <GlassButton title="Autoriser" icon="camera" onPress={requestPermission} />
          )}
        </View>
      </View>
    )
  }

  if (camError) {
    return (
      <View style={{flex: 1}}>
        <View style={styles.centre}>
          <Text style={styles.textePermission}>Erreur caméra</Text>
          <GlassButton title="Réessayer" icon="refresh" onPress={() => setCamError(null)} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.conteneur}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanne ? undefined : (r) => handleScan(r.data)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay} pointerEvents="box-none">
          <View style={[styles.masqueHaut, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.titre}>Scanner un billet</Text>
          <View style={styles.infoRow}>
            <Text style={styles.info}>{evenementTitre || `Événement #${eventId}`} — {zone}</Text>
            {(chargeTickets || synchro === 'chargement') && (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: scale(8) }} />
            )}
          </View>
          {synchro === 'ok' && nbTickets > 0 && (
            <Text style={styles.syncOk}>{nbTickets} tickets dispo</Text>
          )}
          {synchro === 'erreur' && (
            <Text style={styles.syncError}>Téléchargement impossible — vérifie ta connexion</Text>
          )}
        </View>
        <View style={styles.zoneCadre}>
          <View style={styles.cadre} />
        </View>
      </View>

      {scanne && (
        <View style={[styles.resultat, { backgroundColor: (COULEURS[scanne.resultat] || COULEURS.INCONNU).fond }]}>
          <MaterialCommunityIcons name={(COULEURS[scanne.resultat] || COULEURS.INCONNU).icone} size={scale(64)} color="#fff" />
          <Text style={styles.resultatMessage}>{(COULEURS[scanne.resultat] || COULEURS.INCONNU).label}</Text>
        </View>
      )}
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: colors.bg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: scale(24) },
  textePermission: { fontFamily: fonts.outfit.medium, fontSize: fontScale(16), color: colors.text, textAlign: 'center', marginBottom: scale(16) },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  masqueHaut: { backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: scale(20), alignItems: 'center' },
  titre: { fontFamily: fonts.outfit.bold, fontSize: fontScale(22), color: '#FFFFFF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  info: { fontFamily: fonts.outfit.regular, fontSize: fontScale(13), color: 'rgba(255,255,255,0.8)' },
  syncOk: { fontFamily: fonts.outfit.medium, fontSize: fontScale(12), color: colors.success, marginTop: 4 },
  syncError: { fontFamily: fonts.outfit.medium, fontSize: fontScale(12), color: colors.orange, marginTop: 4 },
  zoneCadre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cadre: { width: scale(250), height: scale(250), borderWidth: scale(2), borderColor: colors.accent, borderRadius: scale(16), opacity: 0.8 },
  resultat: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  resultatMessage: { fontFamily: fonts.outfit.bold, fontSize: fontScale(24), color: '#FFFFFF', marginBottom: scale(8) },
})
