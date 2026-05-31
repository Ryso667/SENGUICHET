// Service d'authentification : OTP acheteur, code contrôleur, email organisateur
// Mode démo : toutes les fonctions retournent des valeurs mockées (sauf organisateur qui appelle l'API)
import AsyncStorage from '@react-native-async-storage/async-storage'
import { appelAPI } from './apiService'

const MOCK_MODE = true // Sera remplacé par API lorsque le backend Node.js sera prêt

// Demande l'envoi d'un code OTP au numéro donné (mock : stocke '123456')
export const envoyerOTP = async (numeroTel) => {
  if (MOCK_MODE) {
    await AsyncStorage.setItem('@senguichet_mock_otp', '123456')
    return { message: 'Code envoyé' }
  }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/otp/envoyer', { numeroTel })
  return data
}

// Vérifie le code OTP saisi (mock : accepte uniquement 123456)
export const verifierOTP = async (numeroTel, code) => {
  if (MOCK_MODE) {
    const mockCode = await AsyncStorage.getItem('@senguichet_mock_otp')
    if (!mockCode || code !== mockCode) return { valide: false }
    await AsyncStorage.removeItem('@senguichet_mock_otp')
    return { valide: true, numeroTel }
  }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/otp/verifier', { numeroTel, code })
  return data
}

// Inscription d'un nouvel organisateur — utilisée par InscriptionOrganisateurScreen
// Retourne un user mocké avec statut "en_attente" en mode démo
export const inscrireOrganisateur = async (payload) => {
  if (MOCK_MODE) {
    // Simule une inscription — retourne un user en attente de validation
    return {
      message: 'Inscription envoyée',
      user: {
        id: Date.now(),
        nom: payload.nom,
        email: payload.email,
        telephone: payload.telephone,
        role: 'ORGANISATEUR',
        statut: 'en_attente',
      },
    }
  }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/organisateur/inscription', payload)
  return data
}

// Connexion organisateur (email + mot de passe)
// Appelle le backend Express, retourne { token, user }
export const connecterOrganisateur = async (email, motsDePasse) => {
  return appelAPI('/auth/organisateur/connexion', {
    method: 'POST',
    body: { email, motDePasse: motsDePasse },
  })
}

// Connexion administrateur (non utilisé dans l'app actuelle)
export const connecterAdmin = async (email, motsDePasse) => {
  if (MOCK_MODE) return { token: 'mock-jwt-admin', role: 'admin' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/admin/connexion', { email, motsDePasse })
  return data
}

// Connexion contrôleur via code d'accès à 4 chiffres (mock : accepte tout)
export const connecterControleur = async (codeAcces) => {
  if (MOCK_MODE) return { token: 'mock-jwt-controleur', role: 'controleur' } // Sera remplacé par API
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/controleur/connexion', { codeAcces })
  return data
}
