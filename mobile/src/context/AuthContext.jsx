// Contexte global d'authentification
// Gère 3 rôles : acheteur (social Google/Apple), controleur (code 4 chiffres), organisateur (email+mdp)
import { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import { nettoyerDonneesLegacy } from '../utils/cleanupLegacyData'
import { connecterAcheteurSocial as connecterAcheteurSocialAPI } from '../services/authService'
import { verifierCodeOTP as verifierCodeOTPAPI } from '../services/authService'
import * as Securite from '../utils/secureStorage'

const AuthContext = createContext(null)

const STORAGE_KEY_ROLE   = '@senguichet_role'
const STORAGE_KEY_JWT    = '@senguichet_jwt'
const STORAGE_KEY_NUMERO = '@senguichet_telephone'
const STORAGE_KEY_EMAIL  = '@senguichet_orga_email'
const STORAGE_KEY_USER   = '@senguichet_orga_user'
const STORAGE_KEY_PROFIL = '@senguichet_profil'
const STORAGE_KEY_BIOMETRIC_EMAIL = '@senguichet_biometric_email'
const STORAGE_KEY_ACHETEUR_EMAIL  = '@senguichet_acheteur_email'
const STORAGE_KEY_ACHETEUR_PIN    = '@senguichet_acheteur_pin'
const STORAGE_KEY_ORGA_EMAIL_SUGGESTION = '@senguichet_orga_email_suggestion'
const STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION = '@senguichet_acheteur_email_suggestion'

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null)
  const [numeroTel, setNumeroTel] = useState(null)
  const [jwt, setJwt] = useState(null)
  const [email, setEmail] = useState(null)
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [sessionEmail, setSessionEmail] = useState(null)
  const [orgaEmailSuggestion, setOrgaEmailSuggestion] = useState(null)
  const [acheteurEmailSuggestion, setAcheteurEmailSuggestion] = useState(null)

  useEffect(() => {
    nettoyerDonneesLegacy()
    restaurerSession()
  }, [])

  const restaurerSession = async () => {
    try {
      const roleStocke = await AsyncStorage.getItem(STORAGE_KEY_ROLE)

      if (roleStocke === 'acheteur') {
        const tel = await Securite.GET(STORAGE_KEY_NUMERO)
        const token = await Securite.GET(STORAGE_KEY_JWT)
        const profilData = await Securite.GET(STORAGE_KEY_PROFIL)
        const acheteurEmail = await Securite.GET(STORAGE_KEY_ACHETEUR_EMAIL)
        if (token) setJwt(token)
        if (tel) setNumeroTel(tel)
        if (acheteurEmail) setEmail(acheteurEmail)
        if (profilData) setProfil(JSON.parse(profilData))
        setRole('acheteur')
      } else if (roleStocke === 'controleur') {
        const token = await Securite.GET(STORAGE_KEY_JWT)
        if (token) {
          setJwt(token)
          setRole('controleur')
        }
      } else if (roleStocke === 'organisateur') {
        const token = await Securite.GET(STORAGE_KEY_JWT)
        const userData = await Securite.GET(STORAGE_KEY_USER)
        if (token && userData) {
          const parsed = JSON.parse(userData)
          setUser(parsed)
          setJwt(token)
          setEmail(parsed.email)
          setRole('organisateur')
        }
      }

      const bioEmail = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC_EMAIL)
      if (bioEmail) {
        setHasSavedSession(true)
        setSessionEmail(bioEmail)
      }

      const orgaEmail = await AsyncStorage.getItem(STORAGE_KEY_ORGA_EMAIL_SUGGESTION)
      if (orgaEmail) setOrgaEmailSuggestion(orgaEmail)
      const acheteurEmail = await AsyncStorage.getItem(STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION)
      if (acheteurEmail) setAcheteurEmailSuggestion(acheteurEmail)
    } catch {
    } finally {
      setChargement(false)
    }
  }

  // Connexion sociale acheteur (Google/Apple)
  // Appelle le backend avec le firebaseToken, stocke le JWT et le profil
  const connecterAcheteurSocial = async (firebaseToken) => {
    const data = await connecterAcheteurSocialAPI(firebaseToken)
    const { token, user: profilUtilisateur } = data
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'acheteur')
    await Securite.SET(STORAGE_KEY_JWT, token)
    await Securite.SET(STORAGE_KEY_PROFIL, JSON.stringify(profilUtilisateur))
    if (profilUtilisateur?.email) {
      await AsyncStorage.setItem(STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION, profilUtilisateur.email)
      setAcheteurEmailSuggestion(profilUtilisateur.email)
    }
    setJwt(token)
    setProfil(profilUtilisateur)
    setRole('acheteur')
  }

  // Connexion acheteur (ancien flow OTP, conservé pour compatibilité)
  const connecterAcheteur = async (tel) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'acheteur')
    await AsyncStorage.setItem(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
    setRole('acheteur')
  }

  // Stocke le téléphone après un achat (utilisé par le flow social)
  const definirTelephone = async (tel) => {
    await AsyncStorage.setItem(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
  }

  const connecterControleur = async (token) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'controleur')
    await Securite.SET(STORAGE_KEY_JWT, token)
    setJwt(token)
    setRole('controleur')
  }

  const connecterOrganisateur = async (token, userData) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organisateur')
    await Securite.SET(STORAGE_KEY_JWT, token)
    await Securite.SET(STORAGE_KEY_EMAIL, userData.email)
    await Securite.SET(STORAGE_KEY_USER, JSON.stringify(userData))
    await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC_EMAIL, userData.email)
    await AsyncStorage.setItem(STORAGE_KEY_ORGA_EMAIL_SUGGESTION, userData.email)
    setJwt(token)
    setEmail(userData.email)
    setUser(userData)
    setRole('organisateur')
    setHasSavedSession(true)
    setSessionEmail(userData.email)
    setOrgaEmailSuggestion(userData.email)
  }

  // Connexion acheteur par OTP email
  // Vérifie le code OTP via le backend, stocke le JWT retourné
  const connecterAcheteurOTP = async (email, code) => {
    const data = await verifierCodeOTPAPI(email, code)
    const { token, user } = data
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'acheteur')
    await Securite.SET(STORAGE_KEY_ACHETEUR_EMAIL, email)
    await Securite.SET(STORAGE_KEY_JWT, token)
    await AsyncStorage.setItem(STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION, email)
    const nom = email.split('@')[0].replace(/\d+$/, '')
    const profilData = { nom }
    await Securite.SET(STORAGE_KEY_PROFIL, JSON.stringify(profilData))
    setEmail(email)
    setJwt(token)
    setProfil(profilData)
    setRole('acheteur')
    setAcheteurEmailSuggestion(email)
  }

  const tenterBiometrie = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      if (!compatible) return
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Connecte-toi avec ton empreinte',
      })
      if (result.success) {
        const userData = await AsyncStorage.getItem(STORAGE_KEY_USER)
        const token = await Securite.GET(STORAGE_KEY_JWT)
        if (token && userData) {
          await connecterOrganisateur(token, JSON.parse(userData))
        }
      }
    } catch {
    }
  }

  const nettoyerSession = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_ROLE,
      STORAGE_KEY_ACHETEUR_PIN,
      STORAGE_KEY_BIOMETRIC_EMAIL,
    ])
    await Securite.SUPPRIMER(STORAGE_KEY_NUMERO)
    await Securite.SUPPRIMER(STORAGE_KEY_JWT)
    await Securite.SUPPRIMER(STORAGE_KEY_EMAIL)
    await Securite.SUPPRIMER(STORAGE_KEY_USER)
    await Securite.SUPPRIMER(STORAGE_KEY_PROFIL)
    await Securite.SUPPRIMER(STORAGE_KEY_ACHETEUR_EMAIL)
    setRole(null)
    setNumeroTel(null)
    setJwt(null)
    setEmail(null)
    setUser(null)
    setProfil(null)
    setHasSavedSession(false)
    setSessionEmail(null)
  }

  const deconnecter = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: nettoyerSession,
        },
      ],
    )
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        numeroTel,
        jwt,
        email,
        user,
        profil,
        chargement,
        connecterAcheteur,
        connecterAcheteurSocial,
        connecterAcheteurOTP,
        definirTelephone,
        connecterControleur,
        connecterOrganisateur,
        deconnecter,
        nettoyerSession,
        tenterBiometrie,
        hasSavedSession,
        sessionEmail,
        orgaEmailSuggestion,
        acheteurEmailSuggestion,
        estConnecte: role !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
