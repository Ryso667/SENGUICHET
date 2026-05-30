// Configuration centralisée de l'application
// Adapte l'URL API selon l'environnement d'exécution

import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Adresse IP du PC sur le réseau local (WiFi)
// À changer si l'IP du PC change ou pour un autre réseau
// Pour trouver l'IP : ipconfig (Windows) ou ifconfig (Mac/Linux)
const PC_IP = '192.168.1.37'
const PORT = '8080'

// Détermine l'URL de base selon l'environnement d'exécution
// - Émulateur Android  : 10.0.2.2 = localhost de la machine hôte
// - Simulateur iOS      : localhost fonctionne
// - Appareil réel       : utiliser l'IP locale du PC sur le même réseau WiFi
export const API_BASE_URL = (() => {
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:' + PORT + '/api'
  }
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return 'http://localhost:' + PORT + '/api'
  }
  return 'http://' + PC_IP + ':' + PORT + '/api'
})()
