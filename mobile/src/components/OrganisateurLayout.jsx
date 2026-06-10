// Fond neutre sombre pour les écrans organisateur
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function OrganisateurLayout() {
  return (
    <LinearGradient
      colors={['#0D1B2A', '#0B1724', '#09121C']}
      locations={[0, 0.5, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  )
}
