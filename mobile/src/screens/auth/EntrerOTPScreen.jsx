import { useState, useEffect } from 'react'
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { verifierOTP } from '../../services/authService'
import InputOTP from '../../components/InputOTP'
import BoutonPrincipal from '../../components/BoutonPrincipal'
import { useAuth } from '../../context/AuthContext'

// Écran de validation du code OTP reçu par SMS
// Affiche 6 champs individuels + compte à rebours de 5 minutes
// En mode démo, le code à saisir est : 123456
export default function EntrerOTPScreen({ route, navigation }) {
  const { numeroTel } = route.params
  const { connecterAcheteur } = useAuth()
  const [code, setCode] = useState('')
  const [chargement, setChargement] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(300) // 5 min en secondes

  // Timer décrémentant chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setTempsRestant((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format secondes → MM:SS
  const formaterTemps = (s) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Vérification du code OTP saisi
  const handleValider = async () => {
    if (code.length !== 6) return
    setChargement(true)
    try {
      const result = await verifierOTP(numeroTel, code)
      if (result.valide) {
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
})
