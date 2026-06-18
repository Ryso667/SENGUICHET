// Écran d'inscription organisateur (nom, téléphone, email, mot de passe)
// Envoie les données au backend — mêmes données partagées avec le frontend-web
import { useState, useMemo } from 'react'
import {
  View, Text, TextInput, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { inscrireOrganisateur } from '../../services/authService'
import { hapticMedium } from '../../utils/haptics'
import GlassButton from '../../components/GlassButton'
import { spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import GlassContainer from '../../components/GlassContainer'

// Calcule le niveau de force du mot de passe (0-4)
// Retourne { score, label, couleur }
const evaluerForceMotDePasse = (colors) => (mdp) => {
  if (!mdp) return { score: 0, label: '', couleur: colors.textSecondary }
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
  const { colors } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  const [telephone, setTelephone] = useState('+221 ')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const insets = useSafeAreaInsets()

  const forceMdp = useMemo(() => evaluerForceMotDePasse(colors)(mdp), [mdp, colors])
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

    hapticMedium()
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[s.conteneur, { paddingTop: insets.top + spacing.lg, paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.titre}>Créer un compte organisateur</Text>
          <Text style={s.sousTitre}>
            Inscris-toi pour gérer tes événements
          </Text>

          {/* Champ Nom */}
          <Text style={s.label}>Nom</Text>
          <GlassContainer style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ton nom"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </GlassContainer>

          {/* Champ Téléphone */}
          <Text style={s.label}>Téléphone</Text>
          <GlassContainer style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={telephone}
              onChangeText={(t) => setTelephone(formatterTelephone(t))}
              keyboardType="phone-pad"
              placeholder="+221 XX XXX XX XX"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          {/* Champ Email */}
          <Text style={s.label}>Email</Text>
          <GlassContainer style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="exemple@email.com"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          {/* Champ Mot de passe */}
          <Text style={s.label}>Mot de passe</Text>
          <GlassContainer style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={mdp}
              onChangeText={setMdp}
              secureTextEntry
              placeholder="Minimum 8 caractères"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          {/* Indicateur de force du mot de passe */}
          {mdp.length > 0 && (
            <View style={s.forceConteneur}>
              <View style={s.barreGroupe}>
                {[1, 2, 3, 4].map((n) => (
                  <View
                    key={n}
                    style={[
                      s.barreForce,
                      { backgroundColor: n <= forceMdp.score ? forceMdp.couleur : 'rgba(0,0,0,0.08)' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[s.forceLabel, { color: forceMdp.couleur }]}>
                {forceMdp.label}
              </Text>
            </View>
          )}

          {/* Champ Confirmer le mot de passe */}
          <Text style={s.label}>Confirmer le mot de passe</Text>
          <GlassContainer style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={confirmMdp}
              onChangeText={setConfirmMdp}
              secureTextEntry
              placeholder="Retaper le mot de passe"
              placeholderTextColor={colors.textTertiary}
            />
          </GlassContainer>

          {/* Message d'erreur si les mots de passe ne correspondent pas */}
          {mdpNeCorrespondPas && (
            <Text style={s.erreurText}>Les mots de passe ne correspondent pas</Text>
          )}

          <View style={{ height: 24 }} />
          {chargement ? (
            <View style={s.glassLoadingBtn}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={s.glassLoadingText}>Inscription en cours...</Text>
            </View>
          ) : (
            <GlassButton
              title="S'inscrire"
              variant="primary"
              onPress={!formulaireValide ? undefined : handleInscription}
              style={!formulaireValide ? { opacity: 0.5 } : undefined}
            />
          )}

          {/* Lien vers la connexion */}
          <View style={s.lienConnexion}>
            <Text style={s.lienConnexionText}>
              Déjà un compte ?{' '}
            </Text>
            <GlassButton
              title="Se connecter"
              variant="ghost"
              onPress={() => navigation.navigate('ConnexionOrganisateur')}
            />
          </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  retour: {
    marginBottom: 24,
    alignSelf: 'flex-start',
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
  inputWrap: { marginBottom: 16, borderRadius: 14, height: 56, justifyContent: 'center', paddingHorizontal: 16 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: colors.text,
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
    color: colors.textSecondary,
  },
  glassLoadingBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  glassLoadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
})
