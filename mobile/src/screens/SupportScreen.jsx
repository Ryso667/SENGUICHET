// Écran de support et contact utilisateur
// Affiche les options d'aide et permet d'ouvrir les liens externes (email, site)
import React from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius } from '../constants/theme'

const SUPPORT_ITEMS = [
  { icon: 'mail', label: 'Email', value: 'support@senguichet.sn', action: 'mailto:support@senguichet.sn' },
  { icon: 'phone', label: 'Téléphone', value: '+221 XX XXX XX XX', action: null },
  { icon: 'message-circle', label: 'WhatsApp', value: '+221 XX XXX XX XX', action: null },
  { icon: 'help-circle', label: 'FAQ', value: 'Bientôt disponible', action: null },
]

export default function SupportScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Feather name="headphones" size={36} color={colors.accent} />
          <Text style={s.title}>Support</Text>
          <Text style={s.sub}>Une question ? Un problème ? On est là.</Text>
        </View>

        {SUPPORT_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.card}
            onPress={() => item.action && Linking.openURL(item.action)}
            activeOpacity={0.7}
            disabled={!item.action}
          >
            <View style={s.iconBox}>
              <Feather name={item.icon} size={18} color={colors.accent} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardLabel}>{item.label}</Text>
              <Text style={s.cardValue}>{item.value}</Text>
            </View>
            {item.action && <Feather name="chevron-right" size={16} color={colors.muted} />}
          </TouchableOpacity>
        ))}

        <View style={s.footer}>
          <Text style={s.footerTitle}>Senguichet</Text>
          <Text style={s.footerSub}>Billets & Événements</Text>
          <Text style={s.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: colors.slate, marginTop: spacing.sm },
  sub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  cardValue: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  footer: { alignItems: 'center', marginTop: spacing.xl * 2 },
  footerTitle: { fontSize: 16, fontFamily: fonts.outfit.black, color: colors.slate, letterSpacing: -0.5 },
  footerSub: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.muted, marginTop: 2 },
  footerVersion: { fontSize: 10, fontFamily: fonts.jakarta.regular, color: colors.muted, marginTop: spacing.sm },
})
