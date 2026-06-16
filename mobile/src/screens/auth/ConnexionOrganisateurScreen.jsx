// Écran de connexion organisateur (email + mot de passe)
// Vérification via le backend — partagé avec le frontend-web
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Animated, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterOrganisateur } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { hapticMedium, hapticError } from '../../utils/haptics'
import GlassButton from '../../components/GlassButton'
import { colors, spacing } from '../../constants/theme'
import GlassContainer from '../../components/GlassContainer'

export default function ConnexionOrganisateurScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreurValidation, setErreurValidation] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current
  const { connecterOrganisateur: connecter, orgaEmailSuggestion } = useAuth()
  const toast = useToast()

  // Animation de secousse pour indiquer un champ vide
  const secouer = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  // Pré-remplit l'email organisateur suggéré depuis la dernière connexion
  useEffect(() => {
    if (orgaEmailSuggestion && !email) setEmail(orgaEmailSuggestion)
  }, [orgaEmailSuggestion])
  const insets = useSafeAreaInsets()

  // Authentifie l'organisateur via le backend et stocke la session
  // Si email ou mdp vide → feedback visuel immédiat
  // Sinon → spinner + appel API
  const handleConnexion = async () => {
    if (!email || !mdp) {
      hapticError()
      setErreurValidation('Veuillez remplir tous les champs')
      secouer()
      return
    }
    setErreurValidation('')
    hapticMedium()
    setChargement(true)
    try {
      const reponse = await connecterOrganisateur(email, mdp)
      await connecter(reponse.token, reponse.user)
      toast.success('Connexion réussie !')
      navigation.goBack()
    } catch (err) {
      alert(err.message)
    } finally {
      setChargement(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.conteneur, { paddingTop: insets.top + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titre}>Espace organisateur</Text>
          <Text style={styles.sousTitre}>
            Connectez-vous pour gérer vos événements
          </Text>

          {/* Champ email */}
          <Text style={styles.label}>Email</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="exemple@email.com"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          {/* Champ mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={mdp}
              onChangeText={setMdp}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          <View style={{ height: 24 }} />
          {erreurValidation ? (
            <Text style={styles.erreurText}>{erreurValidation}</Text>
          ) : null}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {chargement ? (
              <View style={styles.glassLoadingBtn}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <GlassButton
                title="Se connecter"
                variant="primary"
                onPress={handleConnexion}
              />
            )}
          </Animated.View>

          {/* Lien vers l'inscription organisateur */}
          <View style={styles.inscriptionRow}>
            <Text style={styles.inscriptionText}>Pas encore de compte ?{' '}</Text>
            <GlassButton
              title="S'inscrire"
              variant="ghost"
              onPress={() => navigation.navigate('InscriptionOrganisateur')}
            />
          </View>
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
    flexGrow: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  erreurText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.red,
    marginBottom: 8,
    textAlign: 'center',
  },
  inscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  inscriptionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },

  inputWrap: { marginBottom: 16, borderRadius: 14, height: 56, justifyContent: 'center', paddingHorizontal: 16 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: colors.text,
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
