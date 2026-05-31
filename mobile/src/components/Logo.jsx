// Logo officiel SENGUICHET avec l'image logo.jpg (thème Cyan/Bleu)
// Utilisé dans les écrans d'authentification et le header de l'application
import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { fonts } from '../constants/theme'

// Logo SENGUICHET : image logo.jpg + texte (optionnel)
// Props : size (number, défaut 80 pour l'image), showText (bool, défaut true), textSize (number, défaut 22)
export default function Logo({ size = 80, showText = true, textSize = 22 }) {
  return (
    <View style={s.container}>
      <Image
        source={require('../../assets/logo.jpg')}
        style={[s.image, { width: size, height: size }]}
        resizeMode="contain"
      />
      {showText && <Text style={[s.text, { fontSize: textSize }]}>SENGUICHET</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  image: { borderRadius: 8 },
  text: { fontFamily: fonts.outfit.bold, color: '#0F172A', letterSpacing: 2 },
})
