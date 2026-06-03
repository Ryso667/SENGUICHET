// Hook React pour charger une image aléatoire Unsplash selon une catégorie
// Retourne { url, loading, error, refresh }
// Utilise l'API publique Unsplash avec un mapping catégorie → query
import { useState, useEffect, useCallback } from 'react'

const CATEGORY_MAP = {
  Concert: 'concert crowd music senegal dakar africa',
  Festival: 'festival celebration dance africa senegal',
  Theatre: 'theatre stage culture africa',
  Sport: 'stadium football competition africa senegal',
  Conference: 'conference hall speaker africa seminar',
  Art: 'african art exhibition gallery contemporary',
  Soiree: 'party nightlife celebration africa music',
}

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY

// Cache en mémoire pour éviter les appels API répétés pour la même catégorie
const urlCache = new Map()

// Charge une image Unsplash aléatoire pour une catégorie donnée
// category : string (optionnelle, défaut 'event party')
// Retourne : { url, loading, error, refresh }
export default function useUnsplashImage(category) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const query = CATEGORY_MAP[category] || 'event celebration senegal africa'

  const fetchImage = useCallback(async () => {
    if (!ACCESS_KEY) {
      setUrl(null)
      setLoading(false)
      setError('No Unsplash key configured')
      return
    }

    // Retourne l'URL en cache si déjà chargée pour cette catégorie
    if (urlCache.has(query)) {
      setUrl(urlCache.get(query))
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&w=800`,
        { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
      )
      if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)
      const data = await res.json()
      const imageUrl = data.urls?.regular || null
      if (imageUrl) urlCache.set(query, imageUrl)
      setUrl(imageUrl)
    } catch (e) {
      setError(e.message)
      setUrl(null)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { fetchImage() }, [fetchImage])

  return { url, loading, error, refresh: fetchImage }
}
