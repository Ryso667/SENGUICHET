// Service d'authentification : sociale (Google/Apple), code contrôleur, email organisateur
// Le flux OTP téléphone a été remplacé par l'authentification sociale (Google/Apple)
import * as Crypto from 'expo-crypto'
import { appelAPI } from './apiService'
import * as Securite from '../utils/secureStorage'

const STORAGE_KEY_CTRL_CODE = '@senguichet_ctrl_code'

// Connecte un acheteur via Firebase Social Auth (Google/Apple)
// Envoie le firebaseToken au backend qui le vérifie et retourne un JWT de session
export const connecterAcheteurSocial = async (firebaseToken) => {
  return appelAPI('/auth/social', {
    method: 'POST',
    body: { firebaseToken },
  })
}

// Inscription d'un nouvel organisateur via le backend
// Partagé avec le frontend-web : mêmes données, même API
export const inscrireOrganisateur = async (payload) => {
  return appelAPI('/auth/organisateur/inscription', {
    method: 'POST',
    body: payload,
  })
}

// Connexion organisateur (email + mot de passe) via le backend
// Partagé avec le frontend-web : vérification centralisée côté serveur
export const connecterOrganisateur = async (email, motDePasse) => {
  const data = await appelAPI('/auth/organisateur/connexion', {
    method: 'POST',
    body: { email, motDePasse },
  })
  return { token: data.token, user: data.user }
}

// Connexion contrôleur via code d'accès à 4 chiffres
// Appelle le backend qui vérifie le code et retourne un JWT signé
export const connecterControleur = async (codeAcces) => {
  return appelAPI('/auth/controleur', {
    method: 'POST',
    body: { codeAcces },
  })
}

// Envoie un code OTP à l'email de l'acheteur via le backend
// Retourne { message, simulé, code? } — le code est renvoyé en mode simulé
export const envoyerCodeOTP = async (email) => {
  return appelAPI('/auth/acheteur/envoyer-code', {
    method: 'POST',
    body: { email },
  })
}

// Vérifie le code OTP saisi par l'acheteur
// Retourne { token, user } si le code est correct
export const verifierCodeOTP = async (email, code) => {
  return appelAPI('/auth/acheteur/verifier-code', {
    method: 'POST',
    body: { email, code },
  })
}
