// Petit badge/filtre glass pressable pour les catégories et les tags
// Props : label, icon, active, onPress, style
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { glass, fonts, borderRadius, spacing } from '../constants/theme'

// Chips glass avec icône et texte
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
      {icon && <Feather name={icon} size={12} color={active ? '#fff' : 'rgba(255,255,255,0.8)'} />}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: glass.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
  },
  active: {
    backgroundColor: glass.bgHeavy,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.8)',
  },
  activeLabel: {
    color: '#fff',
  },
})
