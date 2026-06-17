// Écran de connexion acheteur en 2 étapes
// Étape 1 : saisie de l'email → envoi du code OTP
// Étape 2 : vérification par code OTP à 6 chiffres reçu par email
import { useState, useRef, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, InputAccessoryView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, gradients, glass, spacing, borderRadius as br } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { envoyerCodeOTP } from '../../services/authService'
import GlassContainer from '../../components/GlassContainer'

export default function SocialAuthScreen({ navigation }) {
  const { colors } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  // État du formulaire : email → OTP
  const { connecterAcheteurOTP, acheteurEmailSuggestion } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [etape, setEtape] = useState('email') // 'email' | 'otp'
  const [loading, setLoading] = useState(false)
  // Minuteur entre deux envois de code (anti-spam)
  const [resendCooldown, setResendCooldown] = useState(0)
  const insets = useSafeAreaInsets()

  // Minuteur 60s avant de pouvoir renvoyer un code
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => setResendCooldown(prev => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  // Pré-remplit l'email acheteur suggéré depuis la dernière connexion
  useEffect(() => {
    if (acheteurEmailSuggestion && !email) setEmail(acheteurEmailSuggestion)
  }, [acheteurEmailSuggestion])
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const otpRef = useRef(null)

  // Étape 1 : envoie le code OTP à l'email
  const handleEnvoyerCode = async () => {
    if (!emailRegex.test(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide')
      return
    }
    setLoading(true)
    try {
      await envoyerCodeOTP(email)
      setEtape('otp')
      setResendCooldown(60)
      setTimeout(() => otpRef.current?.focus(), 300)
    } catch (err) {
      Alert.alert('Erreur', err.message)
    } finally {
      setLoading(false)
    }
  }

  // Étape 2 : vérifie le code OTP et connecte l'acheteur
  const handleVerifierCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Code incomplet', 'Le code fait 6 chiffres')
      return
    }
    setLoading(true)
    try {
      await connecterAcheteurOTP(email, code)
      navigation.replace('MainTabs')
    } catch (err) {
      Alert.alert('Erreur', err.message)
    } finally {
      setLoading(false)
    }
  }

  // Retour à l'étape email depuis l'étape OTP
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Bouton retour positionné en haut dans la zone de sécurité */}
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 8 }]} onPress={etape === 'email' ? () => navigation.goBack() : handleRetour}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        <View style={s.container}>

          <GlassContainer style={s.card}>
            <View style={s.header}>
              <LinearGradient colors={gradients.primary} style={s.logoCircle}>
                <Ionicons name={getIcone()} size={28} color="#fff" />
              </LinearGradient>
              <Text style={s.title}>{getTitre()}</Text>
              <Text style={s.subtitle}>{getSousTitre()}</Text>
            </View>

            <View style={s.form}>
              {etape === 'email' && (
                <>
                  <View style={s.inputGroup}>
                    <Text style={s.label}>Email</Text>
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="exemple@email.com"
                      placeholderTextColor={colors.textTertiary}
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
                  <LinearGradient colors={gradients.primary} style={s.submitBtn}>
                    <TouchableOpacity
                      onPress={handleEnvoyerCode}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={s.submitBtnInner}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.submitBtnText}>Envoyer le code</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </>
              )}

              {etape === 'otp' && (
                <>
                  <View style={s.inputGroup}>
                    <Text style={s.label}>Code de confirmation</Text>
                    <TextInput
                      ref={otpRef}
                      style={[s.input, s.otpInput]}
                      value={code}
                      onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                      inputAccessoryViewID="otpAccessory"
                      returnKeyType="done"
                      onSubmitEditing={handleVerifierCode}
                    />
                  </View>
                  <LinearGradient colors={gradients.primary} style={s.submitBtn}>
                    <TouchableOpacity
                      onPress={handleVerifierCode}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={s.submitBtnInner}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.submitBtnText}>Confirmer</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                  <TouchableOpacity style={s.renvoyerBtn} onPress={handleEnvoyerCode} disabled={loading || resendCooldown > 0}>
                    <Text style={[s.renvoyerBtnText, resendCooldown > 0 && { color: colors.textTertiary, textDecorationLine: 'none' }]}>
                      {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </GlassContainer>
        </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        <InputAccessoryView nativeID="otpAccessory">
          <View style={s.keyboardToolbar}>
            <TouchableOpacity onPress={Keyboard.dismiss} style={s.keyboardToolbarBtn}>
              <Text style={s.keyboardToolbarBtnText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </KeyboardAvoidingView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
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
    left: spacing.md,
    width: 40,
    height: 40,
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
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  form: { gap: spacing.lg, width: '100%' },
  inputGroup: { gap: spacing.xs },
  label: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.text,
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
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  keyboardToolbar: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
  },
  keyboardToolbarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  keyboardToolbarBtnText: {
    color: colors.green,
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
  },
})
