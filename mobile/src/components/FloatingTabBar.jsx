// Barre de navigation flottante style iOS — se compacte au scroll
// Labels disparaissent en fondu, hauteur réduite, icônes restent visibles
// La barre reste en place (ne disparaît pas) — comportement Apple Music
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

  // Compact au scroll : labels fondent + remontent dans l'icône
  const labelOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  const labelTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 6],
    extrapolate: 'clamp',
  })
  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
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
              <Animated.View style={{ opacity: labelOpacity, transform: [{ translateY: labelTranslateY }] }}>
                <Text
                  style={[styles.label, isFocused && styles.activeLabel]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )
        })}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 28,
    ...shadows.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  waterHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(61,90,254,0.12)',
  },
  bubbleGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0,
  },
  activeGlow: {
    opacity: 1,
    backgroundColor: 'rgba(61,90,254,0.08)',
    shadowColor: '#3D5AFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
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
