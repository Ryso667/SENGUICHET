// Service d'authentification : sociale (Google/Apple), code contrôleur, email organisateur
// Le flux OTP téléphone a été remplacé par l'authentification sociale (Google/Apple)
import bcrypt from 'bcryptjs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { appelAPI } from './apiService'

const SALT_ROUNDS = 10
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
// Essaie d'abord l'API (vrai JWT), fallback local si hors-ligne
export const connecterControleur = async (codeAcces) => {
  try {
    const data = await appelAPI('/auth/controleur/connexion', {
      method: 'POST',
      body: { codeAcces },
    })
    return { token: data.token, user: data.user }
  } catch (err) {
    // Fallback local si API inaccessible
    let storedHash = await AsyncStorage.getItem(STORAGE_KEY_CTRL_CODE)
    if (!storedHash) {
      const bcrypt = require('bcryptjs')
      storedHash = await bcrypt.hash('1234', SALT_ROUNDS)
      await AsyncStorage.setItem(STORAGE_KEY_CTRL_CODE, storedHash)
    }
    const { compare } = require('bcryptjs')
    const valide = await compare(codeAcces, storedHash)
    if (!valide) throw new Error("Code d'accès invalide")
    return { token: 'jwt-ctrl-' + Date.now(), role: 'controleur' }
  }
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
