// Barre de navigation inférieure avec effet verre dépoli (expo-blur)
// Remplace BottomNav.js — design Apple Invites
// 3 tabs : Accueil, Mes Tickets, Support
// Animation slide au changement, icône active surélevée
//
// Couleurs mises à jour Juin 2026 (Warm Light) :
//   Fond : rgba(255,255,255,0.6) — blanc translucide
//   Icône/texte actif  : #C7513A (terracotta)
//   Icône/texte inactif : #9C9590 (gris doux)
import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { fonts } from '../constants/theme'

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
    <BlurView tint="dark" intensity={90} style={[styles.container, { paddingBottom: 8 + insets.bottom }]}>
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
              <Feather name={tab.icon} size={20} color={active ? '#C7513A' : '#9C9590'} />
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
    borderTopColor: 'rgba(0,0,0,0.08)', // Séparateur léger
    paddingTop: 8,
    backgroundColor: 'rgba(255,255,255,0.6)', // Fond translucide blanc
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
    backgroundColor: 'rgba(199,81,58,0.15)', // Fond terracotta semi-transparent pour l'icône active
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: '#9C9590', // Inactif : gris doux
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#C7513A', // Actif : terracotta
    fontFamily: fonts.jakarta.semiBold,
  },
})
