// Petit badge/filtre glass pressable pour les catégories et les tags
// Props : label, icon, active, onPress, style
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, borderRadius, spacing } from '../constants/theme'

// Couleurs mises à jour selon la charte graphique
// Inactif : fond rgba(255,255,255,0.06), texte #B0B0B8
// Actif   : fond #D4A574, texte #1A1A1E

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
      {icon && <Feather name={icon} size={12} color={active ? '#1A1A1E' : '#B0B0B8'} />}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  active: {
    backgroundColor: '#D4A574',
    borderColor: '#D4A574',
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: '#B0B0B8',
  },
  activeLabel: {
    color: '#1A1A1E',
  },
})
