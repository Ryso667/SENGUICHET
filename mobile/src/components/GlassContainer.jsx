// Carte fond indigo solide avec bordure subtile — remplace l'effet glass pour meilleur contraste
// Props : style, children, borderLeftColor (couleur de la bordure gauche), borderLeftWidth (largeur, défaut 6)
import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { borderRadius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

// Carte avec fond indigo solide et bordure gauche colorée optionnelle
// borderLeftColor : couleur hex pour la bordure gauche
// borderLeftWidth : largeur de la bordure gauche (défaut 6)
export default function GlassContainer({ children, style, borderLeftColor, borderLeftWidth }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <View style={[
      styles.container,
      borderLeftColor && { borderLeftWidth: borderLeftWidth || 6, borderLeftColor },
      style,
    ]}>
      {children}
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(121, 134, 203, 0.2)',
    overflow: 'hidden',
  },
})
