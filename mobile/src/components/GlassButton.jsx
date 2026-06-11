// Bouton large avec fond indigo solide et animation scale au press
// Props : title, icon, onPress, style, textStyle
import { useRef } from 'react'
import { TouchableOpacity, Text, Animated, View, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, fonts, borderRadius, spacing } from '../constants/theme'
// Feedback haptique léger au press du bouton
import { hapticLight } from '../utils/haptics'

// Bouton large avec fond indigo solide, icône et animation scalePress
// title : string du texte
// icon : nom d'icône Feather (optionnel)
// onPress : fonction callback
export default function GlassButton({ title, icon, onPress, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current

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
        onPress={() => { hapticLight(); onPress?.() }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.button}>
          {icon && <Feather name={icon} size={18} color={colors.text} style={styles.icon} />}
          <Text style={[styles.title, textStyle]}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.outfit.semiBold,
    color: colors.text,
    letterSpacing: -0.2,
  },
})
