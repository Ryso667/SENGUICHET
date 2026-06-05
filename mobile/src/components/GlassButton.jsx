// Bouton glass large avec animation scale au press
// Props : title, icon, onPress, style, textStyle
import { useRef } from 'react'
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { glass, fonts, borderRadius, spacing, textShadow } from '../constants/theme'

// Bouton glass large avec icône et animation scalePress
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
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <BlurView tint="light" intensity={50} style={styles.button}>
          {icon && <Feather name={icon} size={18} color="#fff" style={styles.icon} />}
          <Text style={[styles.title, textStyle]}>{title}</Text>
        </BlurView>
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
    borderColor: glass.border,
    backgroundColor: glass.bgLight,
    overflow: 'hidden',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
    letterSpacing: -0.2,
    ...textShadow,
  },
})
