// Carte fond indigo solide avec bordure subtile — remplace l'effet glass pour meilleur contraste
// Props : style, children, borderLeftColor (couleur de la bordure gauche)
import { View, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../constants/theme'

// Carte avec fond indigo solide et bordure gauche colorée optionnelle
// borderLeftColor : couleur hex pour la bordure gauche de 4px
export default function GlassContainer({ children, style, borderLeftColor }) {
  return (
    <View style={[
      styles.container,
      borderLeftColor && { borderLeftWidth: 4, borderLeftColor },
      style,
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
})
