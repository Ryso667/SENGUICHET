// Carte de statistique pour le dashboard
// Props : icon (Feather name), value (string), label (string)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export default function StatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={18} color="#00C8FF" />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#152232',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,200,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#A0B4C8',
  },
})
