// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

// URL de l'API backend (Vercel en production)
export const API_BASE_URL = 'https://backend-beta-six-39.vercel.app/api'

export const API_TIMEOUT = 10000 // 10 secondes avant abandon

// Clé secrète partagée pour la signature HMAC des QR codes
// Sera remplacé par API — lue via EXPO_PUBLIC_HMAC_SECRET dans .env (gitignoré)
const _hmac = process.env.EXPO_PUBLIC_HMAC_SECRET
if (!_hmac) console.warn('⚠️ HMAC_SECRET non défini — toute vérification QR offline retournera FRAUDE')
export const HMAC_SECRET = _hmac || ''
