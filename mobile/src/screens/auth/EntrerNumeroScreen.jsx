import { useState } from 'react'
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { envoyerOTP } from '../../services/authService'
import InputTel from '../../components/InputTel'
import BoutonPrincipal from '../../components/BoutonPrincipal'

// Écran de saisie du numéro de téléphone pour recevoir le code OTP
// KeyboardAvoidingView empêche le bouton d'être masqué par le clavier
export default function EntrerNumeroScreen({ navigation }) {
  const [numero, setNumero] = useState(null)
  const [chargement, setChargement] = useState(false)

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
