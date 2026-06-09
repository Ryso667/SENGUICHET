// Écran de scan : caméra + vérification offline du QR code
// Télécharge les tickets automatiquement au focus et périodiquement (30s)
// Processus en 5 étapes : lecture QR → parsing → HMAC → recherche locale → statut
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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
const COULEURS = {
  VALIDE: { fond: '#22c55e', icone: 'check-circle', label: 'Entrée autorisée' },
  DEJA_UTILISE: { fond: '#f97316', icone: 'alert-circle', label: 'Déjà utilisé' },
  EXPIRE: { fond: '#FF4D6D', icone: 'clock-outline', label: 'Billet expiré' },
  INCONNU: { fond: '#b91c1c', icone: 'help-circle', label: 'Billet inconnu' },
  FRAUDE: { fond: '#dc2626', icone: 'alert-octagon', label: 'FRAUDE suspectée' },
}

export default function ScannerScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanne, setScanne] = useState(null)
  const [pret, setPret] = useState(false)
  const [nbTickets, setNbTickets] = useState(0)
  const [chargeTickets, setChargeTickets] = useState(false)
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
    try {
      const nb = await telechargerTickets(eventId, zone)
      setNbTickets(nb)
    } catch {
      // Échec silencieux — le prochain polling (30s) réessaiera
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

  const handleScan = async (donnees) => {
    if (scanne || !pret) return
    // Anti-doublon : ignore le même QR dans les 10 secondes
    const maintenant = Date.now()
    if (dernierScanRef.current && dernierScanRef.current.donnees === donnees && (maintenant - dernierScanRef.current.temps) < DELAI_ANTI_DOUBLON) return
    dernierScanRef.current = { donnees, temps: maintenant }
    try {
      const resultat = await verifierBillet(donnees)
      setScanne(resultat)
      synchroniser().catch(() => {})
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
            <Text style={styles.info}>{evenementTitre || `Événement #${eventId}`}</Text>
            {chargeTickets && (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
            )}
          </View>
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
  conteneur: { flex: 1 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  textePermission: { fontFamily: fonts.outfit.medium, fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: 16 },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  masqueHaut: { backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: 20, alignItems: 'center' },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.text, ...textShadow },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  info: { fontFamily: fonts.outfit.regular, fontSize: 13, color: colors.textSecondary },
  zoneCadre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cadre: { width: 250, height: 250, borderWidth: 2, borderColor: '#22c55e', borderRadius: 16, opacity: 0.8 },
  resultat: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  resultatMessage: { fontFamily: fonts.outfit.bold, fontSize: 24, color: '#FFFFFF', marginBottom: 8 },
  resultatDetail: { fontFamily: fonts.outfit.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 32 },
})
