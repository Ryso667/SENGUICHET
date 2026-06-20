// Service Firebase : authentification sociale (Google/Apple)
// Utilise le SDK Web Firebase pour fonctionner dans Expo Go
// Nécessite les variables EXPO_PUBLIC_FIREBASE_* dans .env

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, getReactNativePersistence, GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
let auth
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  })
} catch {
  auth = getAuth(app)
}

// Connecte Firebase avec un token Google OAuth
// Recoit l'idToken de Google, crée un credential Firebase, signe l'utilisateur
// Retourne { firebaseToken, profil } où firebaseToken est l'ID token Firebase
export const connecterGoogle = async (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken)
  const resultat = await signInWithCredential(auth, credential)
  const firebaseToken = await resultat.user.getIdToken()
  return {
    firebaseToken,
    profil: {
      nom: resultat.user.displayName || resultat.user.email?.split('@')[0] || 'Acheteur',
      email: resultat.user.email,
      photo_url: resultat.user.photoURL,
    },
  }
}

// Connecte Firebase avec un token Apple
// Recoit l'identityToken Apple, crée un credential OAuth, signe l'utilisateur
export const connecterApple = async (identityToken) => {
  const provider = new OAuthProvider('apple.com')
  const credential = provider.credential({ idToken: identityToken })
  const resultat = await signInWithCredential(auth, credential)
  const firebaseToken = await resultat.user.getIdToken()
  return {
    firebaseToken,
    profil: {
      nom: resultat.user.displayName || resultat.user.email?.split('@')[0] || 'Acheteur',
      email: resultat.user.email,
      photo_url: resultat.user.photoURL,
    },
  }
}

export { auth, firebaseConfig }
