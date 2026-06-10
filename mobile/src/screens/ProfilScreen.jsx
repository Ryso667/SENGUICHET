// Écran de profil universel (acheteur / controleur)
// Design glass (Apple Invites)
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts, glass } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { getStats } from '../services/scanService'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'

export default function ProfilScreen({ route }) {
  const insets = useSafeAreaInsets()
  const { role, email, user, profil } = useAuth()
  const currentRole = route?.params?.role || role
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (currentRole === 'controleur') chargerStats()
  }, [currentRole])

  async function chargerStats() {
    try {
      const data = await getStats()
      setStats(data)
    } catch {}
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <BlurBackground category="Conference" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassContainer style={s.profileCard} intensity={35}>
          <View style={s.avatar}>
            <Feather name="user" size={28} color={colors.textWhite} />
          </View>
          {currentRole === 'acheteur' ? (
            <>
              <Text style={s.roleBadge}>Acheteur</Text>
              <Text style={s.email}>{email || profil?.email || 'Non connecté'}</Text>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Feather name="mail" size={14} color={colors.textWhiteMuted} />
                <Text style={s.infoText}>{email || profil?.email || '-'}</Text>
              </View>
              <View style={s.supportSection}>
                <Feather name="headphones" size={14} color={colors.accent} />
                <Text style={s.supportText}>Support : contact@senguichet.com</Text>
              </View>
            </>
          ) : currentRole === 'controleur' ? (
            <>
              <Text style={s.roleBadge}>Contrôleur</Text>
              <Text style={s.roleDesc}>Contrôle d'accès — scan QR</Text>
              <View style={s.divider} />
              <View style={s.statsGrid}>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{stats?.ticketsLocaux || 0}</Text>
                  <Text style={s.statLabel}>Tickets locaux</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{stats?.VALIDE || 0}</Text>
                  <Text style={s.statLabel}>Validés</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{stats?.DEJA_UTILISE || 0}</Text>
                  <Text style={s.statLabel}>Déjà utilisés</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{stats?.FRAUDE || 0}</Text>
                  <Text style={s.statLabel}>Fraudes</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={s.infoText}>Profil non disponible</Text>
          )}
        </GlassContainer>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { margin: spacing.lg, padding: spacing.lg, alignItems: 'center' },
  avatar: {
    width: 64, height: 64, borderRadius: 32,     backgroundColor: colors.glassWhite,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    borderWidth: 2, borderColor: glass.border,
  },
  roleBadge: {
    fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.accent,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs,
  },
  email: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: colors.textWhite, marginBottom: spacing.sm },
  roleDesc: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textWhiteMuted, marginBottom: spacing.sm },
  divider: { width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  infoText: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.textWhiteMuted },
  supportSection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.accentLight, borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,200,255,0.2)',
  },
  supportText: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textWhiteMuted },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%',
  },
  statBox: {
    width: '47%', alignItems: 'center', backgroundColor: colors.glassDark,
    borderRadius: borderRadius.md, paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  statValue: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.textWhite },
  statLabel: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.textWhiteMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
})
