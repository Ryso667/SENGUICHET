// Barre de navigation inférieure avec effet verre dépoli (expo-blur)
// Remplace BottomNav.js — design Apple Invites
// 3 tabs : Accueil, Mes Tickets, Support
// Animation slide au changement, icône active surélevée
import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { fonts, glass } from '../constants/theme'

const TABS = [
  { key: 'Home', icon: 'home', label: 'Accueil' },
  { key: 'MesTickets', icon: 'tag', label: 'Mes Tickets' },
  { key: 'Support', icon: 'message-circle', label: 'Support' },
]

export default function GlassBottomNav() {
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(0)).current
  const prevIndex = useRef(0)

  const currentIndex = TABS.findIndex(t => t.key === route.name)
  useEffect(() => {
    if (currentIndex !== -1 && currentIndex !== prevIndex.current) {
      Animated.timing(slideAnim, {
        toValue: currentIndex > prevIndex.current ? 1 : -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        slideAnim.setValue(0)
        prevIndex.current = currentIndex
      })
    }
  }, [currentIndex, slideAnim])

  return (
    <BlurView tint="light" intensity={80} style={[styles.container, { paddingBottom: 8 + insets.bottom }]}>
      {TABS.map((tab) => {
        const active = route.name === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => navigation.navigate(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.activeIcon]}>
              <Feather name={tab.icon} size={20} color={active ? '#fff' : 'rgba(255,255,255,0.5)'} />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderLight,
    paddingTop: 8,
    backgroundColor: glass.bg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#fff',
    fontFamily: fonts.jakarta.semiBold,
  },
})
