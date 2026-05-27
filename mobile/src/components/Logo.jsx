// Composant logo SENGUICHET avec dégradé Indigo → Rose
// Utilisé dans les écrans d'authentification et le header de l'application
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients, fonts } from '../constants/theme'

// Logo SENGUICHET : icône dégradée + texte (optionnel)
// Props : size (number, défaut 40), showText (bool, défaut true)
export default function Logo({ size = 40, showText = true }) {
  return (
    <View style={s.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.icon, { width: size, height: size, borderRadius: size / 4 }]}>
        <Text style={[s.symbol, { fontSize: size * 0.5 }]}>🎫</Text>
      </LinearGradient>
      {showText && <Text style={[s.text, { fontSize: size * 0.55 }]}>SENGUICHET</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  symbol: { color: '#FFFFFF' },
  text: { fontFamily: fonts.outfit.bold, color: '#0F172A', letterSpacing: 2 },
})
