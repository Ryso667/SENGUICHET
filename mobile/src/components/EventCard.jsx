// Carte d'événement pour la liste des événements
// Props : event (object), onPress (fn), onDetail (fn)
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, fonts, borderRadius, spacing } from '../constants/theme'
import StatusBadge from './StatusBadge'
import ProgressBar from './ProgressBar'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function EventCard({ event, onPress, onDetail }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{event.nom}</Text>
        <StatusBadge status={event.statut} />
      </View>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.accent} />
          <Text style={styles.metaText}>{event.lieu || 'Non spécifié'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={12} color={colors.accent} />
          <Text style={styles.metaText}>{formatDate(event.date)}</Text>
        </View>
      </View>
      <View style={styles.progressSection}>
        <ProgressBar value={event.remplis || 0} max={event.capacite || 1} />
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.outfit.bold,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.outfit.regular,
    color: colors.textSecondary,
  },
  progressSection: {
    marginBottom: 12,
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
