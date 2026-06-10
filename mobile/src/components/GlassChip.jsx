// Petit badge/filtre glass pressable pour les catégories et les tags
// Props : label, icon, active, onPress, style
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, fonts, borderRadius, spacing } from '../constants/theme'

// Chips indigo avec icône et texte
// active : booléen, surbrillance quand actif
// label : string
// icon : nom d'icône Feather (optionnel)
// onPress : fonction callback
export default function GlassChip({ label, icon, active, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.active, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Feather name={icon} size={12} color={active ? colors.white : colors.textSecondary} />}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  active: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.textSecondary,
  },
  activeLabel: {
    color: '#FFFFFF',
  },
})
