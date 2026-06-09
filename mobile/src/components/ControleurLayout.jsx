// Fond dégradé plein écran pour les écrans contrôleur
// Même style premium que OrganisateurLayout (indigo doux Apple Invites)
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function ControleurLayout() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#1E1B4B']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
}
