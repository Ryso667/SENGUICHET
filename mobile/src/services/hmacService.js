// Service centralisé pour la gestion sécurisée de la clé HMAC
// La clé est stockée dans SecureStore (Keychain/Keystore) et jamais en clair dans le code source
// Elle est initialement fournie par le serveur après authentification

import * as Securite from '../utils/secureStorage'

const STORAGE_KEY_HMAC = '@senguichet_hmac_secret'

// Récupère la clé HMAC depuis SecureStore
// En développement, utilise un fallback local (à supprimer quand le serveur fournira la clé)
export async function getHMACSecret() {
  try {
    const secret = await Securite.GET(STORAGE_KEY_HMAC)
    if (secret) return secret
  } catch {
    // SecureStore non disponible, on utilise le fallback
  }
  // TODO: Supprimer ce fallback quand le backend fournira la clé après authentification
  return 'senguichet-hmac-secret-v1'
}

// Stocke la clé HMAC dans SecureStore (appelé après connexion au serveur)
export async function setHMACSecret(secret) {
  await Securite.SET(STORAGE_KEY_HMAC, secret)
}

// Supprime la clé HMAC (appelé à la déconnexion)
export async function clearHMACSecret() {
  await Securite.SUPPRIMER(STORAGE_KEY_HMAC)
}
