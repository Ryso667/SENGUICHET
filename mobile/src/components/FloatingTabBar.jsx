// Barre de navigation flottante style iOS — se compacte au scroll
// Labels disparaissent en fondu, hauteur réduite, icônes restent visibles
// La barre reste en place (ne disparaît pas) — comportement Apple Music
import { Text, TouchableOpacity, Animated, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const containerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [70, 52],
    extrapolate: 'clamp',
  })

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <Animated.View style={[styles.container, { height: containerHeight }]}>
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
      </Animated.View>
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
  },
  container: {
    flexDirection: 'row',
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(61,90,254,0.15)',
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
