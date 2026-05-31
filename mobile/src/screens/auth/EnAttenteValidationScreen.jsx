// Écran de confirmation après inscription organisateur
// Informe l'utilisateur que son compte est en cours de validation
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

// Composant de la barre de progression à 3 étapes
const Stepper = ({ etapeCourante }) => {
  // Sera remplacé par API (données mockées)
  const etapes = ['Inscription', 'Validation', 'Activation']
  return (
    <View style={stepperStyles.conteneur}>
      {etapes.map((label, i) => {
        const estComplete = i < etapeCourante
        const estActive = i === etapeCourante
        return (
          <View key={label} style={stepperStyles.bloc}>
            {/* Ligne de connexion entre les cercles */}
            {i > 0 && (
              <View
                style={[
                  stepperStyles.ligne,
                  { backgroundColor: estComplete ? colors.green : colors.border },
                ]}
              />
            )}
            {/* Cercle de l'étape */}
            <View
              style={[
                stepperStyles.cercle,
                estComplete && stepperStyles.cercleComplete,
                estActive && stepperStyles.cercleActive,
              ]}
            >
              <Text
                style={[
                  stepperStyles.cercleTexte,
                  (estComplete || estActive) && stepperStyles.cercleTexteClair,
                ]}
              >
                {estComplete ? '✓' : i + 1}
              </Text>
            </View>
            {/* Label sous le cercle */}
            <Text
              style={[
                stepperStyles.label,
                (estComplete || estActive) && stepperStyles.labelForte,
              ]}
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// Styles du stepper
const stepperStyles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  bloc: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ligne: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginRight: 0,
  },
  cercle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cercleComplete: {
    backgroundColor: colors.green,
  },
  cercleActive: {
    backgroundColor: colors.accent,
  },
  cercleTexte: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: colors.mid,
  },
  cercleTexteClair: {
    color: colors.white,
  },
  label: {
    fontFamily: fonts.outfit.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    position: 'absolute',
    top: 44,
    alignSelf: 'center',
  },
  labelForte: {
    fontFamily: fonts.outfit.semiBold,
    color: colors.slate,
  },
})

export default function EnAttenteValidationScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.conteneur}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icône de confirmation */}
        <MaterialCommunityIcons name="check-circle" size={64} color={colors.green} />

        {/* Titre et sous-titre */}
        <Text style={styles.titre}>Inscription envoyée !</Text>
        <Text style={styles.sousTitre}>
          Ton compte est en cours de vérification
        </Text>

        {/* Barre de progression des étapes */}
        <Stepper etapeCourante={1} />

        {/* Carte d'information */}
        <View style={styles.carte}>
          <Text style={styles.carteTexte}>
            Un administrateur va valider ton compte sous 24 à 48 heures.
          </Text>
          <Text style={styles.carteTexte}>
            Tu recevras un email de confirmation dès que ton compte sera activé.
          </Text>
          <Text style={styles.carteTexte}>
            Tu pourras ensuite te connecter avec ton email et mot de passe.
          </Text>
        </View>

        <View style={{ height: 24 }} />
        <BoutonPrincipal
          titre="Retour à l'accueil"
          onPress={() => navigation.navigate('AccueilChoix')}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteneur: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  icone: { marginBottom: spacing.md },
  titre: {
    fontFamily: fonts.outfit.bold,
    fontSize: 24,
    color: colors.slate,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sousTitre: {
    fontFamily: fonts.outfit.regular,
    fontSize: 15,
    color: colors.mid,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  carte: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  carteTexte: {
    fontFamily: fonts.outfit.regular,
    fontSize: 14,
    color: colors.slate,
    lineHeight: 20,
  },
})
