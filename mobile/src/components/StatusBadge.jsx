// Badge de statut réutilisable pour événements et demandes
// Props : status (ACTIF/EN_ATTENTE/VALIDE/TERMINE/ANNULE/EN_COURS/ACCEPTEE/REJETEE)
import { View, Text, StyleSheet } from 'react-native'
import { hexToRgba } from '../utils/colors'
import { colors } from '../constants/theme'

const CONFIG = {
  ACTIF: { label: 'ACTIF', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  EN_ATTENTE: { label: 'EN ATTENTE', color: colors.warning, bg: hexToRgba(colors.warning, 0.15) },
  VALIDE: { label: 'VALIDE', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  TERMINE: { label: 'TERMINÉ', color: colors.mid, bg: hexToRgba(colors.mid, 0.15) },
  ANNULE: { label: 'ANNULÉ', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
  EN_COURS: { label: 'EN COURS', color: colors.slate, bg: hexToRgba(colors.slate, 0.15) },
  ACCEPTEE: { label: 'ACCEPTÉE', color: colors.green, bg: hexToRgba(colors.green, 0.15) },
  REJETEE: { label: 'REJETÉE', color: colors.danger, bg: hexToRgba(colors.danger, 0.15) },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status || 'INCONNU', color: '#B0B0B8', bg: 'rgba(176,176,184,0.15)' }
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
