// Écran détail d'un événement avec sélection de catégorie et paiement
// Design immersif : BlurBackground + GlassContainer pour tous les éléments
// Conserve le flux de paiement Wave/Orange Money existant
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView,
  TouchableOpacity, StyleSheet, Alert, Modal,
  Platform, Image, KeyboardAvoidingView,
  Animated, ActivityIndicator, Easing, TextInput,
  useWindowDimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, glass, categoryGradients, textShadow } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import { getDefaultImage } from '../config/images'
import { fetchEvenementDetailPublic } from '../services/eventService'
import { acheterBillet } from '../services/billetService'
import { formaterDateLisible } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params
  const { definirTelephone, numeroTel, email } = useAuth()
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const [event, setEvent] = useState(null)
  const catColor = event?.category ? getDefaultImage(event.category).bg : colors.accent
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [telephone, setTelephone] = useState(numeroTel || '')

  // Formate le numéro en groupes XX XXX XX XX, limité à 9 chiffres
  const formaterTel = (texte) => {
    const chiffres = texte.replace(/\D/g, '').slice(0, 9)
    let formate = ''
    for (let i = 0; i < chiffres.length; i++) {
      if (i === 2 || i === 5 || i === 7) formate += ' '
      formate += chiffres[i]
    }
    return formate
  }
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [paymentEtape, setPaymentEtape] = useState('confirm') // confirm | pending | success | failed
  const [paymentError, setPaymentError] = useState('')
  const [paymentResult, setPaymentResult] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState('WAVE')
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
    if (!selectedTicket) return
    setShowPaymentSheet(true)
    setPaymentEtape('confirm')
    setSelectedProvider('WAVE')
  }

  // Déclenche l'appel API d'achat et gère les étapes de paiement
  const confirmerPaiement = async () => {
    const telPropre = telephone.replace(/[^\d]/g, '')
    if (!telPropre || telPropre.length < 9) {
      setPaymentError("Renseigne ton numéro pour confirmer le paiement")
      setPaymentEtape('failed')
      return
    }

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
      const telComplet = telPropre.startsWith('221') ? `+${telPropre}` : `+221${telPropre}`
      const resultat = await acheterBillet(
        event.id, selectedTicket.id,
        telPropre ? telComplet : null, email, selectedProvider
      )

      if (!resultat || !resultat.billet) {
        throw new Error('Réponse invalide du serveur')
      }

      await definirTelephone(telComplet)

      // Redirection vers WebView de paiement ou succès direct
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fond immersif plein écran */}
      <BlurBackground category={event?.category} />

      {/* Bouton retour flottant avec cercle glass */}
      <TouchableOpacity style={[styles.floatingBack, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero invitation — titre XXL + date mise en avant */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroCategory, { color: catColor }]}>{event.category || 'ÉVÉNEMENT'}</Text>
          <Text style={styles.heroTitle}>{event.title}</Text>

          <View style={[styles.heroDivider, { backgroundColor: catColor }]} />

          {event.date && (
            <GlassContainer style={styles.heroDateCard}>
              <Feather name="calendar" size={18} color={catColor} />
              <View>
                <Text style={styles.heroDateDay}>
                  {formaterDateLisible(event.date).toUpperCase()}
                </Text>
                {!!event.time && (
                  <View style={styles.heroTimeRow}>
                    <Feather name="clock" size={11} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.heroTimeText}>{event.time}</Text>
                  </View>
                )}
              </View>
            </GlassContainer>
          )}

          {!!event.location && (
            <View style={styles.heroLocationRow}>
              <Feather name="map-pin" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.heroLocationText} numberOfLines={2}>{event.location}</Text>
            </View>
          )}
        </View>

        {/* Description — carte large */}
        {!!event.desc && (
          <GlassContainer style={styles.descCard}>
            <Text style={styles.descText}>{event.desc}</Text>
          </GlassContainer>
        )}

        {/* Section catégorie de billet */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégorie</Text>
          <Text style={styles.sectionSub}>Sélectionne ton billet</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowCategorySheet(true)}
          activeOpacity={0.7}
        >
          <GlassContainer style={styles.categorySelector}>
            <View style={styles.categorySelectorLeft}>
              <Text style={styles.categorySelectorLabel}>{selectedTicket.name}</Text>
              <Text style={styles.categorySelectorPrice}>{selectedTicket.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.categorySelectorRight}>
              <View style={styles.priceChip}>
                <Text style={styles.priceChipText}>Places limitées</Text>
              </View>
              <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </GlassContainer>
        </TouchableOpacity>

        {/* Téléphone — après le choix de la catégorie */}
        <Text style={styles.formLabel}>Téléphone</Text>
        <GlassContainer style={styles.formPhoneRow}>
          <Feather name="smartphone" size={16} color="rgba(255,255,255,0.4)" />
          <Text style={styles.formCodeText}>+221</Text>
          <TextInput
            style={styles.formPhoneInput}
            value={telephone}
            onChangeText={(t) => setTelephone(formaterTel(t))}
            keyboardType="phone-pad"
            placeholder="77 XXX XX XX"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
        </GlassContainer>

        </ScrollView>

        {/* Barre d'achat fixe en bas */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarTotal}>
            <Text style={styles.bottomBarTotalLabel}>Total</Text>
            <Text style={styles.bottomBarTotalPrice}>{selectedTicket?.price?.toLocaleString() || '0'} FCFA</Text>
          </View>
          <TouchableOpacity
            onPress={handleBuy}
            activeOpacity={0.9}
            style={styles.buyBtnWrap}
          >
            <LinearGradient
              colors={[catColor, `${catColor}88`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buyBtnGradient}
            >
              <Text style={styles.buyBtnText}>Acheter</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      {/* Modal de sélection de catégorie */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <LinearGradient
            colors={categoryGradients[event?.category] || categoryGradients.default}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TouchableOpacity
            style={styles.sheetOverlayContent}
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
                      selectedTicket.name === t.name && {
                        backgroundColor: `${catColor}33`,
                        borderColor: catColor,
                      },
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
                      <View style={[styles.sheetCheck, { backgroundColor: catColor }]}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                    </View>
                  </GlassContainer>
                </TouchableOpacity>
              ))}
            </GlassContainer>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de paiement Wave — avec gestion clavier */}
      <Modal
        visible={showPaymentSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentSheet(false)}
      >
        <View style={styles.paySheetOverlay}>
          <LinearGradient
            colors={categoryGradients[event?.category] || categoryGradients.default}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TouchableOpacity
            style={styles.paySheetOverlayContent}
            activeOpacity={1}
            onPress={() => paymentEtape === 'confirm' && setShowPaymentSheet(false)}
          >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                {/* Montant uniquement */}
                <Text style={styles.payAmountLabel}>{selectedTicket.name}</Text>
                <Text style={[styles.payAmountValue, { color: catColor }]}>
                  {selectedTicket.price.toLocaleString()} FCFA
                </Text>

                {/* Bouton de paiement Wave — mobile money */}
                <TouchableOpacity
                  style={styles.confirmPayBtn}
                  onPress={confirmerPaiement}
                  activeOpacity={0.9}
                >
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
          </KeyboardAvoidingView>
        </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  // Hero section — invitation XXL
  heroSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  heroCategory: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 42,
    color: '#fff',
    letterSpacing: -1.5,
    lineHeight: 48,
    ...textShadow,
  },
  heroDivider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    marginVertical: 20,
  },
  // Carte date mise en avant
  heroDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
  },
  heroDateDay: {
    fontSize: 16,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  heroTimeText: {
    fontSize: 12,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.5)',
  },
  // Localisation
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  heroLocationText: {
    fontSize: 13,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  // Carte description — épurée, généreuse
  descCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  descText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.jakarta.regular,
    lineHeight: 26,
  },
  // Sections
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
  },
  // Sélecteur de catégorie premium
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  categorySelectorLeft: {
    gap: 6,
  },
  categorySelectorLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: '#fff',
  },
  categorySelectorPrice: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.5,
  },
  categorySelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  priceChipText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.5)',
  },
  // Overlay et conteneur sheet
  sheetOverlay: {
    flex: 1,
  },
  sheetOverlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
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
  sheetItemLeft: {},
  sheetItemName: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 13,
    color: '#fff',
    ...textShadow,
  },
  sheetItemDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.jakarta.regular,
    marginTop: 2,
    ...textShadow,
  },
  sheetItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sheetItemPrice: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
    ...textShadow,
  },
  sheetItemPlaces: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: fonts.jakarta.regular,
    ...textShadow,
  },
  sheetCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Champ téléphone sur la page principale — après sélection catégorie
  formLabel: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  formPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  formCodeText: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  formPhoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
    paddingVertical: 10,
  },
  // Montant dans le modal de paiement
  payAmountLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  payAmountValue: {
    fontFamily: fonts.outfit.bold,
    fontSize: 40,
    letterSpacing: -1.5,
    marginBottom: spacing.xl,
    ...textShadow,
  },
  // Barre d'achat en bas — premium
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    backgroundColor: 'rgba(15,15,42,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  bottomBarTotal: {
    gap: 2,
  },
  bottomBarTotalLabel: {
    fontSize: 10,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  bottomBarTotalPrice: {
    fontSize: 22,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  buyBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  buyBtnText: {
    fontSize: 16,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
    letterSpacing: -0.2,
  },
  // Modal paiement
  paySheetOverlay: {
    flex: 1,
  },
  paySheetOverlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
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
  confirmPayBtn: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  confirmPayGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  confirmBtnLogo: {
    width: 36,
    height: 36,
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
