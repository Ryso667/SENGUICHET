// Écran de connexion organisateur (email + mot de passe)
// Vérification via le backend — partagé avec le frontend-web
import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterOrganisateur } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { hapticMedium } from '../../utils/haptics'
import GlassButton from '../../components/GlassButton'
import { colors, spacing } from '../../constants/theme'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'

export default function ConnexionOrganisateurScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const { connecterOrganisateur: connecter, orgaEmailSuggestion } = useAuth()

  // Pré-remplit l'email organisateur suggéré depuis la dernière connexion
  useEffect(() => {
    if (orgaEmailSuggestion && !email) setEmail(orgaEmailSuggestion)
  }, [orgaEmailSuggestion])
  const insets = useSafeAreaInsets()

  // Authentifie l'organisateur via le backend et stocke la session
  // Déclenche un feedback haptique moyen pour confirmer l'action
  const handleConnexion = async () => {
    if (!email || !mdp) return
    hapticMedium()
    setChargement(true)
    try {
      const reponse = await connecterOrganisateur(email, mdp)
      await connecter(reponse.token, reponse.user)
    } catch (err) {
      alert(err.message)
    } finally {
      setChargement(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BlurBackground />
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
          {chargement ? (
            <View style={styles.glassLoadingBtn}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <GlassButton
              title="Se connecter"
              onPress={!email || !mdp ? undefined : handleConnexion}
              style={!email || !mdp ? { opacity: 0.5 } : undefined}
            />
          )}

          {/* Lien vers l'inscription organisateur */}
          <View style={styles.inscriptionRow}>
            <Text style={styles.inscriptionText}>Pas encore de compte ?{' '}</Text>
            <GlassButton
              title="S'inscrire"
              onPress={() => navigation.navigate('InscriptionOrganisateur')}
              style={styles.inscriptionLink}
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
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.textWhite,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.textWhiteMuted,
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: colors.textWhite,
    marginBottom: 6,
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
    color: colors.textWhiteMuted,
  },
  inscriptionLink: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: undefined,
  },
  inputWrap: { marginBottom: 16, borderRadius: 14, height: 56, justifyContent: 'center', paddingHorizontal: 16 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: colors.textWhite,
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
