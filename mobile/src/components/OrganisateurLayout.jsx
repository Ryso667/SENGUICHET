// Fond solide bleu foncé pour les écrans organisateur
import { View, StyleSheet } from 'react-native'
import { colors } from '../constants/theme'

export default function OrganisateurLayout() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, pointerEvents: 'none' }]} />
  )
}
