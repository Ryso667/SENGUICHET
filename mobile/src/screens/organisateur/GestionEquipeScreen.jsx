// Écran de gestion d'équipe (contrôleurs + code de scan)
// Design glass (Apple Invites)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts, textShadow, glass } from '../../constants/theme'
import { appelAPI } from '../../services/apiService'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'
import Skeleton from '../../components/Skeleton'

export default function GestionEquipeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { eventId } = route.params || {}
  const [equipe, setEquipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (eventId) charger()
  }, [eventId])

  async function charger() {
    setLoading(true)
    try {
      const data = await appelAPI(`/evenements/${eventId}/equipe`)
      setEquipe(data)
    } catch (err) {
      Alert.alert('Erreur', err.message)
    }
    setLoading(false)
  }

  async function regenerer() {
    setRegenerating(true)
    try {
      const data = await appelAPI(`/evenements/${eventId}/regenerer-code`, { method: 'POST' })
      setEquipe(prev => ({ ...prev, scan_code: data.scan_code }))
    } catch (err) {
      Alert.alert('Erreur', err.message)
    }
    setRegenerating(false)
  }

  const totalScans = equipe?.controleurs?.reduce((acc, c) => acc + (c.scans_effectues || 0), 0) || 0

  if (loading) {
    return (
      <View style={s.container}>
        <BlurBackground category="Conference" />
        <View style={{ padding: spacing.lg, paddingTop: insets.top }}>
          <Skeleton type="card" count={4} />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <BlurBackground category="Conference" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Équipe</Text>
        <TouchableOpacity onPress={charger} style={s.refreshBtn}>
          <Feather name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassContainer style={s.codeSection} intensity={35}>
          <Text style={s.codeLabel}>Code de scan</Text>
          <Text style={s.codeValue}>{equipe?.scan_code || 'N/A'}</Text>
          <TouchableOpacity style={s.regenerateBtn} onPress={regenerer} disabled={regenerating}>
            {regenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="refresh-cw" size={14} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.regenerateText}>Régénérer</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassContainer>

        <GlassContainer style={s.statsCard} intensity={30}>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{equipe?.controleurs?.length || 0}</Text>
              <Text style={s.statLabel}>Contrôleurs</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNumber}>{totalScans}</Text>
              <Text style={s.statLabel}>Scans</Text>
            </View>
          </View>
        </GlassContainer>

        <View style={s.listHeader}>
          <Text style={s.listTitle}>Contrôleurs ({equipe?.controleurs?.length || 0})</Text>
        </View>

        {equipe?.controleurs?.length === 0 ? (
          <GlassContainer style={s.emptyCard} intensity={25}>
            <Feather name="users" size={32} color="rgba(255,255,255,0.3)" />
            <Text style={s.emptyText}>Aucun contrôleur assigné</Text>
          </GlassContainer>
        ) : (
          equipe?.controleurs?.map((ctrl, idx) => (
            <GlassContainer key={ctrl.id || idx} style={s.ctrlCard} intensity={30}>
              <View style={s.ctrlTop}>
                <View style={s.ctrlAvatar}>
                  <Feather name="user" size={16} color="#fff" />
                </View>
                <View style={s.ctrlInfo}>
                  <Text style={s.ctrlNom}>{ctrl.nom || 'Contrôleur'}</Text>
                  <Text style={s.ctrlTel}>{ctrl.telephone || '-'}</Text>
                </View>
                <View style={s.ctrlScans}>
                  <Text style={s.ctrlScanCount}>{ctrl.scans_effectues || 0}</Text>
                  <Text style={s.ctrlScanLabel}>scans</Text>
                </View>
              </View>
              {ctrl.affectation ? (
                <View style={s.ctrlZone}>
                  <Feather name="map-pin" size={12} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                  <Text style={s.ctrlZoneText}>{ctrl.affectation}</Text>
                </View>
              ) : null}
            </GlassContainer>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  refreshBtn: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', ...textShadow },
  codeSection: { margin: spacing.lg, padding: spacing.lg, alignItems: 'center' },
  codeLabel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  codeValue: { fontSize: 28, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: 2, marginBottom: spacing.md, ...textShadow },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth, borderColor: glass.border,
  },
  regenerateText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  statsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', ...textShadow },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  listHeader: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  listTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff', ...textShadow },
  emptyCard: { marginHorizontal: spacing.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)' },
  ctrlCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md },
  ctrlTop: { flexDirection: 'row', alignItems: 'center' },
  ctrlAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  ctrlInfo: { flex: 1 },
  ctrlNom: { fontSize: 15, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  ctrlTel: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  ctrlScans: { alignItems: 'center' },
  ctrlScanCount: { fontSize: 16, fontFamily: fonts.outfit.bold, color: colors.accent },
  ctrlScanLabel: { fontSize: 9, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  ctrlZone: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ctrlZoneText: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.5)' },
})
