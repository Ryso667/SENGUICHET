// Écran de confirmation après inscription organisateur
// Informe l'utilisateur que son compte est en cours de validation
import { View, Text, ScrollView, StyleSheet, useMemo } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import GlassButton from '../../components/GlassButton'
import GlassContainer from '../../components/GlassContainer'
import { spacing, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'


// Composant de la barre de progression à 3 étapes
const Stepper = ({ etapeCourante, colors }) => {
  const stepperS = useMemo(() => makeStepperStyles(colors), [colors])
  // Sera remplacé par API (données mockées)
  const etapes = ['Inscription', 'Validation', 'Activation']
  return (
    <View style={stepperS.conteneur}>
      {etapes.map((label, i) => {
        const estComplete = i < etapeCourante
        const estActive = i === etapeCourante
        return (
          <View key={label} style={stepperS.bloc}>
            {/* Ligne de connexion entre les cercles */}
            {i > 0 && (
              <View
                style={[
                  stepperS.ligne,
                  { backgroundColor: estComplete ? colors.green : 'rgba(0,0,0,0.1)' },
                ]}
              />
            )}
            {/* Cercle de l'étape */}
            <View
              style={[
                stepperS.cercle,
                estComplete && stepperS.cercleComplete,
                estActive && stepperS.cercleActive,
              ]}
            >
              <Text
                style={[
                  stepperS.cercleTexte,
                  (estComplete || estActive) && stepperS.cercleTexteClair,
                ]}
              >
                {estComplete ? '✓' : i + 1}
              </Text>
            </View>
            {/* Label sous le cercle */}
            <Text
              style={[
                stepperS.label,
                (estComplete || estActive) && stepperS.labelForte,
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
const makeStepperStyles = (colors) => StyleSheet.create({
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
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    color: colors.textSecondary,
  },
  cercleTexteClair: {
    color: colors.white,
  },
  label: {
    fontFamily: fonts.outfit.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    position: 'absolute',
    top: 44,
    alignSelf: 'center',
  },
  labelForte: {
    fontFamily: fonts.outfit.semiBold,
    color: colors.text,
  },
})

export default function EnAttenteValidationScreen({ navigation }) {
  const { colors } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[s.conteneur, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icône de confirmation */}
        <MaterialCommunityIcons name="check-circle" size={64} color={colors.green} />

        {/* Titre et sous-titre */}
        <Text style={s.titre}>Inscription envoyée !</Text>
        <Text style={s.sousTitre}>
          Ton compte est en cours de vérification
        </Text>

        {/* Barre de progression des étapes */}
        <Stepper etapeCourante={1} colors={colors} />

        {/* Carte d'information verre dépoli */}
        <GlassContainer style={s.carte}>
          <Text style={s.carteTexte}>
            Un administrateur va valider ton compte sous 24 à 48 heures.
          </Text>
          <Text style={s.carteTexte}>
            Tu recevras un email de confirmation dès que ton compte sera activé.
          </Text>
          <Text style={s.carteTexte}>
            Tu pourras ensuite te connecter avec ton email et mot de passe.
          </Text>
        </GlassContainer>

        <View style={{ height: 24 }} />
        <GlassButton
          title="Retour à l'accueil"
          onPress={() => navigation.navigate('MainTabs')}
        />
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
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
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sousTitre: {
    fontFamily: fonts.outfit.regular,
    fontSize: 15,
    color: colors.textSecondary,
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
    color: colors.text,
    lineHeight: 20,
  },
})
