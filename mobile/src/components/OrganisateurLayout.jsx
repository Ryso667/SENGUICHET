// Fond dégradé indigo pour les écrans organisateur
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients } from '../constants/theme'

export default function OrganisateurLayout() {
  return (
    <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} pointerEvents="none" />
  )
}
