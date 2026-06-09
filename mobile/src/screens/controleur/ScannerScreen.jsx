// Écran de scan : caméra + vérification offline du QR code
// Télécharge les tickets automatiquement au focus et périodiquement (30s)
// Processus en 5 étapes : lecture QR → parsing → HMAC → recherche locale → statut
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { hapticSuccess, hapticError } from '../../utils/haptics'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { verifierBillet, telechargerTickets, synchroniser } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, textShadow } from '../../constants/theme'
import ControleurLayout from '../../components/ControleurLayout'
import GlassButton from '../../components/GlassButton'

const INTERVAL_REFRESH = 30000

// Couleurs d'affichage selon le résultat du scan (5 statuts possibles)
// Palette or (#D4A574) pour le cadre, vert doux (#6CD4A0) pour VALIDE,
// orange (#E8A868) pour DEJA_UTILISE, rouge (#E86868) pour les erreurs
const COULEURS = {
  VALIDE: { fond: '#6CD4A0', icone: 'check-circle', label: 'Entrée autorisée' },
  DEJA_UTILISE: { fond: '#E8A868', icone: 'alert-circle', label: 'Déjà utilisé' },
  EXPIRE: { fond: '#E86868', icone: 'clock-outline', label: 'Billet expiré' },
  INCONNU: { fond: '#E86868', icone: 'help-circle', label: 'Billet inconnu' },
  FRAUDE: { fond: '#E86868', icone: 'alert-octagon', label: 'FRAUDE suspectée' },
}

export default function ScannerScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanne, setScanne] = useState(null)
  const [pret, setPret] = useState(false)
  const [nbTickets, setNbTickets] = useState(0)
  const [chargeTickets, setChargeTickets] = useState(false)
  const [synchro, setSynchro] = useState(null)
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
      // Échec silencieux — le prochain interval (30s) réessayera
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
    // Anti-doublon : ignore le même QR dans les 10 secondes
    const maintenant = Date.now()
    if (dernierScanRef.current && dernierScanRef.current.donnees === donnees && (maintenant - dernierScanRef.current.temps) < DELAI_ANTI_DOUBLON) return
    dernierScanRef.current = { donnees, temps: maintenant }
    try {
      const resultat = await verifierBillet(donnees)
      // Feedback haptique selon le statut du scan
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
              <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
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
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.text, ...textShadow },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  info: { fontFamily: fonts.outfit.regular, fontSize: 13, color: colors.textSecondary },
  syncOk: { fontFamily: fonts.outfit.medium, fontSize: 12, color: '#22c55e', marginTop: 4 },
  zoneCadre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Cadre de scan doré (#D4A574) pour correspondre à la charte du projet
  cadre: { width: 250, height: 250, borderWidth: 2, borderColor: colors.accent, borderRadius: 16, opacity: 0.8 },
  resultat: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  resultatMessage: { fontFamily: fonts.outfit.bold, fontSize: 24, color: '#FFFFFF', marginBottom: 8 },
  resultatDetail: { fontFamily: fonts.outfit.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 32 },
})
