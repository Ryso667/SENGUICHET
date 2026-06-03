// Écran de connexion organisateur (email + mot de passe)
// En mode démo, n'importe quel email/mdp fonctionne
import { useState } from 'react'
import {
  View, Text, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { connecterOrganisateur } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import GlassButton from '../../components/GlassButton'
import { colors, spacing, textShadow } from '../../constants/theme'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'

export default function ConnexionOrganisateurScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const { connecterOrganisateur: connecter } = useAuth()
  const insets = useSafeAreaInsets()

  // Authentifie l'organisateur et stocke la session
  // En mode démo, n'importe quel email/mdp fonctionne (cf. authService.connecterOrganisateur)
  const handleConnexion = async () => {
    if (!email || !mdp) return
    setChargement(true)
    try {
      const reponse = await connecterOrganisateur(email, mdp)
      await connecter(reponse.token, reponse.user)
    } catch (err) {
      alert(err?.message || 'Email ou mot de passe incorrect')
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
          {/* Bouton retour verre dépoli */}
          <GlassButton
            title="Retour"
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            style={styles.retour}
          />

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
              placeholderTextColor="rgba(255,255,255,0.5)"
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
              placeholderTextColor="rgba(255,255,255,0.5)"
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
  retour: {
    marginBottom: 24,
    alignSelf: 'flex-start',
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
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
    color: 'rgba(255,255,255,0.6)',
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
    color: '#fff',
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
