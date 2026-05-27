// Barre de navigation inférieure premium pour l'acheteur
// Onglet actif : icône dans un cercle dégradé Indigo→Rose
// Onglets inactifs : icône grise simple
// S'adapte à la route courante pour la surbrillance
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors } from '../constants/theme'

const TABS = [
  { key: 'Home', icon: 'home', label: 'Accueil' },
  { key: 'MesTickets', icon: 'tag', label: 'Mes Tickets' },
  { key: 'Support', icon: 'message-circle', label: 'Support' },
]

export default function BottomNav() {
  const navigation = useNavigation()
  const route = useRoute()

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = route.name === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => navigation.navigate(tab.key)}
            activeOpacity={0.7}
          >
            {active ? (
              <LinearGradient
                colors={['#6366F1', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIcon}
              >
                <Feather name={tab.icon} size={18} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.inactiveIcon}>
                <Feather name={tab.icon} size={18} color={colors.muted} />
              </View>
            )}
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#edf0f5',
    paddingTop: 8,
    paddingBottom: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#6366F1',
    fontFamily: fonts.jakarta.semiBold,
  },
})
