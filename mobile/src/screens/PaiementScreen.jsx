// Écran de paiement avec simulation de transaction
// Affiche l'animation de paiement, le résultat, et navigue vers le ticket
import { useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { acheterBillet } from '../services/billetService'
import { statutPaiement } from '../services/paiementService'
import BuyerLayout from '../components/BuyerLayout'

export default function PaiementScreen({ route, navigation }) {
  const { eventId, eventTitle, ticket, telephone } = route.params
  const [etape, setEtape] = useState('init') // 'init' | 'pending' | 'success' | 'failed'
  const [billet, setBillet] = useState(null)
  const [error, setError] = useState('')
  const spinAnim = useRef(new Animated.Value(0)).current

  // Animation de rotation du spinner
  useEffect(() => {
    if (etape === 'pending') {
      const anim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      anim.start()
      return () => anim.stop()
    }
  }, [etape, spinAnim])

  // Initialise l'achat au montage
  useEffect(() => {
    (async () => {
      try {
        const resultat = await acheterBillet(eventId, ticket.id, telephone)
        if (!resultat || !resultat.transaction) {
          throw new Error('Réponse invalide du serveur')
        }
        setEtape('pending')

        // Simulation : attend 2 secondes, puis vérifie le statut
        // Provider SIMULATION : le provider simulation répond toujours SUCCESS après 2s
        // Provider réel (plus tard) : WebView avec redirectUrl pour Wave/Orange Money
        await new Promise(resolve => setTimeout(resolve, 2000))

        const statut = await statutPaiement(resultat.transaction.reference)
        if (statut.statut === 'SUCCESS') {
          setBillet(statut.billet || resultat.billet)
          setEtape('success')
        } else if (statut.statut === 'FAILED') {
          setEtape('failed')
          setError('Le paiement a échoué. Veuillez réessayer.')
        } else {
          setEtape('failed')
          setError('Statut inconnu. Contactez le support.')
        }
      } catch (err) {
        setEtape('failed')
        setError(err.message || 'Erreur de connexion au serveur')
      }
    })()
  }, [])

  // Redirection automatique vers le ticket après succès
  useEffect(() => {
    if (etape === 'success' && billet) {
      const timer = setTimeout(() => {
        navigation.replace('Ticket', { ticket: billet })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [etape, billet, navigation])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const retry = () => {
    setEtape('init')
    setError('')
    // Le useEffect de montage ne se relance pas automatiquement
    // On force en réinitialisant puis en appelant manuellement
    navigation.replace('Paiement', { eventId, eventTitle, ticket, telephone })
  }

  return (
    <BuyerLayout>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Bouton retour */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={18} color={colors.slate} />
          </TouchableOpacity>

          {/* Titre événement */}
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          <Text style={styles.ticketInfo}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>

          {/* Zone centrale : état du paiement */}
          <View style={styles.centerArea}>
            {etape === 'init' && (
              <View style={styles.statusBox}>
                <Feather name="clock" size={40} color={colors.accent} />
                <Text style={styles.statusText}>Initialisation...</Text>
              </View>
            )}

            {etape === 'pending' && (
              <View style={styles.statusBox}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Feather name="loader" size={40} color={colors.accent} />
                </Animated.View>
                <Text style={styles.statusText}>Paiement en cours...</Text>
                <Text style={styles.statusSub}>Ne quittez pas cette page</Text>
              </View>
            )}

            {etape === 'success' && (
              <View style={styles.statusBox}>
                <LinearGradient colors={['#00E5A0', '#00C8FF']} style={styles.checkCircle}>
                  <Feather name="check" size={36} color="#fff" />
                </LinearGradient>
                <Text style={styles.successText}>Paiement réussi !</Text>
                <Text style={styles.statusSub}>Redirection vers votre ticket...</Text>
              </View>
            )}

            {etape === 'failed' && (
              <View style={styles.statusBox}>
                <View style={styles.errorCircle}>
                  <Feather name="x" size={36} color="#fff" />
                </View>
                <Text style={styles.errorText}>Paiement échoué</Text>
                <Text style={styles.errorDetail}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
                  <LinearGradient colors={['#00C8FF', '#0077FF']} style={styles.retryGradient}>
                    <Feather name="refresh-cw" size={14} color="#fff" />
                    <Text style={styles.retryText}>Réessayer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Pied de page */}
          <View style={styles.footer}>
            <Feather name="lock" size={11} color={colors.muted} />
            <Text style={styles.footerText}>Paiement sécurisé via simulation</Text>
          </View>
        </View>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  eventTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 18,
    color: colors.slate,
    textAlign: 'center',
  },
  ticketInfo: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
    marginTop: 4,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    alignItems: 'center',
    gap: 14,
  },
  statusText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: colors.slate,
  },
  statusSub: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: colors.green,
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 20,
    color: colors.red,
  },
  errorDetail: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    marginTop: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  retryText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
  },
})
