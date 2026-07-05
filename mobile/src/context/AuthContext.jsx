// Contexte global d'authentification
// Gère 3 rôles : acheteur (social Google/Apple), controleur (code 4 chiffres), organisateur (email+mdp)
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import { nettoyerDonneesLegacy } from '../utils/cleanupLegacyData'
import { verifierCodeOTP as verifierCodeOTPAPI } from '../services/authService'
import * as Securite from '../utils/secureStorage'
import { configurerNotifications, obtenirTokenPush, enregistrerToken, supprimerToken } from '../services/notificationService'

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
const STORAGE_KEY_EVENEMENT_ID = '@senguichet_evenement_id'
const STORAGE_KEY_EVENEMENT_TITRE = '@senguichet_evenement_titre'

// Seuil d'inactivité avant déconnexion automatique (30 minutes)
const DELAI_INACTIVITE_MS = 30 * 60 * 1000

// Vérifie si un JWT est expiré en comparant le champ exp à l'heure actuelle
// Retourne true si expiré ou si le token n'a pas de champ exp
const jwtEstExpire = (token) => {
  const payload = decoderJWT(token)
  if (!payload.exp) return true
  return Date.now() >= payload.exp * 1000
}

// Décode le payload d'un JWT sans vérifier la signature (lecture seule des claims)
// Convertit base64url → base64 avec padding avant de décoder
// Évite atob() qui n'existe pas en React Native — utilise Buffer si dispo
const decoderJWT = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - base64.length % 4)
    const decoded = typeof atob !== 'undefined'
      ? atob(base64 + padding)
      : Buffer.from(base64 + padding, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    return {}
  }
}

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
  const [evenementId, setEvenementId] = useState(null)
  const [evenementTitre, setEvenementTitre] = useState(null)
  const arrierePlanRef = useRef(null)

  useEffect(() => {
    nettoyerDonneesLegacy()
    restaurerSession()

    // Surveille les changements d'état de l'application pour détecter l'inactivité
    const subscription = AppState.addEventListener('change', (etat) => {
      if (etat === 'background' || etat === 'inactive') {
        arrierePlanRef.current = Date.now()
      } else if (etat === 'active' && arrierePlanRef.current !== null) {
        const duree = Date.now() - arrierePlanRef.current
        if (duree >= DELAI_INACTIVITE_MS && role) {
          console.log(`[Auth] Inactivité détectée (${Math.round(duree / 60000)} min) — déconnexion automatique`)
          nettoyerSession()
        }
        arrierePlanRef.current = null
      }
    })

    return () => subscription.remove()
  }, [role])

  // Lit le rôle depuis SecureStore puis AsyncStorage (compatibilité ascendante)
  const lireRole = async () => {
    try {
      return await Securite.GET(STORAGE_KEY_ROLE)
    } catch {
      return await AsyncStorage.getItem(STORAGE_KEY_ROLE)
    }
  }

  // Lit un email biométrique depuis SecureStore puis AsyncStorage
  const lireBioEmail = async () => {
    try {
      return await Securite.GET(STORAGE_KEY_BIOMETRIC_EMAIL)
    } catch {
      return await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC_EMAIL)
    }
  }

  const restaurerSession = async () => {
    try {
      const roleStocke = await lireRole()

      if (roleStocke === 'acheteur') {
        const tel = await Securite.GET(STORAGE_KEY_NUMERO)
        const token = await Securite.GET(STORAGE_KEY_JWT)
        const profilData = await Securite.GET(STORAGE_KEY_PROFIL)
        const acheteurEmail = await Securite.GET(STORAGE_KEY_ACHETEUR_EMAIL)
        // Vérifie l'expiration du JWT avant de restaurer la session
        if (token && jwtEstExpire(token)) {
          console.log('[Auth] JWT acheteur expiré — nettoyage session')
          await nettoyerSession()
          return
        }
        if (token) setJwt(token)
        if (tel) setNumeroTel(tel)
        if (acheteurEmail) setEmail(acheteurEmail)
        if (profilData) {
          try {
            setProfil(JSON.parse(profilData))
          } catch (e) {
            console.warn('[Auth] Erreur parsing profil acheteur — reconstruction depuis email:', e)
            if (acheteurEmail) {
              const nom = acheteurEmail.split('@')[0].replace(/\d+$/, '')
              setProfil({ nom, email: acheteurEmail })
            }
          }
        }
        setRole('acheteur')
      } else if (roleStocke === 'controleur') {
        const token = await Securite.GET(STORAGE_KEY_JWT)
        const eventId = await Securite.GET(STORAGE_KEY_EVENEMENT_ID)
        const eventTitre = await Securite.GET(STORAGE_KEY_EVENEMENT_TITRE)
        // Vérifie l'expiration du JWT avant de restaurer la session
        if (token && jwtEstExpire(token)) {
          console.log('[Auth] JWT controleur expiré — nettoyage session')
          await nettoyerSession()
          return
        }
        if (token) {
          setJwt(token)
          if (eventId) setEvenementId(Number(eventId))
          if (eventTitre) setEvenementTitre(eventTitre)
          setRole('controleur')
        }
      } else if (roleStocke === 'organisateur') {
        console.log('[Auth] restauration organisateur...')
        const token = await Securite.GET(STORAGE_KEY_JWT)
        const userData = await Securite.GET(STORAGE_KEY_USER)
        // Vérifie l'expiration du JWT avant de restaurer la session
        if (token && jwtEstExpire(token)) {
          console.log('[Auth] JWT organisateur expiré — nettoyage session')
          await nettoyerSession()
          return
        }
        console.log('[Auth] token:', !!token, 'userData:', !!userData)
        if (token && userData) {
          try {
            const parsed = JSON.parse(userData)
            console.log('[Auth] organisateur restauré:', parsed.email)
            setUser(parsed)
            setJwt(token)
            setEmail(parsed.email)
            setRole('organisateur')
          } catch (e) {
            console.warn('[Auth] Erreur parsing userData organisateur:', e)
          }
        } else {
          console.log('[Auth] données manquantes pour restaurer organisateur')
        }
      }

      const bioEmail = await lireBioEmail()
      if (bioEmail) {
        setHasSavedSession(true)
        setSessionEmail(bioEmail)
      }

      const orgaEmail = await AsyncStorage.getItem(STORAGE_KEY_ORGA_EMAIL_SUGGESTION)
      if (orgaEmail) setOrgaEmailSuggestion(orgaEmail)
      const acheteurEmailSuggest = await AsyncStorage.getItem(STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION)
      if (acheteurEmailSuggest) setAcheteurEmailSuggestion(acheteurEmailSuggest)
    } catch (e) {
      console.warn('[Auth] Erreur générale restauration session:', e)
    } finally {
      setChargement(false)
    }
  }

  // Connexion acheteur (ancien flow OTP, conservé pour compatibilité)
  const connecterAcheteur = async (tel) => {
    await Securite.SET(STORAGE_KEY_ROLE, 'acheteur')
    await AsyncStorage.removeItem(STORAGE_KEY_ROLE)
    await Securite.SET(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
    setRole('acheteur')
  }

  // Stocke le téléphone après un achat (utilisé par le flow social)
  const definirTelephone = async (tel) => {
    await Securite.SET(STORAGE_KEY_NUMERO, tel)
    setNumeroTel(tel)
  }

  // Stocke la session controleur : JWT + evenementId + evenementTitre
  // user (optionnel) vient de la réponse API pour éviter de dépendre du JWT decode
  const connecterControleur = async (token, user) => {
    console.log('[Auth] connecterControleur appelé')
    const payload = decoderJWT(token)
    const eventId = user?.evenementId || payload.evenementId
    const eventTitre = user?.evenementTitre || payload.evenementTitre
    console.log('[Auth] eventId=', eventId, 'eventTitre=', eventTitre)
    await Securite.SET(STORAGE_KEY_ROLE, 'controleur')
    await AsyncStorage.removeItem(STORAGE_KEY_ROLE)
    await Securite.SET(STORAGE_KEY_JWT, token)
    if (eventId) await Securite.SET(STORAGE_KEY_EVENEMENT_ID, String(eventId))
    if (eventTitre) await Securite.SET(STORAGE_KEY_EVENEMENT_TITRE, String(eventTitre))
    setJwt(token)
    setEvenementId(eventId || null)
    setEvenementTitre(eventTitre || null)
    setRole('controleur')
    console.log('[Auth] role mis à jour vers controleur')
  }

  const connecterOrganisateur = async (token, userData) => {
    await Securite.SET(STORAGE_KEY_ROLE, 'organisateur')
    await AsyncStorage.removeItem(STORAGE_KEY_ROLE)
    await Securite.SET(STORAGE_KEY_JWT, token)
    await Securite.SET(STORAGE_KEY_EMAIL, userData.email)
    await Securite.SET(STORAGE_KEY_USER, JSON.stringify(userData))
    await Securite.SET(STORAGE_KEY_BIOMETRIC_EMAIL, userData.email)
    await AsyncStorage.removeItem(STORAGE_KEY_BIOMETRIC_EMAIL)
    await AsyncStorage.setItem(STORAGE_KEY_ORGA_EMAIL_SUGGESTION, userData.email)
    setJwt(token)
    setEmail(userData.email)
    setUser(userData)
    setRole('organisateur')
    setHasSavedSession(true)
    setSessionEmail(userData.email)
    setOrgaEmailSuggestion(userData.email)
    // Enregistrer le token push pour les notifications
    try {
      configurerNotifications()
      const pushToken = await obtenirTokenPush()
      if (pushToken) await enregistrerToken(pushToken, 'organisateur')
    } catch (err) {
      console.error('Erreur push token:', err.message)
    }
  }

  // Connexion acheteur par OTP email
  // Vérifie le code OTP via le backend, stocke le JWT retourné
  const connecterAcheteurOTP = async (email, code) => {
    const data = await verifierCodeOTPAPI(email, code)
    if (!data || !data.token) {
      throw new Error('Réponse API invalide : token manquant')
    }
    const { token, user } = data
    await Securite.SET(STORAGE_KEY_ROLE, 'acheteur')
    await AsyncStorage.removeItem(STORAGE_KEY_ROLE)
    await Securite.SET(STORAGE_KEY_ACHETEUR_EMAIL, email)
    await Securite.SET(STORAGE_KEY_JWT, token)
    await AsyncStorage.setItem(STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION, email)
    const nom = email.split('@')[0].replace(/\d+$/, '')
    const profilData = { nom, email }
    await Securite.SET(STORAGE_KEY_PROFIL, JSON.stringify(profilData))
    if (user?.telephone) {
      await Securite.SET(STORAGE_KEY_NUMERO, user.telephone)
      setNumeroTel(user.telephone)
    }
    setEmail(email)
    setJwt(token)
    setProfil(profilData)
    setRole('acheteur')
    setAcheteurEmailSuggestion(email)
    // Enregistrer le token push pour les notifications
    try {
      configurerNotifications()
      const pushToken = await obtenirTokenPush()
      if (pushToken) await enregistrerToken(pushToken, 'acheteur')
    } catch (err) {
      console.error('Erreur push token acheteur:', err.message)
    }
  }

  const tenterBiometrie = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      if (!compatible) return
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Connecte-toi avec ton empreinte',
      })
      if (result.success) {
        let userData = await Securite.GET(STORAGE_KEY_USER)
        if (!userData) userData = await AsyncStorage.getItem(STORAGE_KEY_USER)
        const token = await Securite.GET(STORAGE_KEY_JWT)
        if (token && userData) {
          await connecterOrganisateur(token, JSON.parse(userData))
        }
      }
    } catch {
    }
  }

  const nettoyerSession = async () => {
    await supprimerToken(role || 'organisateur')
    await AsyncStorage.multiRemove([
      STORAGE_KEY_ROLE,
      STORAGE_KEY_ACHETEUR_PIN,
      STORAGE_KEY_BIOMETRIC_EMAIL,
      STORAGE_KEY_ORGA_EMAIL_SUGGESTION,
      STORAGE_KEY_ACHETEUR_EMAIL_SUGGESTION,
    ])
    await Securite.SUPPRIMER(STORAGE_KEY_ROLE)
    await Securite.SUPPRIMER(STORAGE_KEY_BIOMETRIC_EMAIL)
    await Securite.SUPPRIMER(STORAGE_KEY_NUMERO)
    await Securite.SUPPRIMER(STORAGE_KEY_JWT)
    await Securite.SUPPRIMER(STORAGE_KEY_EMAIL)
    await Securite.SUPPRIMER(STORAGE_KEY_USER)
    await Securite.SUPPRIMER(STORAGE_KEY_PROFIL)
    await Securite.SUPPRIMER(STORAGE_KEY_ACHETEUR_EMAIL)
    await Securite.SUPPRIMER(STORAGE_KEY_EVENEMENT_ID)
    await Securite.SUPPRIMER(STORAGE_KEY_EVENEMENT_TITRE)
    setRole(null)
    setNumeroTel(null)
    setJwt(null)
    setEmail(null)
    setUser(null)
    setProfil(null)
    setEvenementId(null)
    setEvenementTitre(null)
    setHasSavedSession(false)
    setSessionEmail(null)
    setOrgaEmailSuggestion(null)
    setAcheteurEmailSuggestion(null)
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

  const value = useMemo(() => ({
    role,
    numeroTel,
    jwt,
    email,
    user,
    profil,
    evenementId,
    evenementTitre,
    chargement,
    connecterAcheteur,
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
  }), [
    role, numeroTel, jwt, email, user, profil,
    evenementId, evenementTitre, chargement,
    hasSavedSession, sessionEmail,
    orgaEmailSuggestion, acheteurEmailSuggestion,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
