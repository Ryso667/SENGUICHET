// Écran de saisie du numéro de téléphone pour recevoir le code OTP (acheteur)
// Format : +221 XX XXX XX XX (indicatif Sénégal + 9 chiffres)
import { useState } from 'react'
import {
  View, Text, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { envoyerOTP } from '../../services/authService'
import InputTel from '../../components/InputTel'
import BoutonPrincipal from '../../components/BoutonPrincipal'

export default function EntrerNumeroScreen({ navigation }) {
  const [numero, setNumero] = useState(null)
  const [chargement, setChargement] = useState(false)

  // Envoie la demande OTP puis navigue vers l'écran de validation
  // En mode démo, le code stocké est toujours '123456' (cf. authService.envoyerOTP)
  const handleEnvoyer = async () => {
    if (!numero) return
    setChargement(true)
    try {
      const telComplet = `+221${numero}`
      await envoyerOTP(telComplet)
      navigation.navigate('EntrerOTP', { numeroTel: telComplet })
    } catch {
      alert("Erreur lors de l'envoi du code")
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

          <Text style={styles.logo}>SENGUICHET</Text>
          <Text style={styles.titre}>Entrez votre numéro</Text>
          <Text style={styles.sousTitre}>
            Saisissez votre numéro pour recevoir un code de validation
          </Text>

          <InputTel onValide={setNumero} />

          <View style={styles.espace} />

          <BoutonPrincipal
            titre="Recevoir le code"
            chargement={chargement}
            desactive={!numero}
            onPress={handleEnvoyer}
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
  logo: {
    fontFamily: 'Outfit_900Black',
    fontSize: 28,
    color: '#6366F1',
    textAlign: 'center',
    marginBottom: 40,
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
    marginBottom: 24,
  },
  espace: {
    height: 24,
  },
})
