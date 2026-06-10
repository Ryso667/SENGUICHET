// Carte de demande pour la liste des demandes
// Props : demande (object), onPress (fn), onDetail (fn)
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fonts, borderRadius, spacing } from '../constants/theme'
import StatusBadge from './StatusBadge'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function DemandeCard({ demande, onPress, onDetail }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.type}>{demande.type}</Text>
          <Text style={styles.date}>{formatDate(demande.date)}</Text>
        </View>
        <StatusBadge status={demande.statut} />
      </View>
      {demande.evenement ? (
        <Text style={styles.eventName} numberOfLines={1}>
          {demande.evenement}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.detailBtn} onPress={onDetail} activeOpacity={0.7}>
        <Text style={styles.detailBtnText}>Voir les détails</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  type: {
    fontSize: 15,
    fontFamily: fonts.outfit.bold,
    color: colors.text,
  },
  date: {
    fontSize: 12,
    fontFamily: fonts.outfit.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventName: {
    fontSize: 12,
    fontFamily: fonts.outfit.regular,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  detailBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 13,
    fontFamily: fonts.outfit.semiBold,
    color: '#FFFFFF',
  },
})
