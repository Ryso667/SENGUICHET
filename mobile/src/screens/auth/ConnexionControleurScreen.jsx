// Écran de connexion contrôleur
// Saisie d'un code d'accès à 4 chiffres (généré par l'organisateur)
// Déverrouille le mode scan une fois le code validé
import { useState } from 'react'
import {
  View, Text, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connecterControleur as apiConnecterControleur } from '../../services/authService'
import InputOTP from '../../components/InputOTP'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { useAuth } from '../../context/AuthContext'

export default function ConnexionControleurScreen({ navigation }) {
  const { connecterControleur } = useAuth()
  const [codeAcces, setCodeAcces] = useState('')
  const [chargement, setChargement] = useState(false)

  // Valide le code 4 chiffres et stocke la session contrôleur
  // En mode démo, le service accepte n'importe quel code (cf. authService.connecterControleur)
  const handleConnecter = async () => {
    if (codeAcces.length !== 4) return
    setChargement(true)
    try {
      const result = await apiConnecterControleur(codeAcces)
      await connecterControleur(result.token)
    } catch {
      alert("Code d'accès invalide")
    } finally {
      setChargement(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteneur}
          keyboardShouldPersistTaps="handled"
        >
          {/* Retour vers l'écran d'accueil */}
          <Text style={styles.retour} onPress={() => navigation.navigate('AccueilChoix')}>
            ← Retour
          </Text>

          <Text style={styles.titre}>Accès Contrôleur</Text>
          <Text style={styles.sousTitre}>
            Saisissez votre code d'accès à 4 chiffres
          </Text>

          {/* Champ 4 chiffres (réutilise InputOTP avec longueur réduite) */}
          <InputOTP longueur={4} onComplet={setCodeAcces} />

          <View style={styles.espace} />

          <BoutonPrincipal
            titre="Se connecter"
            chargement={chargement}
            desactive={codeAcces.length !== 4}
            onPress={handleConnecter}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  flex: {
    flex: 1,
  },
  conteneur: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  retour: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#6366F1',
    marginBottom: 16,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#0f172a',
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 32,
  },
  espace: {
    height: 24,
  },
})
