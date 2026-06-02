// Service d'authentification : sociale (Google/Apple), code contrôleur, email organisateur
// Le flux OTP téléphone a été remplacé par l'authentification sociale (Google/Apple)
import { appelAPI } from './apiService'

const MOCK_MODE = true

// Connecte un acheteur via Firebase Social Auth (Google/Apple)
// Envoie le firebaseToken au backend qui le vérifie et retourne un JWT de session
export const connecterAcheteurSocial = async (firebaseToken) => {
  return appelAPI('/auth/social', {
    method: 'POST',
    body: { firebaseToken },
  })
}

// Inscription d'un nouvel organisateur — utilisée par InscriptionOrganisateurScreen
export const inscrireOrganisateur = async (payload) => {
  if (MOCK_MODE) {
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

// Connexion contrôleur via code d'accès à 4 chiffres (mock : accepte tout)
export const connecterControleur = async (codeAcces) => {
  if (MOCK_MODE) return { token: 'mock-jwt-controleur', role: 'controleur' }
  const axios = (await import('axios')).default
  const { data } = await axios.post('http://localhost:3000/api/auth/controleur/connexion', { codeAcces })
  return data
}
