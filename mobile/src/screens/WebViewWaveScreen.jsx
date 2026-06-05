// Écran WebView pour le paiement Wave
// Ouvre wave_launch_url dans une WebView intégrée
// Périodiquement vérifie le statut du paiement via l'API

import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { statutPaiement } from '../services/paiementService'

const POLL_INTERVAL = 3000 // 3 secondes entre chaque vérification
const MAX_POLLS = 60 // 3 minutes maximum

const DOMAINES_AUTORISES = [
  'wave.com',
  'www.wave.com',
  'pay.wave.com',
  'sandbox.wave.com',
  'orange.com',
  'orange.sn',
  'pay.orange.sn',
  'api.orange.com',
]

function validerURL(url) {
  try {
    const parsed = new URL(url)
    return DOMAINES_AUTORISES.some((domaine) => parsed.hostname === domaine || parsed.hostname.endsWith('.' + domaine))
  } catch {
    return false
  }
}

export default function WebViewWaveScreen({ route, navigation }) {
  const { redirectUrl, transactionReference, eventId, ticket } = route.params
  const [statut, setStatut] = useState('PENDING') // PENDING | SUCCESS | FAILED
  const [erreur, setErreur] = useState('')
  const pollCountRef = useRef(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Polling régulier du statut paiement
    intervalRef.current = setInterval(async () => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLLS) {
        clearInterval(intervalRef.current)
        setStatut('FAILED')
        setErreur('Le délai d\'attente a été dépassé')
        return
      }

      try {
        const resultat = await statutPaiement(transactionReference)
        if (resultat.statut === 'SUCCESS') {
          clearInterval(intervalRef.current)
          setStatut('SUCCESS')
        } else if (resultat.statut === 'FAILED') {
          clearInterval(intervalRef.current)
          setStatut('FAILED')
          setErreur('Le paiement a échoué')
        }
      } catch (err) {
        // Ignorer les erreurs réseau pendant le polling
      }
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionReference])

  // Rediriger vers le ticket quand le paiement est confirmé
  useEffect(() => {
    if (statut === 'SUCCESS') {
      const timer = setTimeout(() => {
        navigation.replace('Ticket', { ticket })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [statut, navigation, ticket])

  if (statut === 'SUCCESS') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerBox}>
          <LinearGradient colors={['#00E5A0', '#00C8FF']} style={s.checkCircle}>
            <Feather name="check" size={36} color="#fff" />
          </LinearGradient>
          <Text style={s.successText}>Paiement réussi !</Text>
          <Text style={s.subText}>Redirection vers votre ticket...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (statut === 'FAILED') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerBox}>
          <View style={s.errorCircle}>
            <Feather name="x" size={36} color="#fff" />
          </View>
          <Text style={s.errorText}>Paiement échoué</Text>
          {erreur ? <Text style={s.subText}>{erreur}</Text> : null}
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.retryGradient}>
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={s.retryText}>Réessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const urlValide = validerURL(redirectUrl)

  if (!urlValide) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerBox}>
          <View style={s.errorCircle}>
            <Feather name="alert-triangle" size={36} color="#fff" />
          </View>
          <Text style={s.errorText}>URL de paiement invalide</Text>
          <Text style={s.subText}>L'URL de redirection ne correspond pas à un domaine autorisé</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#00C8FF', '#0077FF']} style={s.retryGradient}>
              <Feather name="arrow-left" size={14} color="#fff" />
              <Text style={s.retryText}>Retour</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            navigation.goBack()
          }}
        >
          <Feather name="x" size={18} color={colors.slate} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paiement Wave</Text>
        <View style={s.headerRight} />
      </View>

      <WebView
        source={{ uri: redirectUrl }}
        style={s.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={s.loadingOverlay}>
            <Text style={s.loadingText}>Chargement de Wave...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  headerTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.slate,
  },
  headerRight: { width: 36 },
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 14,
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
  subText: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    borderRadius: 100,
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
})
