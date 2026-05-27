// Écran de support et contact utilisateur
// Affiche les coordonnées de contact (email, téléphone, WhatsApp, FAQ)
import React from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import BuyerLayout from '../components/BuyerLayout'

const SUPPORT_ITEMS = [
  { icon: 'mail', label: 'Email', value: 'support@senguichet.sn', action: 'mailto:support@senguichet.sn' },
  { icon: 'phone', label: 'Téléphone', value: '+221 XX XXX XX XX', action: null },
  { icon: 'message-circle', label: 'WhatsApp', value: '+221 XX XXX XX XX', action: null },
  { icon: 'help-circle', label: 'FAQ', value: 'Bientôt disponible', action: null },
]

// Sera remplacé par API : récupération des coordonnées depuis le serveur
export default function SupportScreen() {
  return (
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* En-tête avec icône et titre */}
          <View style={s.header}>
            <LinearGradient colors={['rgba(99,102,241,0.1)', 'rgba(236,72,153,0.05)']} style={s.headerGlow}>
              <View style={s.iconWrap}>
                <Feather name="headphones" size={32} color={colors.accent} />
              </View>
              <Text style={s.title}>Support</Text>
              <Text style={s.sub}>Une question ? Un problème ? Contactez-nous.</Text>
            </LinearGradient>
          </View>

          {SUPPORT_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.card}
              onPress={() => item.action && Linking.openURL(item.action)}
              activeOpacity={0.7}
              disabled={!item.action}
            >
              <LinearGradient colors={['#EEF2FF', '#FDF2F8']} style={s.iconBox}>
                <Feather name={item.icon} size={18} color={colors.accent} />
              </LinearGradient>
              <View style={s.cardText}>
                <Text style={s.cardLabel}>{item.label}</Text>
                <Text style={s.cardValue}>{item.value}</Text>
              </View>
              {item.action ? (
                <View style={s.chevronBtn}>
                  <Feather name="chevron-right" size={16} color={colors.accent} />
                </View>
              ) : (
                <Text style={s.bientot}>Bientôt</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Pied de page */}
          <View style={s.footer}>
            <Text style={s.footerTitle}>Senguichet</Text>
            <Text style={s.footerSub}>Billets & Événements · Sénégal</Text>
            <Text style={s.footerVersion}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
  headerGlow: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.outfit.bold,
    color: colors.slate,
    marginTop: spacing.md,
  },
  sub: {
    fontSize: 13,
    fontFamily: fonts.jakarta.regular,
    color: colors.mid,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  cardValue: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  chevronBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bientot: {
    fontSize: 10, fontFamily: fonts.jakarta.semiBold,
    color: colors.muted, backgroundColor: colors.bg,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  footer: { alignItems: 'center', marginTop: spacing.xl * 2 },
  footerTitle: { fontSize: 16, fontFamily: fonts.outfit.black, color: colors.slate, letterSpacing: -0.5 },
  footerSub: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.muted, marginTop: 2 },
  footerVersion: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.muted, marginTop: spacing.sm },
})
