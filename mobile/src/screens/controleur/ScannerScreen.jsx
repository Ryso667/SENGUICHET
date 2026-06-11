// Écran de scan : caméra + vérification offline du QR code
// Télécharge les tickets automatiquement au focus et périodiquement (30s)
// Utilise le barcode natif avec fallback silencieux
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { hapticSuccess, hapticError } from '../../utils/haptics'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { verifierBillet, telechargerTickets, synchroniser } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts } from '../../constants/theme'
import ControleurLayout from '../../components/ControleurLayout'
import GlassButton from '../../components/GlassButton'

const INTERVAL_REFRESH = 30000

const COULEURS = {
  VALIDE: { fond: '#66BB6A', icone: 'check-circle', label: 'Entrée autorisée' },
  DEJA_UTILISE: { fond: '#FFA726', icone: 'alert-circle', label: 'Déjà utilisé' },
  EXPIRE: { fond: '#FF4D6D', icone: 'clock-outline', label: 'Billet expiré' },
  INCONNU: { fond: '#FF4D6D', icone: 'help-circle', label: 'Billet inconnu' },
  FRAUDE: { fond: '#FF4D6D', icone: 'alert-octagon', label: 'FRAUDE suspectée' },
}

export default function ScannerScreen({ navigation, route }) {
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
      const nb = await telechargerTickets(eventId, zone)
      setNbTickets(nb)
      setSynchro('ok')
    } catch {
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
      const resultat = await verifierBillet(donnees)
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
        <ControleurLayout />
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
        <ControleurLayout />
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
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />
            )}
          </View>
          {synchro === 'ok' && nbTickets > 0 && (
            <Text style={styles.syncOk}>{nbTickets} tickets dispo</Text>
          )}
        </View>
        <View style={styles.zoneCadre}>
          <View style={styles.cadre} />
        </View>
      </View>

      {scanne && (
        <View style={[styles.resultat, { backgroundColor: (COULEURS[scanne.resultat] || COULEURS.INCONNU).fond }]}>
          <MaterialCommunityIcons name={(COULEURS[scanne.resultat] || COULEURS.INCONNU).icone} size={64} color="#fff" />
          <Text style={styles.resultatMessage}>{(COULEURS[scanne.resultat] || COULEURS.INCONNU).label}</Text>
          {scanne.message && <Text style={styles.resultatDetail}>{scanne.message}</Text>}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: colors.bg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  textePermission: { fontFamily: fonts.outfit.medium, fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: 16 },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  masqueHaut: { backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: 20, alignItems: 'center' },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: '#FFFFFF' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  info: { fontFamily: fonts.outfit.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  syncOk: { fontFamily: fonts.outfit.medium, fontSize: 12, color: colors.success, marginTop: 4 },
  zoneCadre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cadre: { width: 250, height: 250, borderWidth: 2, borderColor: colors.accent, borderRadius: 16, opacity: 0.8 },
  resultat: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  resultatMessage: { fontFamily: fonts.outfit.bold, fontSize: 24, color: '#FFFFFF', marginBottom: 8 },
  resultatDetail: { fontFamily: fonts.outfit.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 32 },
})
