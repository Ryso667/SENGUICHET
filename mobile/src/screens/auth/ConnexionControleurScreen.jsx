// Écran de connexion contrôleur
// Saisie d'un code d'accès à 4 chiffres (généré par l'organisateur)
// Déverrouille le mode scan une fois le code validé
import { useState } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterControleur as apiConnecterControleur } from '../../services/authService'
import InputOTP from '../../components/InputOTP'
import GlassButton from '../../components/GlassButton'
import { useAuth } from '../../context/AuthContext'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'
import { spacing, textShadow } from '../../constants/theme'

export default function ConnexionControleurScreen({ navigation }) {
  const { connecterControleur } = useAuth()
  const [codeAcces, setCodeAcces] = useState('')
  const [chargement, setChargement] = useState(false)
  const insets = useSafeAreaInsets()

  // Valide le code 4 chiffres et stocke la session contrôleur
  // Le code est vérifié par le backend contre la table code_controleur
  const handleConnecter = async () => {
    if (codeAcces.length !== 4) return
    setChargement(true)
    try {
      const result = await apiConnecterControleur(codeAcces)
      await connecterControleur(result.token, result.user)
    } catch {
      alert("Code d'accès invalide")
    } finally {
      setChargement(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BlurBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.conteneur, { paddingTop: insets.top + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titre}>Accès Contrôleur</Text>
          <Text style={styles.sousTitre}>
            Saisissez votre code d'accès à 4 chiffres
          </Text>

          {/* Champ 4 chiffres (réutilise InputOTP avec longueur réduite) */}
          <InputOTP longueur={4} onComplet={setCodeAcces} />

          <View style={styles.espace} />

          {chargement ? (
            <View style={styles.glassLoadingBtn}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <GlassButton
              title="Se connecter"
              onPress={codeAcces.length !== 4 ? undefined : handleConnecter}
              style={codeAcces.length !== 4 ? { opacity: 0.5 } : undefined}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
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
    color: '#fff',
    marginBottom: 8,
    ...textShadow,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
  },
  espace: {
    height: 24,
  },
  glassLoadingBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
})
