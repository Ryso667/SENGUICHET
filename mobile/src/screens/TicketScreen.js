// Affichage du ticket avec QR code — version glass
// Fond : image floutée de l'événement
// Carte ticket centrale avec animation pulse du QR
import { useRef, useEffect } from 'react'
import { View, Text, Animated, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { fonts, spacing, borderRadius, glass, textShadow } from '../constants/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import { formaterDateLisible } from '../utils/dateUtils'

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const insets = useSafeAreaInsets()
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])
    const loop = Animated.loop(sequence)
    loop.start()
    return () => loop.stop()
  }, [pulseAnim])

  return (
    <View style={styles.container}>
      <BlurBackground category={ticket?.categorie} showBlur={true} />

      {/* Bouton retour */}
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Carte ticket */}
        <GlassContainer style={styles.ticketCard} blurType="light" intensity={70}>
          <Animated.View style={[styles.qrWrap, { transform: [{ scale: pulseAnim }] }]}>
            <QRCode
              value={ticket?.hmac || ticket?.numero || 'senguichet-ticket'}
              size={200}
              backgroundColor="transparent"
              color="#fff"
            />
          </Animated.View>

          <View style={styles.ticketInfo}>
            <Text style={styles.eventName}>{ticket?.eventNom || 'Événement'}</Text>
            <Text style={styles.eventMeta}>
              {ticket?.categorie} · {formaterDateLisible(ticket?.eventDate)}
            </Text>
          </View>
        </GlassContainer>

        {/* Actions */}
        <View style={styles.actions}>
          <GlassChip label="Partager" icon="share" onPress={() => Alert.alert('Bientôt disponible', 'Le partage de ticket arrive bientôt')} />
          <GlassChip label="PDF" icon="file-text" onPress={() => Alert.alert('Bientôt disponible', 'L\'export PDF arrive bientôt')} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute', left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  ticketCard: {
    padding: spacing.lg, alignItems: 'center', width: '100%',
  },
  qrWrap: {
    padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.lg,
  },
  ticketInfo: { alignItems: 'center' },
  eventName: {
    fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3,
    ...textShadow,
  },
  eventMeta: {
    fontSize: 13, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)', marginTop: 4,
  },
  actions: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
})
