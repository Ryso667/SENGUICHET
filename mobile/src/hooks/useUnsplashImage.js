// Hook React pour charger une image aléatoire Unsplash selon une catégorie
// Retourne { url, loading, error, refresh }
// Utilise l'API publique Unsplash avec un mapping catégorie → query
import { useState, useEffect, useCallback } from 'react'

const CATEGORY_MAP = {
  Concert: 'concert crowd music',
  Festival: 'festival celebration',
  Theatre: 'theater stage',
  Sport: 'sport stadium',
  Conference: 'conference speaker',
  Art: 'art exhibition gallery',
  Soiree: 'party dance nightclub',
}

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY

// Charge une image Unsplash aléatoire pour une catégorie donnée
// category : string (optionnelle, défaut 'event party')
// Retourne : { url, loading, error, refresh }
export default function useUnsplashImage(category) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const query = CATEGORY_MAP[category] || 'event party'

  const fetchImage = useCallback(async () => {
    if (!ACCESS_KEY) {
      setUrl(null)
      setLoading(false)
      setError('No Unsplash key configured')
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
      setUrl(data.urls?.regular || null)
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
