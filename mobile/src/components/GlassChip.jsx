// Petit badge/filtre glass pressable pour les catégories et les tags
// Props : label, icon, active, onPress, style
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, borderRadius, spacing } from '../constants/theme'

// Couleurs mises à jour selon la charte graphique (Warm Light)
// Inactif : fond rgba(0,0,0,0.04), texte #6B6560, bordure rgba(0,0,0,0.08)
// Actif   : fond #C7513A, texte #FFFFFF

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
      {icon && <Feather name={icon} size={12} color={active ? '#FFFFFF' : '#6B6560'} />}
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
    backgroundColor: '#C7513A',
    borderColor: '#C7513A',
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: '#6B6560',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
})
