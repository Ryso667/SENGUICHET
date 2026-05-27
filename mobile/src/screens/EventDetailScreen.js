// Écran détail d'un événement avec sélection de catégorie et paiement
// Inclut : bannière, infos, sélection ticket, saisie téléphone, double confirmation paiement
import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { acheterTicket, getAllEvenements } from '../services/eventService'
import { useAuth } from '../context/AuthContext'
import { formaterDateLisible } from '../utils/dateUtils'
import BuyerLayout from '../components/BuyerLayout'

// Formate le numéro stocké (+22177XXXXXX → 77 XXX XX XX) pour l'affichage
function formaterTelStocke(telComplet) {
  if (!telComplet) return ''
  const chiffres = telComplet.replace(/\D/g, '').slice(-9)
  let resultat = ''
  for (let i = 0; i < chiffres.length; i++) {
    if (i === 2 || i === 5 || i === 7) resultat += ' '
    resultat += chiffres[i]
  }
  return resultat
}

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params
  const { numeroTel } = useAuth()
  const [selectedTicket, setSelectedTicket] = useState(event.tickets[1] || event.tickets[0])
  const [phone, setPhone] = useState(() => formaterTelStocke(numeroTel))

  // Paiement avec double confirmation pour éviter les achats involontaires
  // Sera remplacé par API : intégration Wave/Orange Money réelle
  const handleBuy = () => {
    const tel = `+221 ${phone.replace(/\s/g, '')}`
    const prix = selectedTicket.price || selectedTicket.prix
    Alert.alert(
      'Confirmer le paiement',
      `${selectedTicket.name} — ${prix?.toLocaleString() || '?'} FCFA\nTéléphone: ${tel}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              // Si l'événement n'existe pas encore dans AsyncStorage, le créer avec ses catégories
              // Sera remplacé par API : création côté serveur
              const events = await getAllEvenements()
              if (!events.find(e => e.id === event.id)) {
                events.push({
                  id: event.id,
                  nom: event.title,
                  date: event.date,
                  lieu: event.location || '',
                  heure: event.time || '',
                  categorie: event.category || '',
                  description: event.desc || '',
                  poster: event.poster || '',
                  categories: event.tickets.map(t => ({
                    id: t.id,
                    nom: t.name,
                    prix: t.price,
                    capacite: 999,
                  })),
                  ticketCount: 0,
                  createdAt: new Date().toISOString(),
                })
                await AsyncStorage.setItem('@senguichet_evenements', JSON.stringify(events))
              }

              const ticket = await acheterTicket(event.id, selectedTicket.id, tel)

              Alert.alert('🎫 Paiement validé !', 'Votre Smart Ticket a été généré et enregistré localement.', [
                {
                  text: 'Voir mon ticket',
                  onPress: () => navigation.replace('Ticket', { ticket }),
                },
              ])
            } catch (err) {
              Alert.alert('Erreur', err.message)
            }
          },
        },
      ]
    )
  }

  return (
    <BuyerLayout>
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
                    <Text style={styles.tagText}>{formaterDateLisible(event.date)}</Text>
                  </View>
                  {!!event.location && (
                    <View style={styles.tag}>
                      <Feather name="map-pin" size={9} color="#6366f1" />
                      <Text style={styles.tagText}>{event.location}</Text>
                    </View>
                  )}
                  {!!event.time && (
                    <View style={styles.tag}>
                      <Feather name="clock" size={9} color={colors.green} />
                      <Text style={styles.tagText}>{event.time}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.descCard}>
                <Feather name="info" size={11} color={colors.mid} />
                <Text style={styles.descText}>{event.desc}</Text>
              </View>

              <LinearGradient colors={['#EEF2FF', '#FDF2F8']} style={styles.noAccount}>
                <Feather name="zap" size={14} color={colors.accent} />
                <Text style={styles.noAccountText}>
                  <Text style={styles.noAccountStrong}>Aucune inscription requise.</Text> Saisis ton numéro Wave ou Orange Money.
                </Text>
              </LinearGradient>

              <Text style={styles.sectionLabel}>
                <Feather name="package" size={12} color={colors.slate} />                 1. Choisir la catégorie
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
                <Feather name="smartphone" size={12} color={colors.slate} />                 2. Votre téléphone
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
              <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buyGradient}>
                <Feather name="shopping-cart" size={15} color="#fff" />
                <Text style={styles.buyBtnText}>Payer {selectedTicket?.price?.toLocaleString() || '0'} FCFA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BuyerLayout>
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
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 22,
  },
  noAccountText: { fontSize: 11, color: '#475569', fontFamily: fonts.jakarta.regular, flex: 1, lineHeight: 16 },
  noAccountStrong: { fontFamily: fonts.jakarta.semiBold, color: colors.slate },

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
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  buyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyBtnText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },
})
