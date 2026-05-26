import AsyncStorage from '@react-native-async-storage/async-storage'

// Mode démo : true = pas besoin du backend pour tester
// Passer à false quand le backend sera prêt
const MOCK_MODE = true

// Demande l'envoi d'un code OTP au numéro donné
export const envoyerOTP = async (numeroTel) => {
  if (MOCK_MODE) {
    // Stocke un code fixe pour le mode démo
    await AsyncStorage.setItem('@senguichet_mock_otp', '123456')
    return { message: 'Code envoyé' }
  }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/otp/envoyer', { numeroTel })
  return data
}

// Vérifie le code OTP saisi par l'utilisateur
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

// Inscription d'un nouvel organisateur
export const inscrireOrganisateur = async (payload) => {
  if (MOCK_MODE) return { message: 'Demande envoyée' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/organisateur/inscription', payload)
  return data
}

// Connexion organisateur (email + mot de passe)
export const connecterOrganisateur = async (email, motsDePasse) => {
  if (MOCK_MODE) return { token: 'mock-jwt-organisateur', role: 'organisateur' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/organisateur/connexion', { email, motsDePasse })
  return data
}

// Connexion administrateur
export const connecterAdmin = async (email, motsDePasse) => {
  if (MOCK_MODE) return { token: 'mock-jwt-admin', role: 'admin' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/admin/connexion', { email, motsDePasse })
  return data
}

// Connexion contrôleur via code d'accès à 4 chiffres
export const connecterControleur = async (codeAcces) => {
  if (MOCK_MODE) return { token: 'mock-jwt-controleur', role: 'controleur' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/controleur/connexion', { codeAcces })
  return data
}
