// Carte de statistique pour le dashboard
// Props : icon (Feather name), value (string), label (string)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export default function StatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={18} color="#D4A574" />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#2C2C30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,165,116,0.15)',
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(212,165,116,0.1)',
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
    color: '#B0B0B8',
  },
})
