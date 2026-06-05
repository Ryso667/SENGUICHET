// Écran de connexion acheteur en 2 étapes
// Étape 1 : saisie de l'email → envoi du code OTP
// Étape 2 : vérification par code OTP à 6 chiffres reçu par email
import { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, InputAccessoryView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { fonts, spacing, textShadow, colors, glass, gradients, borderRadius as br } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { envoyerCodeOTP } from '../../services/authService'
import BlurBackground from '../../components/BlurBackground'
import GlassContainer from '../../components/GlassContainer'

export default function SocialAuthScreen({ navigation }) {
  const { connecterAcheteurOTP, acheteurEmailSuggestion } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [etape, setEtape] = useState('email') // 'email' | 'otp'
  const [loading, setLoading] = useState(false)
  const envoiEnCours = useRef(false) // Verrou anti double-tap
  const insets = useSafeAreaInsets()

  // Pré-remplit l'email acheteur suggéré depuis la dernière connexion
  useEffect(() => {
    if (acheteurEmailSuggestion && !email) setEmail(acheteurEmailSuggestion)
  }, [acheteurEmailSuggestion])
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const otpRef = useRef(null)

  // Étape 1 : envoie le code OTP à l'email
  const handleEnvoyerCode = async () => {
    if (envoiEnCours.current) return // Bloque le double-tap
    if (!emailRegex.test(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide')
      return
    }
    envoiEnCours.current = true
    setLoading(true)
    try {
      await envoyerCodeOTP(email)
      setEtape('otp')
      setTimeout(() => otpRef.current?.focus(), 300)
    } catch (err) {
      Alert.alert('Erreur', err.message)
    } finally {
      envoiEnCours.current = false
      setLoading(false)
    }
  }

  // Étape 2 : vérifie le code OTP et connecte
  const handleVerifierCode = async () => {
    if (envoiEnCours.current) return // Bloque le double-tap
    if (code.length !== 6) {
      Alert.alert('Code incomplet', 'Le code fait 6 chiffres')
      return
    }
    envoiEnCours.current = true
    setLoading(true)
    try {
      await connecterAcheteurOTP(email, code)
    } catch (err) {
      Alert.alert('Erreur', err.message)
    } finally {
      envoiEnCours.current = false
      setLoading(false)
    }
  }

  // Retour à l'étape précédente
  const handleRetour = () => {
    setEtape('email')
    setCode('')
  }

  const getTitre = () => {
    switch (etape) {
      case 'email': return 'Connexion'
      case 'otp':   return 'Vérifie ton email'
    }
  }

  const getSousTitre = () => {
    switch (etape) {
      case 'email':
        return 'Entre ton email pour recevoir un code'
      case 'otp':
        return `Un code à 6 chiffres a été envoyé à${'\n'}${email}`
    }
  }

  const getIcone = () => {
    switch (etape) {
      case 'email': return 'mail'
      case 'otp':   return 'lock-closed'
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BlurBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
          {/* Bouton retour */}
          {etape !== 'email' && (
            <TouchableOpacity style={styles.backBtn} onPress={handleRetour}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <GlassContainer style={styles.card}>
            <View style={styles.header}>
              <LinearGradient colors={gradients.primary} style={styles.logoCircle}>
                <Ionicons name={getIcone()} size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>{getTitre()}</Text>
              <Text style={styles.subtitle}>{getSousTitre()}</Text>
            </View>

            <View style={styles.form}>
              {etape === 'email' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="email"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={handleEnvoyerCode}
                    />
                  </View>
                  <LinearGradient colors={gradients.primary} style={styles.submitBtn}>
                    <TouchableOpacity
                      onPress={handleEnvoyerCode}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={styles.submitBtnInner}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Envoyer le code</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </>
              )}

              {etape === 'otp' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Code de confirmation</Text>
                    <TextInput
                      ref={otpRef}
                      style={[styles.input, styles.otpInput]}
                      value={code}
                      onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                      inputAccessoryViewID="otpAccessory"
                      returnKeyType="done"
                      onSubmitEditing={handleVerifierCode}
                    />
                  </View>
                  <LinearGradient colors={gradients.primary} style={styles.submitBtn}>
                    <TouchableOpacity
                      onPress={handleVerifierCode}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={styles.submitBtnInner}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Confirmer</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                  <TouchableOpacity style={styles.renvoyerBtn} onPress={handleEnvoyerCode} disabled={loading}>
                    <Text style={styles.renvoyerBtnText}>Renvoyer le code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </GlassContainer>
        </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        <InputAccessoryView nativeID="otpAccessory">
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity onPress={Keyboard.dismiss} style={styles.keyboardToolbarBtn}>
              <Text style={styles.keyboardToolbarBtnText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: glass.darkBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: colors.textWhite,
    marginBottom: spacing.sm,
    ...textShadow,
  },
  subtitle: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 14,
    color: colors.textWhiteMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  form: { gap: spacing.lg, width: '100%' },
  inputGroup: { gap: spacing.xs },
  label: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.textWhiteMuted,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderRadius: br.lg,
    backgroundColor: glass.darkBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    paddingHorizontal: 16,
    fontFamily: fonts.outfit.regular,
    fontSize: 16,
    color: colors.textWhite,
  },
  otpInput: {
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
    fontFamily: fonts.outfit.bold,
  },
  submitBtn: {
    height: 52,
    borderRadius: br.lg,
    marginTop: spacing.sm,
  },
  submitBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: br.lg,
  },
  submitBtnText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 16,
    color: '#fff',
  },
  renvoyerBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  renvoyerBtnText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.textWhiteMuted,
    textDecorationLine: 'underline',
  },
  keyboardToolbar: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
  },
  keyboardToolbarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  keyboardToolbarBtnText: {
    color: colors.cyan,
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
  },
})
