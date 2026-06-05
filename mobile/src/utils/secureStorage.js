// Couche de stockage sécurisé exclusive (SecureStore uniquement)
// Utilise expo-secure-store (Keychain/Keystore natif)
// Aucun fallback vers AsyncStorage pour éviter l'exposition de données sensibles
// Les clés sont automatiquement nettoyées : SecureStore n'accepte que
// les caractères alphanumériques, ., - et _
import * as SecureStore from 'expo-secure-store'

let available = null

const VERIFIER_DISPONIBILITE = async () => {
  if (available === null) {
    try {
      available = await SecureStore.isAvailableAsync()
    } catch {
      available = false
    }
  }
  return available
}

// Nettoie la clé pour SecureStore : supprime les caractères non autorisés
// SecureStore n'accepte que [a-zA-Z0-9._-]
const NETTOYER_CLE = (key) => key.replace(/[^a-zA-Z0-9._-]/g, '_')

const SET = async (key, value) => {
  if (!(await VERIFIER_DISPONIBILITE())) {
    throw new Error('SecureStore n\'est pas disponible sur cet appareil')
  }
  await SecureStore.setItemAsync(NETTOYER_CLE(key), value)
}

const GET = async (key) => {
  if (!(await VERIFIER_DISPONIBILITE())) {
    throw new Error('SecureStore n\'est pas disponible sur cet appareil')
  }
  return await SecureStore.getItemAsync(NETTOYER_CLE(key))
}

const SUPPRIMER = async (key) => {
  if (await VERIFIER_DISPONIBILITE()) {
    await SecureStore.deleteItemAsync(NETTOYER_CLE(key))
  }
}

export { SET, GET, SUPPRIMER }
