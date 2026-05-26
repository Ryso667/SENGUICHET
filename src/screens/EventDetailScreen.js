import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useTickets } from '../hooks/useTickets'

function generateTicketId(eventId, category) {
  const prefix = `SGT-${eventId.toUpperCase().slice(0, 3)}`
  const cat = category.replace(/\s/g, '').toUpperCase().slice(0, 4)
  const num = Math.floor(Math.random() * 900) + 100
  return `${prefix}-${cat}-${num}`
}

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params
  const [selectedTicket, setSelectedTicket] = useState(event.tickets[1] || event.tickets[0])
  const [phone, setPhone] = useState('77 456 78 90')
  const { addTicket } = useTickets()

  const handleBuy = async () => {
    const newTicket = {
      id: generateTicketId(event.id, selectedTicket.name),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      category: selectedTicket.name,
      price: selectedTicket.price,
      phone: `+221 ${phone}`,
      time: event.time,
      location: event.location,
      emoji: event.emoji,
      bg: event.bg,
      purchasedAt: Date.now(),
    }
    await addTicket(newTicket)
    Alert.alert(
      '🎫 Paiement validé !',
      'Votre Smart Ticket a été généré et enregistré localement.',
      [
        {
          text: 'Voir mon ticket',
          onPress: () => navigation.replace('Ticket', { ticket: newTicket }),
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} bounces={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.banner, { backgroundColor: event.bg }]}>
            <Text style={styles.bannerEmoji}>{event.emoji}</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={17} color={colors.slate} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.head}>
              <Text style={styles.title}>{event.title}</Text>
              <View style={styles.tags}>
                <View style={styles.tag}>
                  <Feather name="calendar" size={9} color="#f43f5e" />
                  <Text style={styles.tagText}>{event.date}</Text>
                </View>
                <View style={styles.tag}>
                  <Feather name="map-pin" size={9} color="#6366f1" />
                  <Text style={styles.tagText}>{event.location}</Text>
                </View>
                <View style={styles.tag}>
                  <Feather name="clock" size={9} color={colors.green} />
                  <Text style={styles.tagText}>{event.time}</Text>
                </View>
              </View>
            </View>

            <View style={styles.descCard}>
              <Feather name="info" size={11} color={colors.mid} />
              <Text style={styles.descText}>{event.desc}</Text>
            </View>

            <View style={styles.noAccount}>
              <Feather name="zap" size={13} color={colors.accent} />
              <Text style={styles.noAccountText}>
                <Text style={styles.noAccountStrong}>Aucune inscription requise.</Text> Saisissez votre numéro Wave ou Orange Money.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>
              <Feather name="package" size={12} color={colors.slate} /> 1. Choisir la catégorie
            </Text>

            {event.tickets.map((t) => (
              <TouchableOpacity
                key={t.name}
                style={[styles.ttCard, selectedTicket.name === t.name && styles.ttCardSelected]}
                onPress={() => setSelectedTicket(t)}
                activeOpacity={0.7}
              >
                <View style={styles.ttLeft}>
                  <Text style={styles.ttName}>{t.name}</Text>
                  <Text style={styles.ttDesc}>{t.desc}</Text>
                </View>
                <View style={styles.ttRight}>
                  <Text style={styles.ttPrice}>{t.price.toLocaleString()}F</Text>
                  <View style={[styles.radio, selectedTicket.name === t.name && styles.radioChecked]}>
                    {selectedTicket.name === t.name && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>
              <Feather name="smartphone" size={12} color={colors.slate} /> 2. Votre téléphone
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇸🇳</Text>
                <Text style={styles.codeText}>+221</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="77 XXX XX XX"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.paymentRow}>
              <Feather name="credit-card" size={11} color={colors.accent} />
              <Text style={styles.paymentText}>Wave <Text style={styles.paymentSep}>·</Text> Orange Money</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} activeOpacity={0.9}>
            <Feather name="shopping-cart" size={15} color="#fff" />
            <Text style={styles.buyBtnText}>Payer {selectedTicket.price.toLocaleString()} FCFA</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  banner: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bannerEmoji: { fontSize: 38 },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  head: { marginBottom: 14 },
  title: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 19,
    color: colors.slate,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  tags: { flexDirection: 'row', gap: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
  },
  tagText: { fontSize: 10, fontFamily: fonts.jakarta.semiBold, color: '#475569' },

  descCard: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  descText: { fontSize: 11, color: colors.mid, fontFamily: fonts.jakarta.regular, flex: 1, lineHeight: 16 },

  noAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 22,
  },
  noAccountText: { fontSize: 11, color: '#9a3412', fontFamily: fonts.jakarta.regular, flex: 1, lineHeight: 16 },
  noAccountStrong: { fontFamily: fonts.jakarta.semiBold },

  sectionLabel: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: colors.slate,
    marginBottom: 10,
    letterSpacing: -0.1,
  },

  ttCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  ttCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  ttLeft: {},
  ttName: { fontFamily: fonts.jakarta.semiBold, fontSize: 13, color: colors.slate },
  ttDesc: { fontSize: 10, color: colors.mid, fontFamily: fonts.jakarta.regular, marginTop: 2 },
  ttRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ttPrice: { fontFamily: fonts.outfit.bold, fontSize: 14, color: colors.accent },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  radioInner: { width: 6, height: 6, borderRadius: 50, backgroundColor: colors.white },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.border,
  },
  flag: { fontSize: 13 },
  codeText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: colors.slate },
  phoneInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.slate,
    padding: 0,
    paddingHorizontal: 14,
    outlineStyle: 'none',
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  paymentText: { fontSize: 10, color: colors.mid, fontFamily: fonts.jakarta.regular },
  paymentSep: { color: colors.muted },

  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  buyBtn: {
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    ...shadows.md,
  },
  buyBtnText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },
})
