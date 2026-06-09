// Carte de statistique pour le dashboard
// Props : icon (Feather name), value (string), label (string), color (string, optionnel)
import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, fonts, spacing, borderRadius } from '../constants/theme'

export default function StatCard({ icon, value, label, color }) {
  const accent = color || colors.accent
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: hexToRgba(accent, 0.1) }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 } }),
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontFamily: fonts.outfit.bold,
    color: colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.outfit.regular,
    color: colors.textSecondary,
  },
})
