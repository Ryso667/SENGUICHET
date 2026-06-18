// Service de stockage des favoris ❤️
// Utilise AsyncStorage pour persister localement les IDs et données des événements favoris
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@senguichet_favoris'

// Récupère tous les favoris stockés
export async function getAllFavoris() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Récupère la liste des IDs favoris
export async function getFavorisIds() {
  const favoris = await getAllFavoris()
  return Object.keys(favoris)
}

// Vérifie si un événement est favori
export async function estFavori(eventId) {
  const ids = await getFavorisIds()
  return ids.includes(String(eventId))
}

// Bascule le statut favori d'un événement
// eventData : { id, title, date, location, category, affiche_url, emoji, month, day }
// Retourne le nouveau statut (true = favori, false = retiré)
export async function basculerFavori(eventId, eventData = {}) {
  const favoris = await getAllFavoris()
  const key = String(eventId)
  if (favoris[key]) {
    delete favoris[key]
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoris))
    return false
  } else {
    favoris[key] = {
      id: eventId,
      ...eventData,
      dateAjout: new Date().toISOString(),
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoris))
    return true
  }
}
