// Écran d'inscription organisateur (nom, téléphone, email, mot de passe)
// Permet de créer un compte organisateur — en mode mock, retourne un statut "en_attente"
import { useState, useMemo } from 'react'
import {
  View, Text, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { inscrireOrganisateur } from '../../services/authService'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors } from '../../constants/theme'

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
const formatterTelephone = (texte) => {
  const nettoye = texte.replace(/[^0-9]/g, '')
  if (!nettoye.startsWith('221')) {
    // Si l'utilisateur efface le début, on remet +221
    if (nettoye.length === 0) return '+221 '
    return '+221 ' + nettoye.slice(0, 9)
  }
  const chiffres = nettoye.slice(3, 12)
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

  const forceMdp = useMemo(() => evaluerForceMotDePasse(mdp), [mdp])
  const mdpNeCorrespondPas = confirmMdp.length > 0 && mdp !== confirmMdp

  // Calcule si le formulaire est valide pour activer/désactiver le bouton
  const formulaireValide = useMemo(() => {
    return (
      nom.trim().length > 0 &&
      telephone.replace(/[\s+]/g, '').length >= 9 &&
      email.includes('@') &&
      mdp.length >= 6 &&
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
    if (mdp.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.')
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
      navigation.navigate('EnAttenteValidation')
    } catch (err) {
      Alert.alert('Erreur', err?.message || "L'inscription a échoué. Réessaie.")
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

          <Text style={styles.titre}>Créer un compte organisateur</Text>
          <Text style={styles.sousTitre}>
            Inscris-toi pour gérer tes événements
          </Text>

          {/* Champ Nom */}
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={nom}
            onChangeText={setNom}
            placeholder="Ton nom"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />

          {/* Champ Téléphone */}
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={telephone}
            onChangeText={(t) => setTelephone(formatterTelephone(t))}
            keyboardType="phone-pad"
            placeholder="+221 XX XXX XX XX"
            placeholderTextColor={colors.muted}
          />

          {/* Champ Email */}
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

          {/* Champ Mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={mdp}
            onChangeText={setMdp}
            secureTextEntry
            placeholder="Minimum 6 caractères"
            placeholderTextColor={colors.muted}
          />

          {/* Indicateur de force du mot de passe */}
          {mdp.length > 0 && (
            <View style={styles.forceConteneur}>
              <View style={styles.barreGroupe}>
                {[1, 2, 3, 4].map((n) => (
                  <View
                    key={n}
                    style={[
                      styles.barreForce,
                      { backgroundColor: n <= forceMdp.score ? forceMdp.couleur : colors.border },
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
          <TextInput
            style={styles.input}
            value={confirmMdp}
            onChangeText={setConfirmMdp}
            secureTextEntry
            placeholder="Retaper le mot de passe"
            placeholderTextColor={colors.muted}
          />

          {/* Message d'erreur si les mots de passe ne correspondent pas */}
          {mdpNeCorrespondPas && (
            <Text style={styles.erreurText}>Les mots de passe ne correspondent pas</Text>
          )}

          <View style={{ height: 24 }} />
          <BoutonPrincipal
            titre="S'inscrire"
            chargement={chargement}
            desactive={!formulaireValide}
            onPress={handleInscription}
          />

          {/* Lien vers la connexion */}
          <Text style={styles.lienConnexion}>
            Déjà un compte ?{' '}
            <Text
              style={styles.lienConnexionAccent}
              onPress={() => navigation.navigate('ConnexionOrganisateur')}
            >
              Se connecter
            </Text>
          </Text>
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
    paddingBottom: 40,
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
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: colors.mid,
    textAlign: 'center',
    marginTop: 24,
  },
  lienConnexionAccent: {
    fontFamily: 'Outfit_600SemiBold',
    color: colors.accent,
  },
})
