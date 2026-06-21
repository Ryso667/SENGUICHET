// Écran détail d'un événement avec sélection de catégorie et paiement
// Design clair : photo large en haut, cartes blanches avec ombre en dessous
// Conserve le flux de paiement Wave/Orange Money existant
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  View, Text,
  TouchableOpacity, StyleSheet, Alert, Modal,
  Platform, Image, ImageBackground, KeyboardAvoidingView,
  Animated, ActivityIndicator, Easing, TextInput, Share,
  useWindowDimensions,
} from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Calendar from 'expo-calendar'
import * as Notifications from 'expo-notifications'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { fonts, spacing, glass, borderRadius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { scale, fontScale, lineHeightScale, isPad } from '../utils/responsive'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import { getDefaultImage } from '../config/images'
import { fetchEvenementDetailPublic } from '../services/eventService'
import { acheterBillet } from '../services/billetService'
import { sauvegarderTicketAcheteur } from '../database/database'
import { formaterDateLisible } from '../utils/dateUtils'
import { useAuth } from '../context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hexToRgba } from '../utils/colors'
import FavoriButton from '../components/FavoriButton'
import CelebrationOverlay from '../components/CelebrationOverlay'
import { hapticMedium, hapticSelection } from '../utils/haptics'

export default function EventDetailScreen({ route, navigation }) {
  const { colors, mode, isDark } = useTheme()
  const { eventId } = route.params
  const { definirTelephone, numeroTel, email } = useAuth()
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors), [colors])

  // Éclaircit une couleur hex (#RRGGBB) — factor 0 = original, 1 = blanc
  const lightenColor = (hex, factor) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lr = Math.round(r + (255 - r) * factor)
    const lg = Math.round(g + (255 - g) * factor)
    const lb = Math.round(b + (255 - b) * factor)
    return `rgb(${lr},${lg},${lb})`
  }

  const [event, setEvent] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [telephone, setTelephone] = useState(numeroTel || '')
  const [quantite, setQuantite] = useState(1)

  // Partage de l'événement via l'API Share native avec lien web
  const partagerEvenement = () => {
    const url = `https://backend-beta-six-39.vercel.app/api/evenements/public/${eventId}/page`
    const message = `🎫 ${event?.title || 'Événement'}${event?.date ? ` — ${formaterDateLisible(event.date)}` : ''}${event?.lieu ? ` à ${event.lieu}` : ''}\n\n${url}`
    Share.share({ message, url, title: event?.title || 'Événement SENGUICHET' })
  }

  // Ajoute l'événement au calendrier natif iOS/Android via expo-calendar
  const ajouterAuCalendrier = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès au calendrier dans les réglages')
      return
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    let calendarId = calendars.length > 0 ? calendars[0].id : null

    if (!calendarId) {
      const defaultCalendarSource =
        Platform.OS === 'ios'
          ? { type: 'default', isLocal: true }
          : { isLocalAccount: true, name: 'SENGUICHET' }
      calendarId = await Calendar.createCalendarAsync({
        title: 'SENGUICHET',
        color: '#5C6BC0',
        entityType: Calendar.EntityTypes.EVENT,
        source: defaultCalendarSource,
        name: 'senguichet',
        ownerAccount: 'senguichet',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      }).catch(() => null)
    }

    if (!calendarId) return

    const debut = new Date(event.date)
    const fin = new Date(debut.getTime() + 2 * 60 * 60 * 1000)

    await Calendar.createEventAsync(calendarId, {
      title: event.title || 'Événement SENGUICHET',
      startDate: debut,
      endDate: fin,
      location: event.lieu || '',
      notes: event.desc || '',
    })

    Alert.alert('Succès', 'Événement ajouté à votre calendrier')
  }

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
  const heroFade = useRef(new Animated.Value(0)).current
  const ticketsDataRef = useRef(null)
  const paiementRef = useRef(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const dateParts = event?.date ? formaterDateLisible(event.date).split(' ') : null
  const dayNumber = dateParts?.[0]
  const monthYear = dateParts?.slice(1).join(' ')

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
        // Animation d'entrée du hero
        Animated.spring(heroFade, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start()
        // Sélectionne par défaut le billet le moins cher
        if (data.tickets.length > 0) {
          setSelectedTicket(data.tickets.reduce((a, b) => a.price < b.price ? a : b))
        }
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
      }
    })()
  }, [eventId, retryCount])

  // Ouvre le modal de paiement à l'étape de confirmation
  const handleBuy = () => {
    hapticMedium()
    if (!selectedTicket) return
    if (event?.date_fin && new Date(event.date_fin) < new Date()) {
      Alert.alert('Événement terminé', 'La date de cet événement est passée. La vente de billets n\'est plus disponible.')
      return
    }
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
        telPropre ? telComplet : null, email, selectedProvider, quantite
      )

      if (!resultat || !resultat.billet) {
        throw new Error('Réponse invalide du serveur')
      }

      await definirTelephone(telComplet)

      // Sauvegarde locale de tous les billets créés
      const ticketsAchetes = resultat.billets || [resultat.billet]
      const ticketsData = ticketsAchetes.map(b => ({
        ...b,
        eventId: event.id,
        eventNom: event.title || resultat.billet.evenement,
        eventDate: event.date,
        eventHeure: event.time,
        eventLieu: event.location,
        telephone: telComplet,
        statut: 'actif',
      }))
      for (const t of ticketsData) {
        await sauvegarderTicketAcheteur(t)
      }

      // Planifie un rappel local J-1 avant l'événement
      try {
        const eventDate = new Date(event.date)
        const rappelDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
        if (rappelDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Rappel SENGUICHET',
              body: `🎫 ${event.title} commence demain !`,
              data: { eventId: event.id },
            },
            trigger: { date: rappelDate },
          })
        }
      } catch {
        // Silencieux — le rappel n'est pas bloquant
      }

      // Redirection vers WebView de paiement ou succès direct
      if (resultat.paiement?.redirectUrl) {
        setShowPaymentSheet(false)
        navigation.replace('WebViewWave', {
          redirectUrl: resultat.paiement.redirectUrl,
          transactionReference: resultat.paiement.reference,
          eventId: event.id,
          ticket: ticketsData[0],
          billets: ticketsData,
        })
      } else {
        setPaymentResult(ticketsData[0])
        setPaymentEtape('success')
        ticketsDataRef.current = ticketsData
        paiementRef.current = resultat.paiement.reference
        setShowCelebration(true)
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={32} color={colors.textSecondary} />
          <Text style={styles.loadingText}>{error}</Text>
          <GlassButton title="Réessayer" icon="refresh-cw" onPress={() => setRetryCount(c => c + 1)} />
        </View>
      </View>
    )
  }

  // État chargement
  if (!event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
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
      {/* Bouton retour flottant — gauche */}
      <TouchableOpacity style={[styles.floatingBack, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Groupe d'actions flottant — cœur, partage, calendrier */}
      <View style={[styles.actionPill, { top: insets.top + 8 }]}>
        <FavoriButton
          eventId={event?.id}
          eventData={{
            title: event?.title,
            date: event?.date,
            location: event?.lieu,
            category: event?.category,
            affiche_url: event?.affiche_url,
          }}
          size={20}
          inactiveColor={colors.textSecondary}
          style={styles.pillButton}
        />
        <View style={[styles.pillDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.pillButton} onPress={partagerEvenement}>
          <Feather name="share-2" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.pillDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.pillButton} onPress={ajouterAuCalendrier}>
          <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Hero banner — fixe en haut (ne défile pas) */}
      <View style={[styles.heroBanner, { marginTop: insets.top + 12 }]}>
        <ImageBackground
          source={event?.affiche_url ? { uri: event.affiche_url } : getDefaultImage(event?.category)}
          style={styles.heroBg}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.65)']}
            style={styles.heroGradient}
          />
          <Animated.View style={[styles.heroContent, {
            paddingTop: insets.top + 60,
            opacity: heroFade,
            transform: [{ translateY: heroFade.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }]}>
            <Text style={styles.heroCategory}>{event.category || 'ÉVÉNEMENT'}</Text>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <View style={[styles.heroDivider, { backgroundColor: colors.accent }]} />
          </Animated.View>
        </ImageBackground>
      </View>

      <Animated.ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}
      >

        {/* Cartes info — fond blanc avec ombre portée */}
        <View style={styles.infoCards}>
          {event.date && (
            <GlassContainer style={styles.infoCard}>
              <View style={[styles.iconBadge, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
                <Feather name="calendar" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.infoDateRow}>
                  <Text style={styles.infoDayNum}>{dayNumber}</Text>
                  <Text style={styles.infoMonth}>{monthYear?.toUpperCase()}</Text>
                </View>
                {!!event.time && (
                  <View style={styles.infoTimeRow}>
                    <Feather name="clock" size={11} color={colors.textTertiary} />
                    <Text style={styles.infoTimeText}>{event.time}</Text>
                  </View>
                )}
              </View>
            </GlassContainer>
          )}

          {!!event.location && (
            <GlassContainer style={styles.infoCard}>
              <View style={[styles.iconBadge, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
                <Feather name="map-pin" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLocationMain} numberOfLines={2}>{event.location}</Text>
                <Text style={styles.infoLocationSub}>Lieu de l'événement</Text>
              </View>
            </GlassContainer>
          )}
        </View>

        {/* Description — carte blanche */}
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
              {selectedTicket.placesDisponibles != null && (
                <View style={styles.priceChip}>
                  <Text style={styles.priceChipText}>{selectedTicket.placesDisponibles}/{selectedTicket.capacite} places</Text>
                </View>
              )}
              <Feather name="chevron-down" size={16} color={colors.textSecondary} />
            </View>
          </GlassContainer>
        </TouchableOpacity>

        {/* Sélecteur de quantité — max 3 tickets par achat */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quantité</Text>
          <Text style={styles.sectionSub}>Maximum 3 billets par achat</Text>
        </View>

        <GlassContainer style={styles.quantiteSelector}>
          <TouchableOpacity
            style={[styles.quantiteBtn, quantite <= 1 && styles.quantiteBtnDisabled]}
            onPress={() => setQuantite(q => Math.max(1, q - 1))}
            disabled={quantite <= 1}
            activeOpacity={0.6}
          >
            <Feather name="minus" size={20} color={quantite <= 1 ? colors.textTertiary : colors.text} />
          </TouchableOpacity>
          <View style={styles.quantiteValueWrap}>
            <Text style={styles.quantiteValue}>{quantite}</Text>
            <Text style={styles.quantiteLabel}>billet{quantite > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.quantiteBtn, quantite >= 3 && styles.quantiteBtnDisabled]}
            onPress={() => setQuantite(q => Math.min(3, q + 1))}
            disabled={quantite >= 3}
            activeOpacity={0.6}
          >
            <Feather name="plus" size={20} color={quantite >= 3 ? colors.textTertiary : colors.text} />
          </TouchableOpacity>
          <View style={styles.quantiteMaxBadge}>
            <Text style={styles.quantiteMaxText}>max 3</Text>
          </View>
        </GlassContainer>

        </Animated.ScrollView>
        {/* Barre d'achat fixe en bas — effet glass */}
        <BlurView tint="dark" intensity={90} style={styles.bottomBar}>
          {event?.date_fin && new Date(event.date_fin) < new Date() ? (
            <View style={[styles.bottomBarTotal, { flex: 1, justifyContent: 'center' }]}>
              <Text style={[styles.bottomBarTotalPrice, { color: '#ef4444' }]}>🏁 Événement terminé</Text>
            </View>
          ) : (
            <>
              <View style={styles.bottomBarTotal}>
                <Text style={styles.bottomBarTotalLabel}>Total</Text>
                <Text style={styles.bottomBarTotalPrice}>{((selectedTicket?.price || 0) * quantite).toLocaleString()} FCFA</Text>
              </View>
              <TouchableOpacity
                onPress={handleBuy}
                activeOpacity={0.9}
                style={styles.buyBtnWrap}
              >
                <LinearGradient
                  colors={[colors.accent, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buyBtnGradient}
                >
                  <Text style={styles.buyBtnText}>Acheter</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </BlurView>

      {/* Modal de sélection de catégorie */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          <TouchableOpacity
            style={styles.sheetOverlayContent}
            activeOpacity={1}
            onPress={() => setShowCategorySheet(false)}
          >
            <GlassContainer intensity={30} style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Choisir une catégorie</Text>
              {event.tickets.map((t) => (
                <TouchableOpacity
                  key={t.name}
                  onPress={() => {
                    hapticSelection()
                    setSelectedTicket(t)
                    setShowCategorySheet(false)
                  }}
                  activeOpacity={0.7}
                >
                  <GlassContainer intensity={30}
                    style={[
                      styles.sheetItem,
                      selectedTicket.name === t.name && {
                        backgroundColor: hexToRgba(colors.accent, 0.2),
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <View style={styles.sheetItemLeft}>
                      <Text style={styles.sheetItemName}>{t.name}</Text>
                      <Text style={styles.sheetItemDesc}>{t.desc || 'Accès standard'}</Text>
                    </View>
                    <View style={styles.sheetItemRight}>
                      <Text style={styles.sheetItemPrice}>{t.price.toLocaleString()} FCFA</Text>
                      {t.placesDisponibles != null && (
                        <Text style={styles.sheetItemPlaces}>{t.placesDisponibles}/{t.capacite} places</Text>
                      )}
                    {selectedTicket.name === t.name && (
                      <View style={[styles.sheetCheck, { backgroundColor: colors.accent }]}>
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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
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
          <GlassContainer intensity={30} style={styles.paySheetContainer}>
            {/* Bouton de fermeture */}
            {paymentEtape === 'confirm' && (
              <TouchableOpacity style={styles.payCloseBtn} onPress={() => setShowPaymentSheet(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Étape : confirmation */}
            {paymentEtape === 'confirm' && (
              <>
                {/* Montant uniquement */}
                <Text style={styles.payAmountLabel}>{selectedTicket.name}{quantite > 1 ? ` × ${quantite}` : ''}</Text>
                <GlassContainer intensity={30} style={[styles.payAmountCard, { borderColor: hexToRgba(colors.accent, 0.27) }]}>
                  <Text style={styles.payAmountValue}>
                    {(selectedTicket.price * quantite).toLocaleString()} FCFA
                  </Text>
                  {quantite > 1 && (
                    <Text style={styles.payAmountDetail}>{selectedTicket.price.toLocaleString()} FCFA × {quantite}</Text>
                  )}
                </GlassContainer>

                {/* Champ téléphone dans le modal */}
                <Text style={styles.modalPhoneLabel}>Ton téléphone</Text>
                <View style={styles.modalPhoneRow}>
                  <Feather name="smartphone" size={16} color={colors.textTertiary} />
                  <Text style={styles.modalPhoneCode}>+221</Text>
                  <TextInput
                    style={styles.modalPhoneInput}
                    value={telephone}
                    onChangeText={(t) => setTelephone(formaterTel(t))}
                    keyboardType="phone-pad"
                    placeholder="77 XXX XX XX"
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.accent}
                    cursorColor={colors.accent}
                  />
                </View>

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
                    <Text style={styles.confirmPayText}>Payer {(selectedTicket.price * quantite).toLocaleString()} FCFA</Text>
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
                <CelebrationOverlay
                  visible={showCelebration}
                  onFinish={() => {
                    setShowCelebration(false)
                    setShowPaymentSheet(false)
                    setTimeout(() => {
                      const data = ticketsDataRef.current || []
                      if (data.length > 1) {
                        navigation.replace('RecuAchat', {
                          reference: paiementRef.current,
                          billetsAchetes: data,
                        })
                      } else if (data.length === 1) {
                        navigation.replace('Ticket', { ticket: data[0] })
                      }
                    }, 400)
                  }}
                />
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

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: scale(120),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: fontScale(13),
    color: colors.textSecondary,
    fontFamily: fonts.jakarta.regular,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Bouton retour flottant — visible sur fond blanc
  floatingBack: {
    position: 'absolute',
    left: spacing.lg,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  actionPill: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 4,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pillButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDivider: {
    width: 1,
    height: 22,
  },
  // Hero banner — photo pleine largeur
  heroBanner: {
    height: scale(280),
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
  },
  heroBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  heroCategory: {
    fontSize: fontScale(12),
    fontFamily: fonts.jakarta.semiBold,
    color: '#90CAF9',
    letterSpacing: scale(3),
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: fontScale(32),
    color: '#fff',
    letterSpacing: scale(-1),
    lineHeight: lineHeightScale(38),
  },
  heroDivider: {
    width: scale(40),
    height: scale(2.5),
    borderRadius: scale(1.5),
    marginTop: scale(14),
  },
  // Badge icône dans les cartes
  iconBadge: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Conteneur des cartes info (date + lieu)
  infoCards: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  infoDateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(8),
  },
  infoDayNum: {
    fontSize: fontScale(28),
    fontFamily: fonts.outfit.extraBold,
    color: colors.text,
    letterSpacing: scale(-1),
  },
  infoMonth: {
    fontSize: fontScale(13),
    fontFamily: fonts.outfit.semiBold,
    color: colors.textSecondary,
    letterSpacing: scale(1.5),
    textTransform: 'uppercase',
  },
  infoTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: scale(4),
  },
  infoTimeText: {
    fontSize: fontScale(12),
    fontFamily: fonts.jakarta.regular,
    color: colors.textTertiary,
  },
  infoLocationMain: {
    fontSize: fontScale(15),
    fontFamily: fonts.outfit.semiBold,
    color: colors.text,
  },
  infoLocationSub: {
    fontSize: fontScale(11),
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  // Carte description
  descCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  descText: {
    fontSize: fontScale(14),
    color: colors.text,
    fontFamily: fonts.jakarta.regular,
    lineHeight: lineHeightScale(24),
  },
  // Sections
  sectionHeader: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(14),
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: fontScale(11),
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: scale(3),
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  categorySelectorLeft: {
    gap: scale(6),
  },
  categorySelectorLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: fontScale(16),
    color: colors.text,
  },
  categorySelectorPrice: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(22),
    color: colors.text,
    letterSpacing: scale(-0.5),
  },
  categorySelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  priceChip: {
    backgroundColor: hexToRgba(colors.accent, 0.12),
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
  },
  priceChipText: {
    fontSize: fontScale(10),
    fontFamily: fonts.jakarta.semiBold,
    color: colors.textSecondary,
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
    width: scale(36),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(16),
    color: colors.text,
    marginBottom: spacing.md,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(14),
    paddingHorizontal: scale(14),
    marginBottom: spacing.sm,
  },
  sheetItemLeft: {},
  sheetItemName: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: fontScale(13),
    color: colors.text,
  },
  sheetItemDesc: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.jakarta.regular,
    marginTop: scale(2),
  },
  sheetItemRight: {
    alignItems: 'flex-end',
    gap: scale(2),
  },
  sheetItemPrice: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(14),
    color: colors.text,
  },
  sheetItemPlaces: {
    fontSize: fontScale(9),
    color: colors.textTertiary,
    fontFamily: fonts.jakarta.regular,
  },
  sheetCheck: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(4),
  },

  // Champ téléphone dans le modal de paiement
  modalPhoneLabel: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: fontScale(12),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: scale(1.5),
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    width: '100%',
  },
  modalPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    width: '100%',
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalPhoneCode: {
    fontFamily: fonts.jakarta.semiBold,
    fontSize: fontScale(15),
    color: colors.textTertiary,
  },
  modalPhoneInput: {
    flex: 1,
    fontSize: fontScale(15),
    fontFamily: fonts.jakarta.semiBold,
    color: colors.text,
    paddingVertical: scale(10),
  },
  // Montant dans le modal de paiement
  payAmountLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: fontScale(14),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: scale(2),
    marginBottom: spacing.xs,
  },
  payAmountValue: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(40),
    color: colors.text,
    letterSpacing: scale(-1.5),
  },
  // Carte prix dans le modal paiement avec bordure teintée
  payAmountCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  // Barre d'achat en bas — compacte avec CTA fort
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    backgroundColor: glass.darkBgHeavy,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
    gap: scale(12),
  },
  bottomBarTotal: {
    gap: 2,
  },
  bottomBarTotalLabel: {
    fontSize: fontScale(9),
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: scale(1.2),
  },
  bottomBarTotalPrice: {
    fontSize: fontScale(22),
    fontFamily: fonts.outfit.extraBold,
    color: '#fff',
    letterSpacing: scale(-0.3),
  },
  buyBtnWrap: {
    flex: 1,
    borderRadius: scale(14),
    overflow: 'hidden',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(14),
  },
  buyBtnText: {
    fontSize: fontScale(16),
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    letterSpacing: scale(-0.1),
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
    top: scale(16),
    right: scale(16),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    paddingVertical: scale(18),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(14),
  },
  confirmBtnLogo: {
    width: scale(36),
    height: scale(36),
  },
  confirmPayText: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(16),
    color: '#fff',
  },
  payCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: spacing.xl,
    minHeight: scale(260),
  },
  payStatusTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: fontScale(16),
    color: '#fff',
    marginTop: spacing.sm,
  },
  payStatusSub: {
    fontFamily: fonts.jakarta.regular,
    fontSize: fontScale(13),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  payCheckCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paySuccessTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(20),
    color: '#fff',
  },
  payErrorCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payErrorTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(20),
    color: colors.red,
  },
  payErrorDetail: {
    fontFamily: fonts.jakarta.regular,
    fontSize: fontScale(12),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  payRetryBtn: {
    marginTop: scale(8),
    borderRadius: 100,
    overflow: 'hidden',
  },
  payRetryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(28),
    paddingVertical: scale(14),
  },
  // Sélecteur de quantité — carte glass dans le contenu scrollable
  quantiteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(20),
    paddingVertical: scale(18),
    paddingHorizontal: scale(20),
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  quantiteBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: hexToRgba(colors.accent, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: hexToRgba(colors.accent, 0.2),
  },
  quantiteBtnDisabled: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    opacity: 0.5,
  },
  quantiteValueWrap: {
    alignItems: 'center',
    minWidth: scale(60),
  },
  quantiteValue: {
    fontSize: fontScale(32),
    fontFamily: fonts.outfit.extraBold,
    color: colors.text,
    letterSpacing: scale(-1),
    lineHeight: lineHeightScale(36),
  },
  quantiteLabel: {
    fontSize: fontScale(11),
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  quantiteMaxBadge: {
    position: 'absolute',
    right: scale(16),
    top: scale(8),
    backgroundColor: hexToRgba(colors.accent, 0.08),
    borderRadius: scale(10),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  quantiteMaxText: {
    fontSize: fontScale(9),
    fontFamily: fonts.jakarta.semiBold,
    color: colors.textTertiary,
    letterSpacing: scale(0.5),
  },
  // Détail du calcul dans le modal
  payAmountDetail: {
    fontSize: fontScale(11),
    fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginTop: scale(4),
  },
  payRetryText: {
    fontFamily: fonts.outfit.bold,
    fontSize: fontScale(14),
    color: '#fff',
  },
})
