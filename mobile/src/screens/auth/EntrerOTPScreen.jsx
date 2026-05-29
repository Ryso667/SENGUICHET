// Écran de validation du code OTP reçu par SMS (acheteur)
// 6 champs individuels + compte à rebours de 5 minutes
// En mode démo, le code à saisir est : 123456
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Animated,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { verifierOTP } from '../../services/authService'
import InputOTP from '../../components/InputOTP'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { useAuth } from '../../context/AuthContext'

export default function EntrerOTPScreen({ route, navigation }) {
  const { numeroTel } = route.params
  const { connecterAcheteur } = useAuth()
  const [code, setCode] = useState('')
  const [chargement, setChargement] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(300) // 5 min en secondes
  const [success, setSuccess] = useState(false)
  const successOpacity = useRef(new Animated.Value(0)).current

  // Timer décrémentant chaque seconde (expiration du code OTP après 5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTempsRestant((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format secondes → MM:SS pour l'affichage
  const formaterTemps = (s) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Soumission automatique dès que les 6 chiffres sont saisis
  useEffect(() => {
    if (code.length === 6 && !chargement) {
      verifierEtConnecter(code)
    }
  }, [code])

  // Animation d'apparition du check vert
  useEffect(() => {
    if (success) {
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [success])

  // Vérification partagée (appelée automatiquement ou manuellement)
  const verifierEtConnecter = async (codeSaisi) => {
    if (codeSaisi.length !== 6) return
    setChargement(true)
    try {
      const result = await verifierOTP(numeroTel, codeSaisi)
      if (result.valide) {
        setSuccess(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        await connecterAcheteur(numeroTel)
      } else {
        alert('Code invalide. Veuillez réessayer.')
      }
    } catch {
      alert('Erreur de vérification')
    } finally {
      setChargement(false)
    }
  }

  // Validation manuelle via le bouton "Valider" (fallback)
  const handleValider = () => verifierEtConnecter(code)

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteneur}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.retour} onPress={() => navigation.goBack()}>
            ← Retour
          </Text>
          <Text style={styles.titre}>Vérification</Text>
          <Text style={styles.sousTitre}>
            Entrez le code à 6 chiffres envoyé au {numeroTel}
          </Text>

          {/* 6 champs OTP avec focus auto */}
          <InputOTP longueur={6} onComplet={(val) => setCode(val.slice(0, 6))} />

          {/* Timer d'expiration du code OTP */}
          <Text style={styles.compteur}>
            Code valide pendant {formaterTemps(tempsRestant)}
          </Text>

          <View style={styles.espace} />

          <BoutonPrincipal
            titre="Valider"
            chargement={chargement}
            desactive={code.length !== 6}
            onPress={handleValider}
          />
        </ScrollView>

        {success && (
          <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
            <View style={styles.successCircle}>
              <Feather name="check" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.successText}>Vérifié !</Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  flex: {
    flex: 1,
  },
  conteneur: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  retour: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 24,
  },
  titre: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#0f172a',
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 32,
  },
  compteur: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
  espace: {
    height: 24,
  },
  successOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#10B981',
  },
})
