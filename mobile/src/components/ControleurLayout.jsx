// Fond clair pour les écrans contrôleur (thème Warm Light)
// Utilise colors.bg (#F5F0EB) en arrière-plan solide
import { View, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

export default function ControleurLayout() {
  return (
    <View style={styles.background} />
  )
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
  },
})
