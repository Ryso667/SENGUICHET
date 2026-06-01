// Écran de paiement Orange Money (OTP)
// L'utilisateur entre son numéro, le code OTP reçu par #144#,
// et son code PIN. Le backend crypte le PIN et initie le paiement.

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { appelAPI } from '../services/apiService'
import BuyerLayout from '../components/BuyerLayout'

export default function PaiementOrangeScreen({ route, navigation }) {
  const { transactionReference, montant, eventId, ticket, telephone } = route.params
  const [msisdn, setMsisdn] = useState(telephone || '')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState('saisie') // saisie | pending | success | failed
  const [erreur, setErreur] = useState('')

  const handlePaiement = async () => {
    if (!msisdn || !otp || !pin) {
      Alert.alert('Champs requis', 'Remplis tous les champs')
      return
    }

    setLoading(true)
    setEtape('pending')

    try {
      const resultat = await appelAPI('/paiements/orange/confirmer', {
        method: 'POST',
        body: {
          msisdn,
          otp,
          encryptedPin: pin,
          montant,
          reference: transactionReference,
        },
      })

      if (resultat?.success) {
        setEtape('success')
        setTimeout(() => {
          navigation.replace('Ticket', { ticket })
        }, 2000)
      } else {
        setEtape('failed')
        setErreur(resultat?.message || 'Paiement échoué')
      }
    } catch (err) {
      setEtape('failed')
      setErreur(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          {etape === 'saisie' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={18} color={colors.slate} />
              </TouchableOpacity>

              <View style={s.infoRow}>
                <Feather name="smartphone" size={20} color={colors.accent} />
                <View>
                  <Text style={s.infoTitle}>Orange Money</Text>
                  <Text style={s.infoSub}>{montant?.toLocaleString()} FCFA</Text>
                </View>
              </View>

              <View style={s.form}>
                <Text style={s.stepTitle}>1. Ton numéro Orange Money</Text>
                <View style={s.inputRow}>
                  <View style={s.codeBox}><Text style={s.codeText}>+221</Text></View>
                  <TextInput
                    style={s.input}
                    value={msisdn.replace('+221', '')}
                    onChangeText={t => setMsisdn('+221' + t.replace(/[^\d]/g, ''))}
                    keyboardType="phone-pad"
                    placeholder="77 XXX XX XX"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <Text style={s.stepTitle}>2. Code OTP</Text>
                <Text style={s.stepHint}>Compose #144# depuis ton téléphone Orange, saisis le code reçu</Text>
                <TextInput
                  style={s.input}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="Ex: 123456"
                  placeholderTextColor={colors.muted}
                  maxLength={8}
                />

                <Text style={s.stepTitle}>3. Code PIN Orange Money</Text>
                <TextInput
                  style={s.input}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  placeholder="Ton code secret"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  maxLength={4}
                />

                <TouchableOpacity
                  style={s.payBtn}
                  onPress={handlePaiement}
                  activeOpacity={0.9}
                  disabled={loading}
                >
                  <LinearGradient colors={['#FF6B00', '#FF8C00']} style={s.payGradient}>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.payText}>Payer {montant?.toLocaleString()} FCFA</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={s.footer}>
                <Feather name="info" size={11} color={colors.muted} />
                <Text style={s.footerText}>Le code PIN est crypté et jamais stocké</Text>
              </View>
            </>
          )}

          {etape === 'pending' && (
            <View style={s.centerBox}>
              <Feather name="loader" size={40} color="#FF6B00" />
              <Text style={s.statusText}>Paiement en cours...</Text>
              <Text style={s.statusSub}>Patientez, votre paiement est traité</Text>
            </View>
          )}

          {etape === 'success' && (
            <View style={s.centerBox}>
              <LinearGradient colors={['#00E5A0', '#00C8FF']} style={s.checkCircle}>
                <Feather name="check" size={36} color="#fff" />
              </LinearGradient>
              <Text style={s.successText}>Paiement réussi !</Text>
              <Text style={s.statusSub}>Redirection vers votre ticket...</Text>
            </View>
          )}

          {etape === 'failed' && (
            <View style={s.centerBox}>
              <View style={s.errorCircle}>
                <Feather name="x" size={36} color="#fff" />
              </View>
              <Text style={s.errorText}>Paiement échoué</Text>
              <Text style={s.statusSub}>{erreur}</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => setEtape('saisie')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FF6B00', '#FF8C00']} style={s.retryGradient}>
                  <Feather name="refresh-cw" size={14} color="#fff" />
                  <Text style={s.retryText}>Réessayer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: borderRadius.sm,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoTitle: { fontFamily: fonts.outfit.bold, fontSize: 17, color: colors.slate },
  infoSub: { fontFamily: fonts.jakarta.regular, fontSize: 13, color: colors.mid, marginTop: 2 },
  form: { gap: spacing.sm },
  stepTitle: { fontFamily: fonts.outfit.semiBold, fontSize: 14, color: colors.slate, marginTop: spacing.md },
  stepHint: { fontFamily: fonts.jakarta.regular, fontSize: 11, color: colors.mid, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: colors.border, borderRadius: borderRadius.md,
    borderTopRightRadius: 0, borderBottomRightRadius: 0,
  },
  codeText: { fontSize: 13, fontFamily: fonts.jakarta.semiBold, color: colors.slate },
  input: {
    fontFamily: fonts.jakarta.semiBold, fontSize: 14, color: colors.slate,
    backgroundColor: colors.white, borderRadius: borderRadius.md,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  payBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: spacing.xl, ...shadows.md },
  payGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  payText: { fontFamily: fonts.outfit.bold, fontSize: 15, color: '#fff' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  statusText: { fontFamily: fonts.outfit.semiBold, fontSize: 16, color: colors.slate },
  statusSub: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.mid, textAlign: 'center' },
  checkCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  successText: { fontFamily: fonts.outfit.bold, fontSize: 20, color: '#10b981' },
  errorCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: fonts.outfit.bold, fontSize: 20, color: '#ef4444' },
  retryBtn: { marginTop: 8, borderRadius: 100, overflow: 'hidden' },
  retryGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  retryText: { fontFamily: fonts.outfit.bold, fontSize: 14, color: '#fff' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: spacing.lg, marginTop: 'auto' },
  footerText: { fontSize: 10, color: colors.muted, fontFamily: fonts.jakarta.regular },
})
