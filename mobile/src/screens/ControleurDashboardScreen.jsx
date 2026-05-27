// Dashboard contrôleur : page d'accueil après connexion du contrôleur
// Affiche les infos de session et permet la déconnexion
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
export default function ControleurDashboardScreen() {
  const { deconnecter } = useAuth()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.conteneur}>
        <Feather name="shield" size={48} color="#6366F1" />
        <Text style={styles.titre}>Mode Contrôleur</Text>
        <Text style={styles.sousTitre}>Connecté avec succès</Text>

        <TouchableOpacity style={styles.bouton} onPress={deconnecter}>
          <Feather name="log-out" size={18} color="#FFFFFF" />
          <Text style={styles.texteBouton}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fc',
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
    color: '#0f172a',
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
  },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  texteBouton: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
})
