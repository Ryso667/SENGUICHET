// Bouton avec 3 variantes et animation scale au press
// Props : title, icon, onPress, style, textStyle, variant ("primary"|"secondary"|"ghost")
import { useRef, useMemo } from 'react'
import { TouchableOpacity, Text, Animated, View, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, borderRadius, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { hapticLight } from '../utils/haptics'

// Retourne les styles selon la variante demandée
// primary : fond accent solide, texte blanc — action principale
// secondary : fond bgSecondary, bordure — action secondaire
// ghost   : transparent, pas de bordure — lien texte
export default function GlassButton({ title, icon, onPress, style, textStyle, variant = 'secondary' }) {
  const { colors } = useTheme()
  const scale = useRef(new Animated.Value(1)).current

  // Construit le map des variantes avec les couleurs du thème courant
  const variantStyles = useMemo(() => makeVariantStyles(colors)[variant] || makeVariantStyles(colors).secondary, [colors, variant])

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={() => { if (onPress) { hapticLight(); onPress() } }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.button, variantStyles.button]}>
          {icon && <Feather name={icon} size={18} color={variantStyles.iconColor} style={styles.icon} />}
          <Text style={[styles.title, { color: variantStyles.textColor }, textStyle]}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const makeVariantStyles = (colors) => ({
  primary: {
    button: {
      backgroundColor: colors.accent,
      borderWidth: 0,
    },
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  secondary: {
    button: {
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textColor: colors.text,
    iconColor: colors.text,
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    textColor: colors.accent,
    iconColor: colors.accent,
  },
})

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.outfit.semiBold,
    letterSpacing: -0.2,
  },
})
