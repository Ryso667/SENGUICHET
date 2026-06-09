// Fond sombre uni pour les écrans organisateur
// Couleur #1A1A1E appliquée en arrière-plan solide
import { View, StyleSheet } from 'react-native'

export default function OrganisateurLayout() {
  return (
    <View style={styles.background} />
  )
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1A1A1E',
  },
})
