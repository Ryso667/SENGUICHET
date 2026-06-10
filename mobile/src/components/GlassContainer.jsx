// Conteneur solide pour carte — fond bleu marine #252B80, coins arrondis 16px
// Props : style, children, borderLeftColor (couleur de la bordure gauche)
import { View, StyleSheet } from 'react-native'
import { colors, borderRadius } from '../constants/theme'

// Carte avec fond solide et bordure gauche colorée optionnelle
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
    backgroundColor: glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    overflow: 'hidden',
  },
})
