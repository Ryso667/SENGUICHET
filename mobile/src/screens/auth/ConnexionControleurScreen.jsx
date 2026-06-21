// Écran de connexion contrôleur
// Saisie d'un code d'accès à 4 chiffres (généré par l'organisateur)
// Déverrouille le mode scan une fois le code validé
import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterControleur as apiConnecterControleur } from '../../services/authService'
import { useToast } from '../../context/ToastContext'
import { hapticLight } from '../../utils/haptics'
import InputOTP from '../../components/InputOTP'
import GlassButton from '../../components/GlassButton'
import { useAuth } from '../../context/AuthContext'
import { spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function ConnexionControleurScreen({ navigation }) {
  const { colors } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  const { connecterControleur } = useAuth()
  const toast = useToast()
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
      toast.success('Accès contrôleur activé')
    } catch (e) {
      console.error('Erreur connexion controleur:', e.message)
      alert(e.message || "Code d'accès invalide")
    } finally {
      setChargement(false)
    }
  }

  // Déclenche un retour haptique léger quand les 4 chiffres sont saisis
  const handleCodeComplet = (code) => {
    hapticLight()
    setCodeAcces(code)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.conteneur, { paddingTop: insets.top + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.titre}>Accès Contrôleur</Text>
          <Text style={s.sousTitre}>
            Saisissez votre code d'accès à 4 chiffres
          </Text>

          {/* Champ 4 chiffres (réutilise InputOTP avec longueur réduite) */}
          <InputOTP longueur={4} onComplet={handleCodeComplet} />

          <View style={s.espace} />

          {chargement ? (
            <View style={s.glassLoadingBtn}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <GlassButton
              title="Se connecter"
              variant="primary"
              onPress={handleConnecter}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteneur: {
    flexGrow: 0,
    paddingHorizontal: 24,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.text,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
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
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
})
