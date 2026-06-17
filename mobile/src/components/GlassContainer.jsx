// Carte fond solide avec bordure subtile — thème clair/sombre selon blurType
// Props : children, style, borderLeftColor, borderLeftWidth, blurType ('light'|'dark')
// blurType='dark'  → fond sombre fixe #1E293B (pour pickers/modales sur overlay sombre)
// blurType='light' (défaut) → colors.card (s'adapte au thème)
import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { borderRadius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

export default function GlassContainer({ children, style, borderLeftColor, borderLeftWidth, blurType }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors, blurType), [colors, blurType])

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

const makeStyles = (colors, blurType) => StyleSheet.create({
  container: {
    backgroundColor: blurType === 'dark' ? '#1E293B' : colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: blurType === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(121, 134, 203, 0.2)',
    overflow: 'hidden',
  },
})
