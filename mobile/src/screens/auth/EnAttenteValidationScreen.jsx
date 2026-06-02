// Écran de confirmation après inscription organisateur
// Informe l'utilisateur que son compte est en cours de validation
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import GlassButton from '../../components/GlassButton'
import GlassContainer from '../../components/GlassContainer'
import { colors, spacing, fonts, textShadow } from '../../constants/theme'
import BlurBackground from '../../components/BlurBackground'

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
                  { backgroundColor: estComplete ? colors.green : 'rgba(255,255,255,0.2)' },
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.6)',
  },
  cercleTexteClair: {
    color: colors.white,
  },
  label: {
    fontFamily: fonts.outfit.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    position: 'absolute',
    top: 44,
    alignSelf: 'center',
  },
  labelForte: {
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
  },
})

export default function EnAttenteValidationScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }}>
      <BlurBackground />
      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingTop: insets.top }]}
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

        {/* Carte d'information verre dépoli */}
        <GlassContainer style={styles.carte}>
          <Text style={styles.carteTexte}>
            Un administrateur va valider ton compte sous 24 à 48 heures.
          </Text>
          <Text style={styles.carteTexte}>
            Tu recevras un email de confirmation dès que ton compte sera activé.
          </Text>
          <Text style={styles.carteTexte}>
            Tu pourras ensuite te connecter avec ton email et mot de passe.
          </Text>
        </GlassContainer>

        <View style={{ height: 24 }} />
        <GlassButton
          title="Retour à l'accueil"
          onPress={() => navigation.navigate('AccueilChoix')}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
    ...textShadow,
  },
  sousTitre: {
    fontFamily: fonts.outfit.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  carte: {
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  carteTexte: {
    fontFamily: fonts.outfit.regular,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
})
