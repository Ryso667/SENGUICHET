// Contexte global d'authentification
// Gère 3 rôles : acheteur (OTP), controleur (code 4 chiffres), organisateur (email+mdp)
import { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
const AuthContext = createContext(null)

// Clés de stockage permanent (AsyncStorage)
const STORAGE_KEY_ROLE   = '@senguichet_role'       // rôle actif
const STORAGE_KEY_JWT    = '@senguichet_jwt'         // token controleur
const STORAGE_KEY_NUMERO = '@senguichet_telephone'   // téléphone acheteur
const STORAGE_KEY_EMAIL  = '@senguichet_orga_email'  // email organisateur
const STORAGE_KEY_BIOMETRIC_EMAIL = '@senguichet_biometric_email' // email pour reconnexion biométrique

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null)
  const [numeroTel, setNumeroTel] = useState(null)
  const [jwt, setJwt] = useState(null)
  const [email, setEmail] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [sessionEmail, setSessionEmail] = useState(null)

  // Au démarrage : restaure la session depuis AsyncStorage
  useEffect(() => {
    restaurerSession()
  }, [])

  const restaurerSession = async () => {
    try {
      const roleStocke = await AsyncStorage.getItem(STORAGE_KEY_ROLE)

      if (roleStocke === 'acheteur') {
        const tel = await AsyncStorage.getItem(STORAGE_KEY_NUMERO)
        if (tel) {
          setNumeroTel(tel)
          setRole('acheteur')
        }
      } else if (roleStocke === 'controleur') {
        const token = await AsyncStorage.getItem(STORAGE_KEY_JWT)
        if (token) {
          setJwt(token)
          setRole('controleur')
        }
      } else if (roleStocke === 'organisateur') {
        const mail = await AsyncStorage.getItem(STORAGE_KEY_EMAIL)
        const token = await AsyncStorage.getItem(STORAGE_KEY_JWT)
        if (mail && token) {
          setEmail(mail)
          setJwt(token)
          setRole('organisateur')
        }
      }
      // Vérifie si l'utilisateur a déjà une session organisateur sauvegardée (pour la biométrie)
      const bioEmail = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC_EMAIL)
      if (bioEmail) {
        setHasSavedSession(true)
        setSessionEmail(bioEmail)
      }
    } catch {
      // Pas de session valide → reste déconnecté
    } finally {
      setChargement(false)
    }
  }

  // Connexion acheteur (après validation OTP)
  const connecterAcheteur = async (tel) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'acheteur')
    await AsyncStorage.setItem(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
    setRole('acheteur')
  }

  // Connexion contrôleur (après validation code 4 chiffres)
  const connecterControleur = async (token) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'controleur')
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    setJwt(token)
    setRole('controleur')
  }

  // Connexion organisateur (email + mot de passe)
  const connecterOrganisateur = async (token, mail) => {
    await AsyncStorage.setItem(STORAGE_KEY_ROLE, 'organisateur')
    await AsyncStorage.setItem(STORAGE_KEY_JWT, token)
    await AsyncStorage.setItem(STORAGE_KEY_EMAIL, mail)
    await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC_EMAIL, mail)
    setJwt(token)
    setEmail(mail)
    setRole('organisateur')
    setHasSavedSession(true)
    setSessionEmail(mail)
  }

  // Connexion rapide via biométrie (empreinte) pour les organisateurs
  const tenterBiometrie = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      if (!compatible) return
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Connecte-toi avec ton empreinte',
      })
      if (result.success) {
        const mail = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC_EMAIL)
        if (mail) {
          await connecterOrganisateur('biometric-session', mail)
        }
      }
    } catch {
      // Biométrie indisponible ou échec
    }
  }

  // Déconnexion : efface tout et retourne à l'accueil
  const deconnecter = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_ROLE,
      STORAGE_KEY_NUMERO,
      STORAGE_KEY_JWT,
      STORAGE_KEY_EMAIL,
    ])
    setRole(null)
    setNumeroTel(null)
    setJwt(null)
    setEmail(null)
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        numeroTel,
        jwt,
        email,
        chargement,
        connecterAcheteur,
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

// Hook utilisable depuis n'importe quel écran
export const useAuth = () => useContext(AuthContext)
