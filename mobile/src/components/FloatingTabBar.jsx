// Barre de navigation flottante style iOS 18 avec compact au scroll
// Apple Music / Reddit inspired : les labels disparaissent, la barre se réduit
import { Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '../constants/theme'
import { hapticLight } from '../utils/haptics'
import { useTabBarScroll } from '../context/TabBarScrollContext'

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const { scrollY, resetScroll } = useTabBarScroll()
  const bottomOffset = Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 4 : 16) : 12

  const compactAnim = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const labelOpacity = compactAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0, 0],
  })

  const labelTranslateY = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  })

  const tabHeight = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 50],
  })

  const indicatorScale = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  return (
    <Animated.View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <BlurView tint="dark" intensity={80} style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index
          const label = options.tabBarLabel || options.title || route.name

          const icon = options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? colors.accent : colors.textTertiary,
            size: 22,
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
              <Animated.View style={[styles.iconWrap, isFocused && { backgroundColor: 'rgba(0,200,255,0.15)' }]}>
                {icon}
              </Animated.View>
              <Animated.Text
                style={[
                  styles.label,
                  isFocused && styles.activeLabel,
                  {
                    opacity: labelOpacity,
                    transform: [{ translateY: labelTranslateY }],
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
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
    left: 16,
    right: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingVertical: 6,
    backgroundColor: 'rgba(18,18,28,0.85)',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.accent,
    fontFamily: fonts.jakarta.semiBold,
  },
})
