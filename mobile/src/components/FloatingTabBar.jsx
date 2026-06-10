// Barre de navigation flottante style iOS — rétrécit légèrement au scroll
// La barre entière se réduit (scale 0.92), les labels restent visibles
// Revient à la taille normale en haut de page
import { Text, TouchableOpacity, Animated, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { colors, fonts, shadows } from '../constants/theme'
import { hapticLight } from '../utils/haptics'
import { useTabBarScroll } from '../context/TabBarScrollContext'

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const { scrollY, resetScroll } = useTabBarScroll()
  const bottomOffset = Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 4 : 16) : 12

  // Rétrécit toute la barre au scroll (scale 0.92), labels toujours visibles
  const barScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  })
  return (
    <Animated.View style={[styles.wrapper, { bottom: bottomOffset, transform: [{ scale: barScale }] }]}>
      <BlurView tint="dark" intensity={90} style={styles.container}>
        <View style={styles.waterHighlight} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index
          const label = options.tabBarLabel || options.title || route.name

          const icon = options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? colors.navActive : colors.navInactive,
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
    left: 16,
    right: 16,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  waterHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(61,90,254,0.08)',
  },
  bubbleGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
    opacity: 0,
  },
  activeGlow: {
    opacity: 1,
    backgroundColor: 'rgba(61,90,254,0.12)',
    shadowColor: '#3D5AFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: colors.navInactive,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.navActive,
    fontFamily: fonts.jakarta.semiBold,
  },
})
