// Écran de connexion contrôleur
// Saisie d'un code d'accès à 4 chiffres (généré par l'organisateur)
// Validation automatique dès les 4 chiffres saisis
import { useState, useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterControleur as apiConnecterControleur } from '../../services/authService'
import { useToast } from '../../context/ToastContext'
import { hapticLight } from '../../utils/haptics'
import InputOTP from '../../components/InputOTP'
import { useAuth } from '../../context/AuthContext'
import { spacing, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function ConnexionControleurScreen({ navigation }) {
  const { colors } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  const { connecterControleur } = useAuth()
  const toast = useToast()
  const [chargement, setChargement] = useState(false)
  const insets = useSafeAreaInsets()
  const otpRef = useRef(null)

  // Valide le code 4 chiffres et stocke la session contrôleur
  // Appelée automatiquement par InputOTP quand les 4 cases sont remplies
  const handleConnecter = async (code) => {
    if (code.length !== 4) return
    setChargement(true)
    try {
      const result = await apiConnecterControleur(code)
      if (!result?.token) throw new Error('Réponse API invalide')
      await connecterControleur(result.token, result.user)
      toast.success('Accès contrôleur activé')
    } catch (e) {
      console.error('Erreur connexion controleur:', e.message)
      toast.error(e.message || "Code d'accès invalide")
      otpRef.current?.reinitialiser()
    } finally {
      setChargement(false)
    }
  }

  // Déclenche la validation automatique dès que les 4 chiffres sont saisis
  const handleCodeComplet = (code) => {
    hapticLight()
    handleConnecter(code)
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

          <InputOTP
            ref={otpRef}
            longueur={4}
            autoFocus
            onComplet={handleCodeComplet}
          />

          {chargement && (
            <View style={[s.glassLoadingBtn, { marginTop: 24 }]}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
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
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: colors.text,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: fonts.outfit.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
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