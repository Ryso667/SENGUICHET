import { useState } from 'react'
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { connecterControleur as apiConnecterControleur } from '../../services/authService'
import InputOTP from '../../components/InputOTP'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { useAuth } from '../../context/AuthContext'

// Écran de connexion contrôleur via code d'accès à 4 chiffres
export default function ConnexionControleurScreen({ navigation }) {
  const { connecterControleur } = useAuth()
  const [codeAcces, setCodeAcces] = useState('')
  const [chargement, setChargement] = useState(false)

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
          <Text style={styles.titre}>Accès Contrôleur</Text>
          <Text style={styles.sousTitre}>
            Saisissez votre code d'accès à 4 chiffres
          </Text>

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
