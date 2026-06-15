// Barre de navigation flottante style iOS — rétrécit au scroll vers le bas
// S'agrandit immédiatement dès qu'on scroll vers le haut (style Instagram)
// Direction-based : bas→compact, haut→normal, spring fluide
import { useState, useEffect, useRef } from 'react'
import { Text, TouchableOpacity, Animated, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { colors, fonts } from '../constants/theme'
import { scale, fontScale, isPad } from '../utils/responsive'
import { hapticLight } from '../utils/haptics'
import { useTabBarScroll } from '../context/TabBarScrollContext'

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const { scrollY, resetScroll } = useTabBarScroll()
  const bottomOffset = Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 4 : 16) : 12

  const [compact, setCompact] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const lastY = useRef(0)

  // Détecte la direction du scroll : bas → compact (scale 0.92), haut → normal (scale 1)
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const diff = lastY.current - value
      lastY.current = value
      if (diff > 2 && !compact) setCompact(true)
      if (diff < -1 && compact) setCompact(false)
    })
    return () => scrollY.removeListener(listener)
  }, [scrollY, compact])

  // Spring fluide entre expanded (1.0) et compact (0.92)
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: compact ? 0.92 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }, [compact, scaleAnim])
  return (
    <Animated.View style={[styles.wrapper, { bottom: bottomOffset, transform: [{ scale: scaleAnim }] }]}>
      <BlurView tint="light" intensity={80} style={styles.container}>
        <View style={styles.waterSurface} pointerEvents="none" />
        <View style={styles.waterDepth} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index
          const label = options.tabBarLabel || options.title || route.name

          const icon = options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? colors.navActive : colors.navInactive,
            size: scale(22),
          })

          const onPress = () => {
            resetScroll()
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              hapticLight()
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isFocused && styles.activeIconWrap]}>
                <View style={[styles.bubbleGlow, isFocused && styles.activeGlow]} />
                {icon}
              </View>
              <Text
                style={[styles.label, isFocused && styles.activeLabel]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </BlurView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: scale(16),
    right: scale(16),
    borderRadius: scale(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: scale(32),
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: scale(4),
    paddingHorizontal: scale(6),
    overflow: 'hidden',
  },
  waterSurface: {
    position: 'absolute',
    top: 0,
    left: scale(12),
    right: scale(12),
    height: scale(1.5),
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  waterDepth: {
    position: 'absolute',
    top: scale(1.5),
    left: scale(12),
    right: scale(12),
    height: scale(6),
    borderBottomLeftRadius: scale(3),
    borderBottomRightRadius: scale(3),
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: scale(4),
  },
  iconWrap: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(26,86,219,0.08)',
  },
  bubbleGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale(21),
    opacity: 0,
  },
  activeGlow: {
    opacity: 1,
    backgroundColor: 'transparent',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: fontScale(10),
    fontFamily: fonts.jakarta.medium,
    color: colors.navInactive,
    letterSpacing: scale(0.2),
  },
  activeLabel: {
    color: colors.navActive,
    fontFamily: fonts.jakarta.semiBold,
  },
})
