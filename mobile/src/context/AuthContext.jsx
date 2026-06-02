// Contexte global d'authentification
// Gère 3 rôles : acheteur (social Google/Apple), controleur (code 4 chiffres), organisateur (email+mdp)
import { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import { nettoyerDonneesLegacy } from '../utils/cleanupLegacyData'
import { connecterAcheteurSocial as connecterAcheteurSocialAPI } from '../services/authService'

const AuthContext = createContext(null)

const STORAGE_KEY_ROLE   = '@senguichet_role'
const STORAGE_KEY_JWT    = '@senguichet_jwt'
const STORAGE_KEY_NUMERO = '@senguichet_telephone'
const STORAGE_KEY_EMAIL  = '@senguichet_orga_email'
const STORAGE_KEY_USER   = '@senguichet_orga_user'
const STORAGE_KEY_PROFIL = '@senguichet_profil'
const STORAGE_KEY_BIOMETRIC_EMAIL = '@senguichet_biometric_email'

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

  useEffect(() => {
    nettoyerDonneesLegacy()
    restaurerSession()
  }, [])

  const restaurerSession = async () => {
    try {
      const roleStocke = await AsyncStorage.getItem(STORAGE_KEY_ROLE)

      if (roleStocke === 'acheteur') {
        const tel = await AsyncStorage.getItem(STORAGE_KEY_NUMERO)
        const token = await AsyncStorage.getItem(STORAGE_KEY_JWT)
        const profilData = await AsyncStorage.getItem(STORAGE_KEY_PROFIL)
        if (token) setJwt(token)
        if (tel) setNumeroTel(tel)
        if (profilData) setProfil(JSON.parse(profilData))
        setRole('acheteur')
      } else if (roleStocke === 'controleur') {
        const token = await AsyncStorage.getItem(STORAGE_KEY_JWT)
        if (token) {
          setJwt(token)
          setRole('controleur')
        }
      } else if (roleStocke === 'organisateur') {
        const token = await AsyncStorage.getItem(STORAGE_KEY_JWT)
        const userData = await AsyncStorage.getItem(STORAGE_KEY_USER)
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
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    await AsyncStorage.setItem(STORAGE_KEY_PROFIL, JSON.stringify(profilUtilisateur))
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
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    setJwt(token)
    setRole('controleur')
  }

  const connecterOrganisateur = async (token, userData) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organisateur')
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    await AsyncStorage.setItem(STORAGE_KEY_EMAIL, userData.email)
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))
    await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC_EMAIL, userData.email)
    setJwt(token)
    setEmail(userData.email)
    setUser(userData)
    setRole('organisateur')
    setHasSavedSession(true)
    setSessionEmail(userData.email)
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
        if (userData) {
          await connecterOrganisateur('biometric-session', JSON.parse(userData))
        }
      }
    } catch {
    }
  }

  const deconnecter = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_ROLE,
      STORAGE_KEY_NUMERO,
      STORAGE_KEY_JWT,
      STORAGE_KEY_EMAIL,
      STORAGE_KEY_USER,
      STORAGE_KEY_PROFIL,
    ])
    setRole(null)
    setNumeroTel(null)
    setJwt(null)
    setEmail(null)
    setUser(null)
    setProfil(null)
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
        definirTelephone,
        connecterControleur,
        connecterOrganisateur,
        deconnecter,
        tenterBiometrie,
        hasSavedSession,
        sessionEmail,
        estConnecte: role !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
