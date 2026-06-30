// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

// URL de l'API backend (Vercel en production)
export const API_BASE_URL = 'https://backend-beta-six-39.vercel.app/api'

export const API_TIMEOUT = 10000 // 10 secondes avant abandon

// Clé secrète partagée pour la signature HMAC des QR codes
// Lue via EXPO_PUBLIC_HMAC_SECRET dans .env (gitignoré), inline par Metro au build
// Si absente, la vérification HMAC échoue → tout scan retourne FRAUDE
const HMAC_VALUES = {
  'senguichet-hmac-secret-v1': true,
  'SENGUICHET_HMAC_2024_V1': true,
}
const _hmac = process.env.EXPO_PUBLIC_HMAC_SECRET
if (_hmac && !HMAC_VALUES[_hmac]) {
  console.warn('⚠️ HMAC_SECRET inattendu — vérifie que mobile/.env est synchronisé avec backend/.env')
}
if (!_hmac) {
  console.warn(
    '⚠️ HMAC_SECRET non défini (EXPO_PUBLIC_HMAC_SECRET absent du bundler Metro)\n' +
    '  → Vérifie que mobile/.env existe avec EXPO_PUBLIC_HMAC_SECRET=senguichet-hmac-secret-v1\n' +
    '  → Redémarre Expo (npx expo start --clear)\n' +
    '  → Tout scan retournera FRAUDE tant que ce n\'est pas corrigé'
  )
}
export const HMAC_SECRET = _hmac || ''
