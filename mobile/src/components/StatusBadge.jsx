// Badge de statut réutilisable pour événements et demandes
// Props : status (ACTIF/EN_ATTENTE/VALIDE/TERMINE/ANNULE/EN_COURS/ACCEPTEE/REJETEE)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Palette de couleurs douces remplaçant les couleurs vives d'origine
const CONFIG = {
  ACTIF: { label: 'ACTIF', color: '#D4A574', bg: 'rgba(212,165,116,0.15)' },
  EN_ATTENTE: { label: 'EN ATTENTE', color: '#E8A868', bg: 'rgba(232,168,104,0.15)' },
  VALIDE: { label: 'VALIDE', color: '#6CD4A0', bg: 'rgba(108,212,160,0.15)' },
  TERMINE: { label: 'TERMINÉ', color: '#8A8A92', bg: 'rgba(138,138,146,0.15)' },
  ANNULE: { label: 'ANNULÉ', color: '#E86868', bg: 'rgba(232,104,104,0.15)' },
  EN_COURS: { label: 'EN COURS', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  ACCEPTEE: { label: 'ACCEPTÉE', color: '#6CD4A0', bg: 'rgba(108,212,160,0.15)' },
  REJETEE: { label: 'REJETÉE', color: '#E86868', bg: 'rgba(232,104,104,0.15)' },
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
