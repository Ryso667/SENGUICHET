// Écran d'inscription organisateur (nom, téléphone, email, mot de passe)
// Envoie les données au backend — mêmes données partagées avec le frontend-web
import { useState, useMemo } from 'react'
import {
  View, Text, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { inscrireOrganisateur } from '../../services/authService'
import GlassButton from '../../components/GlassButton'
import { colors, spacing, textShadow } from '../../constants/theme'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'

// Calcule le niveau de force du mot de passe (0-4)
// Retourne { score, label, couleur }
const evaluerForceMotDePasse = (mdp) => {
  if (!mdp) return { score: 0, label: '', couleur: colors.muted }
  const len = mdp.length
  if (len <= 3) return { score: 1, label: 'Faible', couleur: colors.red }
  if (len <= 6) return { score: 2, label: 'Moyen', couleur: colors.orange }

  const aMaj = /[A-Z]/.test(mdp)
  const aChiffre = /[0-9]/.test(mdp)
  const aSpecial = /[^A-Za-z0-9]/.test(mdp)
  const criteres = [aMaj, aChiffre, aSpecial].filter(Boolean).length

  if (criteres >= 3) return { score: 4, label: 'Très fort', couleur: colors.green }
  if (criteres >= 1) return { score: 3, label: 'Fort', couleur: '#A3E635' }
  return { score: 2, label: 'Moyen', couleur: colors.orange }
}

// Formate le numéro de téléphone avec l'indicatif +221 et le masque XX XXX XX XX
// Limite à 9 chiffres après l'indicatif
const formatterTelephone = (texte) => {
  const nettoye = texte.replace(/[^0-9]/g, '')
  // Extrait les 12 premiers chiffres max (221 + 9)
  const borne = nettoye.slice(0, 12)
  if (!borne.startsWith('221')) {
    if (borne.length === 0) return '+221 '
    const chiffres = borne.slice(0, 9)
    if (chiffres.length <= 2) return '+221 ' + chiffres
    if (chiffres.length <= 5) return '+221 ' + chiffres.slice(0, 2) + ' ' + chiffres.slice(2)
    return '+221 ' + chiffres.slice(0, 2) + ' ' + chiffres.slice(2, 5) + ' ' + chiffres.slice(5, 7) + ' ' + chiffres.slice(7)
  }
  const chiffres = borne.slice(3, 12)
  if (chiffres.length <= 2) return '+221 ' + chiffres
  if (chiffres.length <= 5) return '+221 ' + chiffres.slice(0, 2) + ' ' + chiffres.slice(2)
  if (chiffres.length <= 8) return '+221 ' + chiffres.slice(0, 2) + ' ' + chiffres.slice(2, 5) + ' ' + chiffres.slice(5)
  return '+221 ' + chiffres.slice(0, 2) + ' ' + chiffres.slice(2, 5) + ' ' + chiffres.slice(5, 7) + ' ' + chiffres.slice(7, 9)
}

export default function InscriptionOrganisateurScreen({ navigation }) {
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('+221 ')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const insets = useSafeAreaInsets()

  const forceMdp = useMemo(() => evaluerForceMotDePasse(mdp), [mdp])
  const mdpNeCorrespondPas = confirmMdp.length > 0 && mdp !== confirmMdp

  // Calcule si le formulaire est valide pour activer/désactiver le bouton
  const formulaireValide = useMemo(() => {
    return (
      nom.trim().length > 0 &&
      telephone.replace(/[\s+]/g, '').length >= 9 &&
      email.includes('@') &&
      mdp.length >= 8 &&
      mdp === confirmMdp
    )
  }, [nom, telephone, email, mdp, confirmMdp])

  // Soumet l'inscription — appelle authService.inscrireOrganisateur
  const handleInscription = async () => {
    // Validation détaillée avant soumission
    if (!nom.trim()) {
      Alert.alert('Champ requis', 'Le nom est obligatoire.')
      return
    }
    const telChiffres = telephone.replace(/[^0-9]/g, '')
    if (telChiffres.length < 10) {
      Alert.alert('Téléphone invalide', 'Le numéro doit être au format +221 XX XXX XX XX.')
      return
    }
    if (!email.includes('@')) {
      Alert.alert('Email invalide', 'Veuillez saisir un email valide.')
      return
    }
    if (mdp.length < 8) {
      Alert.alert('Mot de passe trop court', 'Minimum 8 caractères.')
      return
    }
    if (mdp !== confirmMdp) {
      Alert.alert('Mots de passe différents', 'Les deux mots de passe doivent correspondre.')
      return
    }

    setChargement(true)
    try {
      await inscrireOrganisateur({
        nom: nom.trim(),
        telephone: telephone.replace(/\s/g, ''),
        email: email.trim().toLowerCase(),
        motDePasse: mdp,
      })
      await AsyncStorage.setItem('@senguichet_orga_email_suggestion', email.trim().toLowerCase())
      navigation.navigate('ConnexionOrganisateur')
    } catch (err) {
      Alert.alert('Erreur', err?.message || "L'inscription a échoué. Réessaie.")
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

          <Text style={styles.titre}>Créer un compte organisateur</Text>
          <Text style={styles.sousTitre}>
            Inscris-toi pour gérer tes événements
          </Text>

          {/* Champ Nom */}
          <Text style={styles.label}>Nom</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ton nom"
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="words"
            />
          </GlassContainer>

          {/* Champ Téléphone */}
          <Text style={styles.label}>Téléphone</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={(t) => setTelephone(formatterTelephone(t))}
              keyboardType="phone-pad"
              placeholder="+221 XX XXX XX XX"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </GlassContainer>

          {/* Champ Email */}
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

          {/* Champ Mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={mdp}
              onChangeText={setMdp}
              secureTextEntry
              placeholder="Minimum 8 caractères"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </GlassContainer>

          {/* Indicateur de force du mot de passe */}
          {mdp.length > 0 && (
            <View style={styles.forceConteneur}>
              <View style={styles.barreGroupe}>
                {[1, 2, 3, 4].map((n) => (
                  <View
                    key={n}
                    style={[
                      styles.barreForce,
                      { backgroundColor: n <= forceMdp.score ? forceMdp.couleur : 'rgba(255,255,255,0.2)' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.forceLabel, { color: forceMdp.couleur }]}>
                {forceMdp.label}
              </Text>
            </View>
          )}

          {/* Champ Confirmer le mot de passe */}
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <GlassContainer style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={confirmMdp}
              onChangeText={setConfirmMdp}
              secureTextEntry
              placeholder="Retaper le mot de passe"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </GlassContainer>

          {/* Message d'erreur si les mots de passe ne correspondent pas */}
          {mdpNeCorrespondPas && (
            <Text style={styles.erreurText}>Les mots de passe ne correspondent pas</Text>
          )}

          <View style={{ height: 24 }} />
          {chargement ? (
            <View style={styles.glassLoadingBtn}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <GlassButton
              title="S'inscrire"
              onPress={!formulaireValide ? undefined : handleInscription}
              style={!formulaireValide ? { opacity: 0.5 } : undefined}
            />
          )}

          {/* Lien vers la connexion */}
          <View style={styles.lienConnexion}>
            <Text style={styles.lienConnexionText}>
              Déjà un compte ?{' '}
            </Text>
            <GlassButton
              title="Se connecter"
              onPress={() => navigation.navigate('ConnexionOrganisateur')}
              style={styles.lienConnexionBtn}
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
    paddingBottom: 40,
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
  inputWrap: { marginBottom: 16, borderRadius: 14, height: 56, justifyContent: 'center', paddingHorizontal: 16 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#fff',
  },
  forceConteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  barreGroupe: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  barreForce: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  forceLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    marginLeft: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  erreurText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.red,
    marginTop: -12,
    marginBottom: 16,
  },
  lienConnexion: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  lienConnexionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  lienConnexionBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: undefined,
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
