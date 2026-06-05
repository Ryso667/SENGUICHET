// Client HTTP centralisé pour les appels API backend
// Gère l'URL de base, l'en-tête Authorization JWT, le retry et les erreurs réseau
import { API_BASE_URL, API_TIMEOUT } from '../config'
import * as Securite from '../utils/secureStorage'

const STORAGE_KEY_JWT = '@senguichet_jwt'
const MAX_RETRY = 2 // Nombre de tentatives supplémentaires en cas d'échec

// Effectue un appel API authentifié avec retry automatique
// endpoint : chemin après /api (ex: '/evenements/')
// options : { method, body, retry } — body est automatiquement JSON.stringify
// Retourne les données JSON ou lance une erreur
export async function appelAPI(endpoint, options = {}) {
  const tentativesMax = options.retry !== undefined ? options.retry : MAX_RETRY

  for (let tentative = 0; tentative <= tentativesMax; tentative++) {
    try {
      return await executerRequete(endpoint, options)
    } catch (err) {
      const estDerniere = tentative === tentativesMax
      if (estDerniere) throw err
      // Attente avec backoff exponentiel : 1s, 2s, 4s...
      const delai = Math.min(1000 * Math.pow(2, tentative), 8000)
      await new Promise((resolve) => setTimeout(resolve, delai))
    }
  }
}

// Exécute une requête HTTP unique (appelée par appelAPI avec retry)
async function executerRequete(endpoint, options) {
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
        'Connexion impossible au serveur. Vérifie que le backend est lancé.'
      )
    }
    throw new Error(err.message || 'Erreur réseau')
  } finally {
    clearTimeout(timeout)
  }
}
