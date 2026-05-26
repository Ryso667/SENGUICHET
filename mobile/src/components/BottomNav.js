import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing } from '../constants/theme'

export default function BottomNav() {
  const navigation = useNavigation()
  const route = useRoute()

  return (
    <View style={styles.container}>
      <TouchableOpacity key="guichet" style={styles.item} onPress={() => navigation.navigate('Home')}>
        <Feather name="home" size={19} color={route.name === 'Home' ? colors.accent : colors.muted} />
        <Text style={[styles.label, route.name === 'Home' && styles.activeLabel]}>Accueil</Text>
      </TouchableOpacity>
      <TouchableOpacity key="tickets" style={styles.item} onPress={() => navigation.navigate('MesTickets')}>
        <Feather name="tag" size={19} color={route.name === 'Home' ? colors.accent : colors.muted} />
        <Text style={[styles.label, route.name === 'MesTickets' && styles.activeLabel]}>Mes Tickets</Text>
      </TouchableOpacity>
      <TouchableOpacity key="support" style={styles.item} onPress={() => navigation.navigate('Support')}>
        <Feather name="message-circle" size={19} color={route.name === 'Support' ? colors.accent : colors.muted} />
        <Text style={[styles.label, route.name === 'Support' && styles.activeLabel]}>Support</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: fonts.jakarta.medium,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  activeLabel: {
    color: colors.accent,
    fontFamily: fonts.jakarta.semiBold,
  },
})
