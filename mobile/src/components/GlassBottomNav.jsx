// Barre de navigation inférieure avec effet verre dépoli (expo-blur)
// Remplace BottomNav.js — design Apple Invites
// 3 tabs : Accueil, Mes Tickets, Support
// Animation slide au changement, icône active surélevée
//
// Couleurs mises à jour Juin 2026 :
//   Fond : rgba(44,44,48,0.85) — gris foncé translucide assorti au tabBar natif iOS
//   Icône/texte actif  : #D4A574 (or) avec fond or semi-transparent
//   Icône/texte inactif : #8A8A92 (gris doux)
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
              <Feather name={tab.icon} size={20} color={active ? '#D4A574' : '#8A8A92'} />
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
    borderTopColor: 'rgba(142,142,147,0.22)', // Séparateur sombre style iOS
    paddingTop: 8,
    backgroundColor: 'rgba(44,44,48,0.85)', // Fond translucide gris foncé
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
    backgroundColor: 'rgba(212,165,116,0.2)', // Fond or semi-transparent pour l'icône active
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: '#8A8A92', // Inactif : gris doux
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#D4A574', // Actif : or
    fontFamily: fonts.jakarta.semiBold,
  },
})
