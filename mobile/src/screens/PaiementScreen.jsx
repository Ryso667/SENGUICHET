// Écran de paiement avec champ téléphone et double confirmation avant achat
// Le téléphone est demandé ici (pas dans EventDetailScreen) pour les utilisateurs sociaux
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { acheterBillet, statutPaiement } from '../services/billetService'
import BuyerLayout from '../components/BuyerLayout'
import { useAuth } from '../context/AuthContext'

export default function PaiementScreen({ route, navigation }) {
  const { eventId, eventTitle, ticket, telephone: telParam } = route.params
  const { definirTelephone, numeroTel, profil } = useAuth()
  const [telephone, setTelephone] = useState(telParam || numeroTel || '')
  const [etape, setEtape] = useState('saisie') // 'saisie' | 'confirm' | 'pending' | 'success' | 'failed'
  const [billet, setBillet] = useState(null)
  const [error, setError] = useState('')
  const spinAnim = useRef(new Animated.Value(0)).current
  const [spinning, setSpinning] = useState(false)
  const [provider, setProvider] = useState(null) // 'WAVE' | 'ORANGE_MONEY' | null
  const [referencePaiement, setReferencePaiement] = useState(null)

  const demarrerPaiement = useCallback(async (providerName) => {
    if (!providerName) return
    setProvider(providerName)
    setEtape('pending')
    setSpinning(true)
    const anim = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    anim.start()

    try {
      const telPropre = telephone.replace(/[^\d]/g, '')
      const telComplet = telPropre.startsWith('221') ? `+${telPropre}` : `+221${telPropre}`

      const resultat = await acheterBillet(eventId, ticket.id, telComplet, profil?.email, providerName)
      anim.stop()
      setSpinning(false)

      if (!resultat || !resultat.billet) {
        throw new Error('Réponse invalide du serveur')
      }

      await definirTelephone(telComplet)

      // Sera remplacé par la navigation vers les écrans de paiement
      if (providerName === 'WAVE' && resultat.paiement?.redirectUrl) {
        setReferencePaiement(resultat.paiement.reference)
        navigation.replace('WebViewWave', {
          redirectUrl: resultat.paiement.redirectUrl,
          transactionReference: resultat.paiement.reference,
          eventId,
          ticket: { ...resultat.billet, eventId },
        })
      } else if (providerName === 'ORANGE_MONEY') {
        setReferencePaiement(resultat.paiement.reference)
        navigation.replace('PaiementOrange', {
          transactionReference: resultat.paiement.reference,
          montant: ticket.price,
          eventId,
          ticket: { ...resultat.billet, eventId },
          telephone: telComplet,
        })
      } else {
        // Simulation (fallback)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setBillet({ ...resultat.billet, eventId })
        setEtape('success')
      }
    } catch (err) {
      anim.stop()
      setSpinning(false)
      setEtape('failed')
      setError(err.message || 'Erreur de connexion au serveur')
    }
  }, [eventId, ticket, telephone, spinAnim, definirTelephone, profil, navigation])

  useEffect(() => {
    if (etape === 'success' && billet) {
      const timer = setTimeout(() => {
        navigation.replace('Ticket', { ticket: billet })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [etape, billet, navigation])

  const handleConfirm = () => {
    if (!telephone || telephone.replace(/[^\d]/g, '').length < 6) {
      return
    }
    setEtape('confirm')
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <View style={s.container}>

          {/* Étape 0 : Saisie du téléphone */}
          {etape === 'saisie' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <Text style={s.eventTitleMin}>{eventTitle}</Text>
              <Text style={s.ticketInfoMin}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>

              <View style={s.phoneSection}>
                <Feather name="smartphone" size={22} color={colors.accent} />
                <Text style={s.phoneTitle}>Ton numéro Wave ou Orange Money</Text>
                <Text style={s.phoneSubtitle}>Pour recevoir ton billet et le paiement</Text>

                <View style={s.phoneRow}>
                  <View style={s.countryCode}>
                    <Text style={s.codeText}>+221</Text>
                  </View>
                  <TextInput
                    style={s.phoneInput}
                    value={telephone}
                    onChangeText={setTelephone}
                    keyboardType="phone-pad"
                    placeholder="77 XXX XX XX"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={s.continueBtn}
                onPress={handleConfirm}
                activeOpacity={0.9}
                disabled={!telephone || telephone.replace(/[^\d]/g, '').length < 6}
              >
                <LinearGradient
                  colors={['#00C8FF', '#0077FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.continueGradient}
                >
                  <Text style={s.continueText}>Continuer</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Étape 1 : Confirmation */}
          {etape === 'confirm' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setEtape('saisie')}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <View style={s.confirmCard}>
                <View style={s.confirmHeader}>
                  <Feather name="shopping-bag" size={22} color={colors.accent} />
                  <Text style={s.confirmTitle}>Confirmer l'achat</Text>
                </View>

                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Événement</Text>
                  <Text style={s.detailValue}>{eventTitle}</Text>
                </View>
                <View style={s.divider} />

                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Catégorie</Text>
                  <Text style={s.detailValue}>{ticket.name}</Text>
                </View>
                <View style={s.divider} />

                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Montant</Text>
                  <Text style={s.detailValue}>{ticket.price?.toLocaleString()} FCFA</Text>
                </View>
                <View style={s.divider} />

                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Téléphone</Text>
                  <Text style={s.detailValue}>+221 {telephone.replace(/[^\d]/g, '').slice(-9)}</Text>
                </View>
              </View>

              <View style={s.confirmActions}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.payBtn}
                  onPress={() => setEtape('choix')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#00C8FF', '#0077FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.payGradient}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.payText}>Confirmer le paiement</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Étape 1.5 : Choix du moyen de paiement */}
          {etape === 'choix' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setEtape('confirm')}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <Text style={s.eventTitleMin}>{eventTitle}</Text>
              <Text style={s.ticketInfoMin}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>

              <View style={s.providerSection}>
                <Text style={s.providerTitle}>Choisis ton moyen de paiement</Text>

                <TouchableOpacity
                  style={[s.providerCard, provider === 'WAVE' && s.providerCardSelected]}
                  onPress={() => demarrerPaiement('WAVE')}
                  activeOpacity={0.8}
                >
                  <View style={s.providerIcon}>
                    <Feather name="zap" size={24} color="#6366F1" />
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>Wave</Text>
                    <Text style={s.providerDesc}>Paiement rapide via l'app Wave</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mid} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.providerCard, provider === 'ORANGE_MONEY' && s.providerCardSelected]}
                  onPress={() => demarrerPaiement('ORANGE_MONEY')}
                  activeOpacity={0.8}
                >
                  <View style={s.providerIcon}>
                    <Feather name="smartphone" size={24} color="#FF6B00" />
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>Orange Money</Text>
                    <Text style={s.providerDesc}>Paiement par code OTP depuis ton téléphone</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mid} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Étape 2 : Paiement en cours */}
          {etape === 'pending' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>
              <Text style={s.eventTitle}>{eventTitle}</Text>
              <Text style={s.ticketInfo}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>
              <View style={s.centerArea}>
                <View style={s.statusBox}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Feather name="loader" size={40} color={colors.accent} />
                  </Animated.View>
                  <Text style={s.statusText}>Paiement en cours...</Text>
                  <Text style={s.statusSub}>Ne quittez pas cette page</Text>
                </View>
              </View>
            </>
          )}

          {/* Étape 3 : Succès */}
          {etape === 'success' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>
              <Text style={s.eventTitle}>{eventTitle}</Text>
              <Text style={s.ticketInfo}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>
              <View style={s.centerArea}>
                <View style={s.statusBox}>
                  <LinearGradient colors={['#00E5A0', '#00C8FF']} style={s.checkCircle}>
                    <Feather name="check" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={s.successText}>Paiement réussi !</Text>
                  <Text style={s.statusSub}>Redirection vers votre ticket...</Text>
                </View>
              </View>
            </>
          )}

          {/* Étape 4 : Échec */}
          {etape === 'failed' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>
              <Text style={s.eventTitle}>{eventTitle}</Text>
              <Text style={s.ticketInfo}>{ticket.name} — {ticket.price?.toLocaleString()} FCFA</Text>
              <View style={s.centerArea}>
                <View style={s.statusBox}>
                  <View style={s.errorCircle}>
                    <Feather name="x" size={36} color="#fff" />
                  </View>
                  <Text style={s.errorText}>Paiement échoué</Text>
                  <Text style={s.errorDetail}>{error}</Text>
                  <TouchableOpacity
                    style={s.retryBtn}
                    onPress={() => setEtape('saisie')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.retryGradient}>
                      <Feather name="refresh-cw" size={14} color="#fff" />
                      <Text style={s.retryText}>Réessayer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={s.footer}>
            <Feather name="lock" size={11} color={colors.muted} />
            <Text style={s.footerText}>Paiement sécurisé</Text>
          </View>
        </View>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const s = StyleSheet.create({
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
  eventTitleMin: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.slate,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  ticketInfoMin: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.xl,
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

  // Section téléphone
  phoneSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  phoneTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: colors.slate,
    marginTop: spacing.sm,
  },
  phoneSubtitle: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
    marginBottom: spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: '100%',
    ...shadows.sm,
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

  // Bouton continuer
  continueBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: '#fff',
  },

  // Carte de confirmation
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadows.lg,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontFamily: fonts.outfit.bold,
    fontSize: 17,
    color: colors.slate,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 12,
    color: colors.mid,
  },
  detailValue: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.slate,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cancelText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.mid,
  },
  payBtn: {
    flex: 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  payGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  payText: {
    fontFamily: fonts.outfit.bold,
    fontSize: 14,
    color: '#fff',
  },

  // Résultats
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
  providerSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  providerTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: colors.slate,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  providerCardSelected: {
    borderColor: '#6366F1',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontFamily: fonts.outfit.bold,
    fontSize: 15,
    color: colors.slate,
  },
  providerDesc: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 11,
    color: colors.mid,
    marginTop: 2,
  },
})
