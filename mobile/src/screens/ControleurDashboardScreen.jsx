// Dashboard contrôleur : page d'accueil après connexion du contrôleur
// Affiche les infos de session et permet la déconnexion
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import BlurBackground from '../components/BlurBackground'
import GlassButton from '../components/GlassButton'
import { textShadow } from '../constants/theme'
export default function ControleurDashboardScreen() {
  const { deconnecter } = useAuth()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.safe}>
      <BlurBackground category="Concert" />
      <View style={[styles.conteneur, { paddingTop: insets.top }]}>
        <Feather name="shield" size={48} color="#FFFFFF" />
        <Text style={styles.titre}>Mode Contrôleur</Text>
        <Text style={styles.sousTitre}>Connecté avec succès</Text>

        <GlassButton title="Déconnexion" icon="log-out" onPress={deconnecter} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    ...textShadow,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
})
