// Client HTTP centralisé pour les appels API backend
// Gère l'URL de base, l'en-tête Authorization JWT et les erreurs réseau
import { API_BASE_URL, API_TIMEOUT } from '../config'
import * as Securite from '../utils/secureStorage'

const STORAGE_KEY_JWT = '@senguichet_jwt'

// Effectue un appel API authentifié
// endpoint : chemin après /api (ex: '/evenements/')
// options : { method, body } — body est automatiquement JSON.stringify
// Retourne les données JSON ou lance une erreur
export async function appelAPI(endpoint, options = {}) {
  let token = null
  try {
    token = await Securite.GET(STORAGE_KEY_JWT)
  } catch {
    // SecureStore non disponible, appel sans token
  }
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`)
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `Connexion impossible au serveur (${API_BASE_URL}${endpoint}). ` +
        'Vérifie que le backend est lancé et que l\'iPhone est sur le même WiFi.'
      )
    }
    throw new Error(err.message || 'Erreur réseau')
  } finally {
    clearTimeout(timeout)
  }
}
