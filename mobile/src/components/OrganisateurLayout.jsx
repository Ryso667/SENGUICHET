// Fond dégradé plein écran pour les écrans organisateur
// Remplace BlurBackground (trop sombre avec Conference) par un gradient indigo lumineux
// Style Apple Invites — fond doux, premium, non angoissant
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function OrganisateurLayout() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#1E1B4B']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
}
