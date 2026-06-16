// Dashboard contrôleur : page d'accueil après connexion du contrôleur
// Affiche les infos de session, navigation vers Scanner/Historique et déconnexion
import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
import { spacing, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function ControleurDashboardScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { deconnecter } = useAuth()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.safe}>
      <View style={[styles.conteneur, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <GlassContainer style={styles.card}>
          <Feather name="shield" size={48} color={colors.accent} />
          <Text style={styles.titre}>Mode Contrôleur</Text>
          <Text style={styles.sousTitre}>Connecté avec succès</Text>
        </GlassContainer>

        <GlassButton title="Scanner un QR" icon="camera" onPress={() => navigation.navigate('Scanner')} />
        <GlassButton title="Historique des scans" icon="clock" onPress={() => navigation.navigate('Historique')} />

        <View style={{ flex: 1 }} />
        <View style={styles.separateur} />
        <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnecter} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color={colors.red} />
          <Text style={styles.boutonDeconnexionTexte}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: colors.bg,
  },
  conteneur: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: spacing.lg,
  },
  card: { padding: spacing.xl, alignItems: 'center', gap: 12, width: '100%' },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  separateur: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  boutonDeconnexion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 14,
    backgroundColor: colors.red + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red + '20',
  },
  boutonDeconnexionTexte: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.red,
  },
})
