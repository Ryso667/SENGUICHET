// Écran de connexion sociale (Google / Apple)
// Remplace l'ancien flow téléphone + OTP
// Google : utilise @react-native-google-signin/google-signin (signé natif)
// Apple  : utilise expo-apple-authentication (iOS uniquement)
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

export default function SocialAuthScreen({ navigation }) {
  const { connecterAcheteurSocial } = useAuth()
  const [loading, setLoading] = useState(null)

  // Déclenche la connexion Google native
  const handleGooglePress = async () => {
    setLoading('google')
    try {
      const GoogleSignin = (await import('@react-native-google-signin/google-signin')).GoogleSignin
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID,
      })
      await GoogleSignin.hasPlayServices()
      const { idToken } = await GoogleSignin.signIn()
      await handleGoogleToken(idToken)
    } catch (err) {
      if (err.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Erreur', err.message || 'Échec de la connexion Google')
      }
      setLoading(null)
    }
  }

  // Échange le token Google contre un token Firebase puis connecte via backend
  const handleGoogleToken = async (idToken) => {
    setLoading('google')
    try {
      const { connecterGoogle } = await import('../../services/firebase')
      const { firebaseToken } = await connecterGoogle(idToken)
      await connecterAcheteurSocial(firebaseToken)
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Échec de la connexion Google')
    }
    setLoading(null)
  }

  // Gère la connexion Apple via expo-apple-authentication
  const handleApple = async () => {
    setLoading('apple')
    try {
      const AppleAuthentication = (await import('expo-apple-authentication')).default
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      const { identityToken } = credential
      if (!identityToken) {
        Alert.alert('Erreur', "Pas de token reçu d'Apple")
        setLoading(null)
        return
      }

      const { connecterApple } = await import('../../services/firebase')
      const { firebaseToken } = await connecterApple(identityToken)
      await connecterAcheteurSocial(firebaseToken)
    } catch (err) {
      if (err.code !== 'ERR_CANCELED' && err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erreur', err.message || 'Échec de la connexion Apple')
      }
    }
    setLoading(null)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('AccueilChoix')}>
          <Ionicons name="arrow-back" size={20} color={colors.slate} />
        </TouchableOpacity>

        <View style={styles.header}>
          <LinearGradient colors={['#00C8FF', '#0077FF']} style={styles.logoCircle}>
            <Ionicons name="person" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Connexion Acheteur</Text>
          <Text style={styles.subtitle}>
            Choisis ton mode de connexion pour accéder à tes billets
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.socialBtn, styles.googleBtn]}
            onPress={handleGooglePress}
            disabled={!!loading}
            activeOpacity={0.8}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.socialBtnText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn]}
              onPress={handleApple}
              disabled={!!loading}
              activeOpacity={0.8}
            >
              {loading === 'apple' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#fff" />
                  <Text style={styles.socialBtnText}>Continuer avec Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
          <Text style={styles.footerText}>
            Connexion sécurisée via Google ou Apple
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
    color: colors.slate,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 14,
    color: colors.mid,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  buttons: { gap: spacing.md },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  googleBtn: { backgroundColor: '#4285F4' },
  appleBtn: { backgroundColor: '#000' },
  socialBtnText: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
  },
})
