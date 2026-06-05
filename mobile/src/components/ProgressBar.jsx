// Barre de progression avec dégradé
// Props : value (nombre), max (nombre), label (optionnel)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ProgressBar({ value = 0, max = 100, label }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.count}>{value} / {max}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E3448',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#00C8FF',
  },
  count: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#A0B4C8',
    width: 70,
    textAlign: 'right',
  },
})
