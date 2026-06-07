// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

import { Platform } from 'react-native'

const PC_IP = '192.168.1.10'
const PORT = '8080'

// URL de l'API backend (Vercel en production, localhost en développement)
// Sera remplacé par une variable d'environnement à terme
export const API_BASE_URL = 'https://backend-beta-six-39.vercel.app/api'

export const API_TIMEOUT = 10000 // 10 secondes avant abandon

// Clé secrète partagée pour la signature HMAC des QR codes
// Sera remplacé par API — lue via EXPO_PUBLIC_HMAC_SECRET dans .env (gitignoré)
export const HMAC_SECRET = process.env.EXPO_PUBLIC_HMAC_SECRET || 'senguichet-hmac-secret-v1'
