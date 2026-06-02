// Écran détail d'un événement avec sélection de catégorie et paiement
// Design immersif : BlurBackground + GlassContainer pour tous les éléments
// Conserve le flux de paiement Wave/Orange Money existant
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert, Modal,
  KeyboardAvoidingView, Platform, Image,
  Animated, ActivityIndicator, Easing,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, glass, textShadow } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import { fetchEvenementDetailPublic } from '../services/eventService'
import { acheterBillet } from '../services/billetService'
import { formaterDateLisible } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params
  const { definirTelephone, numeroTel } = useAuth()
  const insets = useSafeAreaInsets()
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

  // Charge les détails de l'événement au montage ou lors d'un retry
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
        // Sera remplacé par API : sélectionne par défaut la 2e catégorie ou la première
        if (data.tickets.length > 0) {
          setSelectedTicket(data.tickets[1] || data.tickets[0])
        }
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
      }
    })()
  }, [eventId, retryCount])

  // Ouvre le modal de paiement à l'étape de confirmation
  const handleBuy = () => {
    if (!isValidPhone || !selectedTicket) return
    setShowPaymentSheet(true)
    setPaymentEtape('confirm')
  }

  const isValidPhone = telephone.replace(/[^\d]/g, '').length >= 6

  // Déclenche l'appel API d'achat et gère les étapes de paiement
  const confirmerPaiement = async () => {
    setPaymentEtape('pending')

    // Animation de rotation pour le loader
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // Animation d'échelle pour le check de succès
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

      // Redirection vers Wave WebView ou succès direct selon réponse
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

  // État erreur
  if (error) {
    return (
      <View style={styles.container}>
        <BlurBackground category={event?.category} />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={32} color={colors.textWhiteMuted} />
          <Text style={styles.loadingText}>{error}</Text>
          <GlassButton title="Réessayer" icon="refresh-cw" onPress={() => setRetryCount(c => c + 1)} />
        </View>
      </View>
    )
  }

  // État chargement
  if (!event) {
    return (
      <View style={styles.container}>
        <BlurBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Fond immersif plein écran */}
      <BlurBackground category={event?.category} />

      {/* Bouton retour flottant avec cercle glass */}
      <TouchableOpacity style={[styles.floatingBack, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={styles.flex} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}>

          {/* Emoji hero centré */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>{event.emoji}</Text>
          </View>

          {/* Carte titre et métadonnées */}
          <GlassContainer style={styles.detailsCard}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Feather name="calendar" size={9} color="#fff" />
                <Text style={styles.tagText}>{formaterDateLisible(event.date)}</Text>
              </View>
              {!!event.location && (
                <View style={styles.tag}>
                  <Feather name="map-pin" size={9} color="#fff" />
                  <Text style={styles.tagText}>{event.location}</Text>
                </View>
              )}
              {!!event.time && (
                <View style={styles.tag}>
                  <Feather name="clock" size={9} color="#fff" />
                  <Text style={styles.tagText}>{event.time}</Text>
                </View>
              )}
            </View>
          </GlassContainer>

          {/* Description de l'événement */}
          {!!event.desc && (
            <GlassContainer style={styles.descCard}>
              <Feather name="info" size={11} color={colors.textWhiteMuted} />
              <Text style={styles.descText}>{event.desc}</Text>
            </GlassContainer>
          )}

          {/* Mention connexion rapide */}
          <GlassContainer style={styles.infoCard}>
            <Feather name="zap" size={14} color="#fff" />
            <Text style={styles.infoText}>
              <Text style={styles.infoStrong}>Connexion rapide.</Text> Ton téléphone sera demandé au paiement.
            </Text>
          </GlassContainer>

          {/* 1. Sélection catégorie */}
          <View style={styles.sectionLabel}>
            <Feather name="package" size={12} color="#fff" />
            <Text style={styles.sectionLabelText}>  1. Choisir la catégorie</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCategorySheet(true)}
            activeOpacity={0.7}
          >
            <GlassContainer style={styles.categorySelector}>
              <View>
                <Text style={styles.categorySelectorLabel}>{selectedTicket.name}</Text>
                <Text style={styles.categorySelectorPrice}>{selectedTicket.price.toLocaleString()} FCFA</Text>
              </View>
              <Feather name="chevron-up" size={18} color="#fff" />
            </GlassContainer>
          </TouchableOpacity>

          {/* 2. Saisie téléphone */}
          <View style={[styles.sectionLabel, { marginTop: spacing.md }]}>
            <Feather name="smartphone" size={12} color="#fff" />
            <Text style={styles.sectionLabelText}>  2. Ton numéro Wave</Text>
          </View>

          <GlassContainer style={[styles.phoneRow, telephone.replace(/[^\d]/g, '').length >= 6 && styles.phoneRowActive]}>
            <View style={styles.countryCode}>
              <Text style={styles.codeText}>+221</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              placeholder="77 XXX XX XX"
              placeholderTextColor={colors.textWhiteMuted}
            />
          </GlassContainer>

        </ScrollView>

        {/* Barre d'achat fixe en bas */}
        <View style={styles.bottomBar}>
          <GlassButton
            title={`Payer ${selectedTicket?.price?.toLocaleString() || '0'} FCFA`}
            icon="shopping-cart"
            onPress={handleBuy}
            style={!isValidPhone && styles.buyBtnDisabled}
          />
        </View>
      </KeyboardAvoidingView>

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
          <GlassContainer style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choisir une catégorie</Text>
            {event.tickets.map((t) => (
              <TouchableOpacity
                key={t.name}
                onPress={() => {
                  setSelectedTicket(t)
                  setShowCategorySheet(false)
                }}
                activeOpacity={0.7}
              >
                <GlassContainer
                  style={[
                    styles.sheetItem,
                    selectedTicket.name === t.name && styles.sheetItemSelected,
                  ]}
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
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            ))}
          </GlassContainer>
        </TouchableOpacity>
      </Modal>

      {/* Modal de paiement Wave */}
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
          <GlassContainer style={styles.paySheetContainer}>
            {/* Bouton de fermeture */}
            {paymentEtape === 'confirm' && (
              <TouchableOpacity style={styles.payCloseBtn} onPress={() => setShowPaymentSheet(false)}>
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Étape : confirmation */}
            {paymentEtape === 'confirm' && (
              <>
                <Image source={require('../../assets/wave_logo.png')} style={styles.waveLogo} resizeMode="contain" />
                <Text style={styles.paySheetTitle}>Confirmer le paiement</Text>

                <GlassContainer style={styles.payInfoCard}>
                  <Text style={styles.payEventTitle}>{event.title}</Text>
                  <View style={styles.payTicketRow}>
                    <Text style={styles.payTicketName}>{selectedTicket.name}</Text>
                    <Text style={styles.payTicketPrice}>{selectedTicket.price.toLocaleString()} FCFA</Text>
                  </View>
                </GlassContainer>

                <View style={styles.payPhoneRow}>
                  <Feather name="smartphone" size={14} color={colors.textWhiteMuted} />
                  <Text style={styles.payPhoneText}>+221 {telephone}</Text>
                </View>

                <TouchableOpacity style={styles.confirmPayBtn} onPress={confirmerPaiement} activeOpacity={0.9}>
                  <LinearGradient
                    // Couleurs officielles Wave — marque partenaire, ne pas remplacer par accent
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
                  <Feather name="loader" size={44} color="#fff" />
                </Animated.View>
                <Text style={styles.payStatusTitle}>Paiement en cours</Text>
                <Text style={styles.payStatusSub}>Confirmation Wave...</Text>
              </View>
            )}

            {/* Étape : succès */}
            {paymentEtape === 'success' && (
              <View style={styles.payCenter}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <LinearGradient
                    // Couleurs officielles Wave — marque partenaire
                    colors={['#1AB3E5', '#0D8ABC']} style={styles.payCheckCircle}>
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
                  <LinearGradient
                    // Couleurs officielles Wave — marque partenaire
                    colors={['#1AB3E5', '#0D8ABC']} style={styles.payRetryGradient}>
                    <Feather name="refresh-cw" size={14} color="#fff" />
                    <Text style={styles.payRetryText}>Réessayer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </GlassContainer>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f2a',
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textWhiteMuted,
    fontFamily: fonts.jakarta.regular,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Bouton retour flottant avec cercle glass — top défini avec useSafeAreaInsets
  floatingBack: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: glass.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'hidden',
  },
  // Section héro avec emoji
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroEmoji: {
    fontSize: 64,
  },
  // Carte titre et tags
  detailsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 22,
    color: '#fff',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
    ...textShadow,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.8)',
  },
  // Carte description
  descCard: {
    flexDirection: 'row',
    gap: 7,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  descText: {
    fontSize: 11,
    color: colors.textWhiteMuted,
    fontFamily: fonts.jakarta.regular,
    flex: 1,
    lineHeight: 16,
  },
  // Carte info rapide
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 12,
    marginBottom: 22,
  },
  infoText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.jakarta.regular,
    flex: 1,
    lineHeight: 16,
  },
  infoStrong: {
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },
  // Labels de section
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  sectionLabelText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 12,
    color: '#fff',
    letterSpacing: -0.1,
  },
  // Sélecteur de catégorie
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: spacing.md,
  },
  categorySelectorLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: '#fff',
  },
  categorySelectorPrice: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  // Overlay et conteneur sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 16,
    color: '#fff',
    marginBottom: spacing.md,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  sheetItemSelected: {
    backgroundColor: 'rgba(0,200,255,0.2)',
    borderColor: colors.accent,
  },
  sheetItemLeft: {},
  sheetItemName: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 13,
    color: '#fff',
  },
  sheetItemDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.5)',
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
  // Input téléphone
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 4,
  },
  phoneRowActive: {
    borderColor: '#1AB3E5',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  codeText: {
    fontSize: 13,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
    padding: 0,
    paddingHorizontal: 14,
    outlineStyle: 'none',
  },
  // Barre d'achat en bas
  bottomBar: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  // Modal paiement
  paySheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  paySheetContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  payCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#fff',
    marginBottom: spacing.md,
  },
  payInfoCard: {
    width: '100%',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  payEventTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: '#fff',
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
    color: 'rgba(255,255,255,0.7)',
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
    color: '#fff',
  },
  confirmPayBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
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
    color: '#fff',
    marginTop: spacing.sm,
  },
  payStatusSub: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
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
    color: '#fff',
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
    color: 'rgba(255,255,255,0.6)',
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
})
