// Fond dégradé subtil pour les écrans organisateur
// Dégradé indigo doux du haut vers le bas pour éviter le fond uni trop sombre
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function OrganisateurLayout() {
  return (
    <LinearGradient
      colors={['#F0F5FF', '#E8F0FE', '#DBEAFA']}
      locations={[0, 0.5, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  )
}
