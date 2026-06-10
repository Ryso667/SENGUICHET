// Conteneur réutilisable avec effet verre dépoli (glassmorphism)
// Utilise expo-blur pour le backdrop blur natif
// Props : style, blurType, blurAmount, intensity, children, variant
import { View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { glass, borderRadius, colors } from '../constants/theme'

// Wrapper glass avec blur natif, bordure translucide, et fond semi-transparent
// blurType : 'light' | 'dark' | 'extraLight' (défaut 'light')
// intensity : 0-100 (défaut 70)
// variant : 'glass' (défaut) | 'surface' — 'surface' supprime le flou pour un fond solide
export default function GlassContainer({ children, style, blurType = 'light', intensity = 70, variant = 'glass' }) {
  // Variante sans effet verre : fond solide pour contraste renforcé
  if (variant === 'surface') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
        {children}
      </View>
    )
  }

  // Effet verre dépoli par défaut avec fond noir semi-transparent
  return (
    <BlurView tint={blurType} intensity={intensity} style={[styles.container, style]}>
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    overflow: 'hidden',
  },
})
