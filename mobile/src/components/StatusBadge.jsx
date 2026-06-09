// Badge de statut réutilisable pour événements et demandes
// Props : status (ACTIF/EN_ATTENTE/VALIDE/TERMINE/ANNULE/EN_COURS/ACCEPTEE/REJETEE)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Palette de couleurs douces remplaçant les couleurs vives d'origine
const CONFIG = {
  ACTIF: { label: 'ACTIF', color: '#2E7D5E', bg: 'rgba(46,125,94,0.15)' },
  EN_ATTENTE: { label: 'EN ATTENTE', color: '#D4835A', bg: 'rgba(212,131,90,0.15)' },
  VALIDE: { label: 'VALIDE', color: '#2E7D5E', bg: 'rgba(46,125,94,0.15)' },
  TERMINE: { label: 'TERMINÉ', color: '#9C9590', bg: 'rgba(156,149,144,0.15)' },
  ANNULE: { label: 'ANNULÉ', color: '#C73A3A', bg: 'rgba(199,58,58,0.15)' },
  EN_COURS: { label: 'EN COURS', color: '#7C6FA0', bg: 'rgba(124,111,160,0.15)' },
  ACCEPTEE: { label: 'ACCEPTÉE', color: '#2E7D5E', bg: 'rgba(46,125,94,0.15)' },
  REJETEE: { label: 'REJETÉE', color: '#C73A3A', bg: 'rgba(199,58,58,0.15)' },
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
