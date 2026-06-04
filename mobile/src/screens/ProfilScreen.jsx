// Écran de profil universel (acheteur / controleur)
// Design glass (Apple Invites)
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts, textShadow, glass } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'

export default function ProfilScreen({ route }) {
  const insets = useSafeAreaInsets()
  const { role, email, user, profil } = useAuth()
  const currentRole = route?.params?.role || role

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <BlurBackground category="Conference" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassContainer style={s.profileCard} intensity={35}>
          <View style={s.avatar}>
            <Feather name="user" size={28} color="#fff" />
          </View>
          {currentRole === 'acheteur' ? (
            <>
              <Text style={s.roleBadge}>Acheteur</Text>
              <Text style={s.email}>{email || profil?.email || 'Non connecté'}</Text>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Feather name="mail" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={s.infoText}>{email || profil?.email || '-'}</Text>
              </View>
              <View style={s.supportSection}>
                <Feather name="headphones" size={14} color={colors.accent} />
                <Text style={s.supportText}>Support : contact@senguichet.com</Text>
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
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  roleBadge: {
    fontSize: 11, fontFamily: fonts.outfit.semiBold, color: colors.accent,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs,
  },
  email: { fontSize: 18, fontFamily: fonts.outfit.semiBold, color: '#fff', marginBottom: spacing.sm, ...textShadow },
  divider: { width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  infoText: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },
  supportSection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,200,255,0.08)', borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,200,255,0.2)',
  },
  supportText: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)' },
})
