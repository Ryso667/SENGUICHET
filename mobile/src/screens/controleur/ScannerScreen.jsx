// Écran de scan : caméra + vérification offline du QR code
// Processus en 5 étapes : lecture QR → parsing → HMAC → recherche locale → statut
import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { verifierBillet, telechargerTickets, getStats } from '../../services/scanService'
import { useAuth } from '../../context/AuthContext'
import BlurBackground from '../../components/BlurBackground'
import GlassButton from '../../components/GlassButton'
import { textShadow } from '../../constants/theme'

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
  const { evenementId } = useAuth()
  const animation = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()

  const eventId = evenementId || route?.params?.eventId || 1
  const zone = route?.params?.zone || 'STANDARD'

  // Au montage : télécharge les tickets dans SQLite locale si la base est vide
  // Sera remplacé par API : téléchargement automatique via le backend
  useEffect(() => {
    preparerScan()
  }, [])

  const preparerScan = async () => {
    try {
      const stats = await getStats()
      if (stats.ticketsLocaux === 0) {
        const nb = await telechargerTickets(eventId, zone)
        if (nb > 0) console.log(`${nb} tickets téléchargés`)
      }
    } catch {
    } finally {
      setPret(true)
    }
  }

  // Callback déclenché quand un QR code est détecté par la caméra
  // Lance la vérification offline (5 étapes) puis affiche le résultat 3 secondes
  const handleScan = async (donnees) => {
    if (scanne || !pret) return
    try {
      const resultat = await verifierBillet(donnees)
      setScanne(resultat)

      // Animation : affiche le résultat 3 secondes puis reset automatique
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

  // État : permission caméra pas encore accordée → demande
  // Sera remplacé par une UI plus riche avec explication du besoin
  if (!permission || !permission.granted) {
    return (
      <View style={{flex: 1}}>
        <BlurBackground category="Concert" />
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
      {/* Vue caméra avec détection de QR code intégrée */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanne ? undefined : (r) => handleScan(r.data)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      {/* Overlay positionné en absolu : masque semi-transparent avec cadre de scan central */}
        <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.masqueHaut, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.titre}>Scanner un billet</Text>
          <Text style={styles.info}>{zone} — Événement #{eventId}</Text>
        </View>
        <View style={styles.zoneCadre}>
          <View style={styles.cadre} />
          {!pret && <Text style={styles.chargement}>Préparation...</Text>}
        </View>
      </View>

      {/* Résultat du scan : superposition pleine écran colorée avec animation
          Chaque statut a sa propre couleur (vert = VALIDE, rouge = erreur, orange = déjà utilisé) */}
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
  textePermission: { fontFamily: 'Outfit_500Medium', fontSize: 16, color: '#FFFFFF', textAlign: 'center', marginBottom: 16 },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  masqueHaut: { backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: 20, alignItems: 'center' },
  titre: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFFFFF', ...textShadow },
  info: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#94a3b8', marginTop: 4 },
  zoneCadre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cadre: { width: 250, height: 250, borderWidth: 2, borderColor: '#22c55e', borderRadius: 16, opacity: 0.8 },
  chargement: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: '#fbbf24', marginTop: 16 },
  bouton: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#00C8FF', borderRadius: 12 },
  boutonTexte: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  resultat: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  resultatIcone: { marginBottom: 16 },
  resultatMessage: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 8 },
  resultatDetail: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 32 },
})
