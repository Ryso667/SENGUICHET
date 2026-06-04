// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

import { Platform } from 'react-native'

const PC_IP = '192.168.1.10'
const PORT = '8080'

// URL de l'API backend (Vercel en production, localhost en développement)
// Sera remplacé par une variable d'environnement à terme
export const API_BASE_URL = 'https://backend-rust-sigma-64.vercel.app/api'

export const API_TIMEOUT = 10000 // 10 secondes avant abandon

// ATTENTION : La clé HMAC ne doit PAS être codée en dur ici.
// Utiliser hmacService.getHMACSecret() qui la récupère depuis SecureStore.
// Voir mobile/src/services/hmacService.js
