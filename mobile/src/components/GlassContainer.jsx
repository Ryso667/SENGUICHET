// Conteneur réutilisable avec effet verre dépoli (glassmorphism)
// Utilise expo-blur pour le backdrop blur natif
// Props : style, blurType, blurAmount, intensity, children
import { View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { glass, borderRadius } from '../constants/theme'

// Wrapper glass avec blur natif, bordure translucide, et fond semi-transparent
// blurType : 'light' | 'dark' | 'extraLight' (défaut 'light')
// intensity : 0-100 (défaut 60)
export default function GlassContainer({ children, style, blurType = 'light', intensity = 60 }) {
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
    // overflow hidden avec borderRadius peut crée des bords tranchés sur certains Android
    overflow: 'hidden',
  },
})
