import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing } from '../constants/theme'

const items = [
  { icon: 'home', label: 'Guichet', key: 'guichet' },
  { icon: 'tag', label: 'Mes Tickets', key: 'tickets' },
  { icon: 'message-circle', label: 'Support', key: 'support' },
]

export default function BottomNav() {
  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <TouchableOpacity key={item.key} style={styles.item}>
          <Feather name={item.icon} size={19} color={i === 0 ? colors.accent : colors.muted} />
          <Text style={[styles.label, i === 0 && styles.activeLabel]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
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
