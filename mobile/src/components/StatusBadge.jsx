// Badge de statut réutilisable pour événements et demandes
// Props : status (ACTIF/EN_ATTENTE/TERMINE/ANNULE/EN_COURS/ACCEPTEE/REJETEE)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const CONFIG = {
  ACTIF: { label: 'ACTIF', color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
  EN_ATTENTE: { label: 'EN ATTENTE', color: '#FFB347', bg: 'rgba(255,179,71,0.15)' },
  TERMINE: { label: 'TERMINÉ', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  ANNULE: { label: 'ANNULÉ', color: '#FF4D6D', bg: 'rgba(255,77,109,0.15)' },
  EN_COURS: { label: 'EN COURS', color: '#00C8FF', bg: 'rgba(0,200,255,0.15)' },
  ACCEPTEE: { label: 'ACCEPTÉE', color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
  REJETEE: { label: 'REJETÉE', color: '#FF4D6D', bg: 'rgba(255,77,109,0.15)' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status || 'INCONNU', color: '#A0B4C8', bg: 'rgba(160,180,200,0.15)' }
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
