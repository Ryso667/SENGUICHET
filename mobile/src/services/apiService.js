// Client HTTP centralisé pour les appels API backend
// Gère l'URL de base, l'en-tête Authorization JWT et les erreurs réseau
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'http://10.0.2.2:8080/api' // Android emulator -> localhost
// Pour iOS simulateur, utiliser 'http://localhost:8080/api'
// Pour un vrai appareil, utiliser l'IP locale du PC

// Effectue un appel API authentifié
// endpoint : chemin après /api (ex: '/evenements/')
// options : { method, body } — body est automatiquement JSON.stringify
// Retourne les données JSON ou lance une erreur
export async function appelAPI(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('@senguichet_jwt')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`)
  return data
}
