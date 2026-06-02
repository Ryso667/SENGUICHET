// Écran détail d'un événement avec sélection de catégorie et paiement
// Le téléphone et la confirmation de paiement sont intégrés sur cette page
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert, Modal,
  KeyboardAvoidingView, Platform, Image,
  Animated, ActivityIndicator, Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { fetchEvenementDetailPublic } from '../services/eventService'
import { acheterBillet } from '../services/billetService'
import { formaterDateLisible } from '../utils/dateUtils'
import BuyerLayout from '../components/BuyerLayout'
import { useAuth } from '../context/AuthContext'

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params
  const { definirTelephone, numeroTel } = useAuth()
  const [event, setEvent] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [telephone, setTelephone] = useState(numeroTel || '')
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [paymentEtape, setPaymentEtape] = useState('confirm') // confirm | pending | success | failed
  const [paymentError, setPaymentError] = useState('')
  const [paymentResult, setPaymentResult] = useState(null)
  const spinAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    (async () => {
      try {
        setError(null)
        const data = await fetchEvenementDetailPublic(eventId)
        if (!data) {
          setError('Événement introuvable')
          return
        }
        setEvent(data)
        if (data.tickets.length > 0) {
          setSelectedTicket(data.tickets[1] || data.tickets[0])
        }
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
      }
    })()
  }, [eventId, retryCount])

  const handleBuy = () => {
    setShowPaymentSheet(true)
    setPaymentEtape('confirm')
  }

  const isValidPhone = telephone.replace(/[^\d]/g, '').length >= 6

  const confirmerPaiement = async () => {
    setPaymentEtape('pending')
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start()

    try {
      const telPropre = telephone.replace(/[^\d]/g, '')
      const telComplet = telPropre.startsWith('221') ? `+${telPropre}` : `+221${telPropre}`
      const resultat = await acheterBillet(event.id, selectedTicket.id, telComplet, null, 'WAVE')

      if (!resultat || !resultat.billet) {
        throw new Error('Réponse invalide du serveur')
      }

      await definirTelephone(telComplet)

      if (resultat.paiement?.redirectUrl) {
        setShowPaymentSheet(false)
        navigation.replace('WebViewWave', {
          redirectUrl: resultat.paiement.redirectUrl,
          transactionReference: resultat.paiement.reference,
          eventId: event.id,
          ticket: { ...resultat.billet, eventId: event.id },
        })
      } else {
        setPaymentResult({ ...resultat.billet, eventId: event.id })
        setPaymentEtape('success')
        setTimeout(() => {
          setShowPaymentSheet(false)
          navigation.replace('Ticket', { ticket: { ...resultat.billet, eventId: event.id } })
        }, 2000)
      }
    } catch (err) {
      setPaymentEtape('failed')
      setPaymentError(err.message || 'Erreur de connexion au serveur')
    }
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  if (error) {
    return (
      <BuyerLayout>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <Feather name="alert-circle" size={32} color={colors.muted} />
            <Text style={styles.loadingText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setRetryCount(c => c + 1)}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BuyerLayout>
    )
  }

  if (!event) {
    return (
      <BuyerLayout>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </BuyerLayout>
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
                      <Feather name="map-pin" size={9} color="#00C8FF" />
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

              <LinearGradient colors={['#E0F7FF', '#FDF2F8']} style={styles.noAccount}>
                <Feather name="zap" size={14} color={colors.accent} />
                <Text style={styles.noAccountText}>
                  <Text style={styles.noAccountStrong}>Connexion rapide.</Text> Ton téléphone sera demandé au paiement.
                </Text>
              </LinearGradient>

              <View style={styles.sectionLabel}>
                <Feather name="package" size={12} color={colors.slate} />
                <Text style={styles.sectionLabelText}>  1. Choisir la catégorie</Text>
              </View>

              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategorySheet(true)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.categorySelectorLabel}>{selectedTicket.name}</Text>
                  <Text style={styles.categorySelectorPrice}>{selectedTicket.price.toLocaleString()} FCFA</Text>
                </View>
                <Feather name="chevron-up" size={18} color={colors.mid} />
              </TouchableOpacity>

              {/* Modal de sélection de catégorie */}
              <Modal
                visible={showCategorySheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategorySheet(false)}
              >
                <TouchableOpacity
                  style={styles.sheetOverlay}
                  activeOpacity={1}
                  onPress={() => setShowCategorySheet(false)}
                >
                  <View style={styles.sheetContainer}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Choisir une catégorie</Text>
                    {event.tickets.map((t) => (
                      <TouchableOpacity
                        key={t.name}
                        style={[styles.sheetItem, selectedTicket.name === t.name && styles.sheetItemSelected]}
                        onPress={() => {
                          setSelectedTicket(t)
                          setShowCategorySheet(false)
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.sheetItemLeft}>
                          <Text style={styles.sheetItemName}>{t.name}</Text>
                          <Text style={styles.sheetItemDesc}>{t.desc || 'Accès standard'}</Text>
                        </View>
                        <View style={styles.sheetItemRight}>
                          <Text style={styles.sheetItemPrice}>{t.price.toLocaleString()} FCFA</Text>
                          <Text style={styles.sheetItemPlaces}>Places limitées</Text>
                          {selectedTicket.name === t.name && (
                            <View style={styles.sheetCheck}>
                              <Feather name="check" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* 2. Saisie téléphone Wave */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>
                <Feather name="smartphone" size={12} color={colors.slate} />                 2. Ton numéro Wave
              </Text>

              <View style={[styles.phoneRow, telephone.replace(/[^\d]/g, '').length >= 6 && styles.phoneRowActive]}>
                <View style={styles.countryCode}>
                  <Text style={styles.codeText}>+221</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={telephone}
                  onChangeText={setTelephone}
                  keyboardType="phone-pad"
                  placeholder="77 XXX XX XX"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.buyBtn, !isValidPhone && styles.buyBtnDisabled]}
              onPress={handleBuy}
              activeOpacity={0.9}
              disabled={!isValidPhone}
            >
              <LinearGradient
                colors={['#00C8FF', '#0077FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyGradient}
              >
                <Feather name="shopping-cart" size={15} color="#fff" />
                <Text style={styles.buyBtnText}>Payer {selectedTicket?.price?.toLocaleString() || '0'} FCFA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Modal de confirmation paiement Wave */}
        <Modal
          visible={showPaymentSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentSheet(false)}
        >
          <TouchableOpacity
            style={styles.paySheetOverlay}
            activeOpacity={1}
            onPress={() => paymentEtape === 'confirm' && setShowPaymentSheet(false)}
          >
            <View style={styles.paySheetContainer}>
              {/* Bouton fermeture (croix) */}
              {paymentEtape === 'confirm' && (
                <TouchableOpacity style={styles.payCloseBtn} onPress={() => setShowPaymentSheet(false)}>
                  <Feather name="x" size={20} color={colors.mid} />
                </TouchableOpacity>
              )}

              {/* Étape : confirmation */}
              {paymentEtape === 'confirm' && (
                <>
                  <Image source={require('../../assets/wave_logo.png')} style={styles.waveLogo} resizeMode="contain" />
                  <Text style={styles.paySheetTitle}>Confirmer le paiement</Text>

                  <View style={styles.payInfoCard}>
                    <Text style={styles.payEventTitle}>{event.title}</Text>
                    <View style={styles.payTicketRow}>
                      <Text style={styles.payTicketName}>{selectedTicket.name}</Text>
                      <Text style={styles.payTicketPrice}>{selectedTicket.price.toLocaleString()} FCFA</Text>
                    </View>
                  </View>

                  <View style={styles.payPhoneRow}>
                    <Feather name="smartphone" size={14} color={colors.mid} />
                    <Text style={styles.payPhoneText}>+221 {telephone}</Text>
                  </View>

                  <TouchableOpacity style={styles.confirmPayBtn} onPress={confirmerPaiement} activeOpacity={0.9}>
                    <LinearGradient
                      colors={['#1AB3E5', '#0D8ABC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confirmPayGradient}
                    >
                      <Image source={require('../../assets/wave_logo.png')} style={styles.confirmBtnLogo} resizeMode="contain" />
                      <Text style={styles.confirmPayText}>Payer {selectedTicket.price.toLocaleString()} FCFA</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Étape : paiement en cours */}
              {paymentEtape === 'pending' && (
                <View style={styles.payCenter}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Feather name="loader" size={44} color="#1AB3E5" />
                  </Animated.View>
                  <Text style={styles.payStatusTitle}>Paiement en cours</Text>
                  <Text style={styles.payStatusSub}>Confirmation Wave...</Text>
                </View>
              )}

              {/* Étape : succès */}
              {paymentEtape === 'success' && (
                <View style={styles.payCenter}>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <LinearGradient colors={['#1AB3E5', '#0D8ABC']} style={styles.payCheckCircle}>
                      <Feather name="check" size={44} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={styles.paySuccessTitle}>Paiement confirmé !</Text>
                  <Text style={styles.payStatusSub}>Redirection vers votre ticket...</Text>
                </View>
              )}

              {/* Étape : échec */}
              {paymentEtape === 'failed' && (
                <View style={styles.payCenter}>
                  <View style={styles.payErrorCircle}>
                    <Feather name="x" size={44} color="#fff" />
                  </View>
                  <Text style={styles.payErrorTitle}>Paiement échoué</Text>
                  <Text style={styles.payErrorDetail}>{paymentError}</Text>
                  <TouchableOpacity style={styles.payRetryBtn} onPress={() => setPaymentEtape('confirm')} activeOpacity={0.8}>
                    <LinearGradient colors={['#1AB3E5', '#0D8ABC']} style={styles.payRetryGradient}>
                      <Feather name="refresh-cw" size={14} color="#fff" />
                      <Text style={styles.payRetryText}>Réessayer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: fonts.jakarta.semiBold,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  sectionLabelText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: colors.slate,
    letterSpacing: -0.1,
  },

  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 14,
    marginBottom: spacing.md,
  },
  categorySelectorLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: colors.slate,
  },
  categorySelectorPrice: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 11,
    color: colors.mid,
    marginTop: 2,
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: colors.slate,
    marginBottom: spacing.md,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetItemSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  sheetItemLeft: {},
  sheetItemName: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 13,
    color: colors.slate,
  },
  sheetItemDesc: {
    fontSize: 10,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
  },
  sheetItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sheetItemPrice: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: colors.accent,
  },
  sheetItemPlaces: {
    fontSize: 9,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
  },
  sheetCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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

  // Styles input téléphone
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  phoneRowActive: {
    borderColor: '#1AB3E5',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.border,
  },
  codeText: {
    fontSize: 13,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.slate,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.slate,
    padding: 0,
    paddingHorizontal: 14,
    outlineStyle: 'none',
  },

  // Styles modal paiement Wave
  paySheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  paySheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  payCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  waveLogo: {
    width: 90,
    height: 28,
    marginBottom: spacing.md,
  },
  paySheetTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: colors.slate,
    marginBottom: spacing.md,
  },
  payInfoCard: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  payEventTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: colors.slate,
    marginBottom: 6,
  },
  payTicketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payTicketName: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
  },
  payTicketPrice: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: '#1AB3E5',
  },
  payPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  payPhoneText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 14,
    color: colors.slate,
  },
  confirmPayBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  confirmPayGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtnLogo: {
    width: 20,
    height: 20,
  },
  confirmPayText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: '#fff',
  },
  payCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: spacing.xl,
    minHeight: 260,
  },
  payStatusTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: colors.slate,
    marginTop: spacing.sm,
  },
  payStatusSub: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
  },
  payCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paySuccessTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: '#1AB3E5',
  },
  payErrorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payErrorTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: colors.red,
  },
  payErrorDetail: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  payRetryBtn: {
    marginTop: 8,
    borderRadius: 100,
    overflow: 'hidden',
  },
  payRetryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  payRetryText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },

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
