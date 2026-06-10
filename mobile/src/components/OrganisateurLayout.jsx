// Fond clair uni pour les écrans organisateur
// Couleur #F5F0EB appliquée en arrière-plan solide
import { View, StyleSheet } from 'react-native'
import { colors } from '../constants/theme'

export default function OrganisateurLayout() {
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
