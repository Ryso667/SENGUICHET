import { useState } from 'react'
import {
  View, Text, TextInput, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { connecterOrganisateur } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors } from '../../constants/theme'

// Écran de connexion pour les organisateurs (email + mot de passe)
// En mode démo, n'importe quel email/mdp fonctionne et retourne un JWT factice
export default function ConnexionOrganisateurScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const { connecterOrganisateur: connecter } = useAuth()

  const handleConnexion = async () => {
    if (!email || !mdp) return
    setChargement(true)
    try {
      const reponse = await connecterOrganisateur(email, mdp)
      await connecter(reponse.token, email)
    } catch {
      alert('Email ou mot de passe incorrect')
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
          {/* Bouton retour */}
          <Text style={styles.retour} onPress={() => navigation.goBack()}>
            ← Retour
          </Text>

          <Text style={styles.titre}>Espace organisateur</Text>
          <Text style={styles.sousTitre}>
            Connectez-vous pour gérer vos événements
          </Text>

          {/* Champ email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="exemple@email.com"
            placeholderTextColor={colors.muted}
          />

          {/* Champ mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={mdp}
            onChangeText={setMdp}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />

          <View style={{ height: 24 }} />
          <BoutonPrincipal
            titre="Se connecter"
            chargement={chargement}
            desactive={!email || !mdp}
            onPress={handleConnexion}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
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
    color: colors.accent,
    marginBottom: 24,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.slate,
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.mid,
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: colors.slate,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: colors.slate,
    marginBottom: 16,
  },
})
