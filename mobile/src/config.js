// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

import { Platform } from 'react-native'

// Adresse IP du PC sur le réseau local (WiFi)
// À changer si l'IP du PC change ou pour un autre réseau
// Pour trouver l'IP : ipconfig (Windows) ou ifconfig (Mac/Linux)
// ⚠️ Si la connexion ne marche pas sur iPhone :
//    1. Désactive "Adresse Wi-Fi privée" dans les paramètres WiFi
//    2. Vérifie que le routeur n'isole pas les clients
//    3. Ou utilise le mode tunnel : npx expo start --tunnel --port 8083
const PC_IP = '192.168.1.149'
const PORT = '8080'

// Détermine l'URL de base selon la plateforme
// - Android (émulateur) : 10.0.2.2 pointe vers localhost de l'hôte
// - iOS (simulateur/réel) et autres : utiliser l'IP locale du même réseau WiFi
export const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:' + PORT + '/api'
  : 'http://' + PC_IP + ':' + PORT + '/api'

export const API_TIMEOUT = 10000 // 10 secondes avant abandon
