// Fond dégradé indigo pour les écrans contrôleur — identique au thème organisateur
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function ControleurLayout() {
  return (
    <LinearGradient
      colors={['#1C2166', '#252B7A', '#191E5E']}
      locations={[0, 0.5, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  )
}
