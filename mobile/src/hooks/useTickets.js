// Hook personnalisé pour charger et gérer les tickets depuis AsyncStorage
// Utilisé principalement par l'écran d'accueil acheteur (HomeScreen)
import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const TICKETS_KEY = '@senguichet_tickets'

export function useTickets() {
  const [tickets, setTickets] = useState([])  // liste des tickets de l'utilisateur
  const [loading, setLoading] = useState(true) // état de chargement initial

  // Charge les tickets au montage du composant
  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(TICKETS_KEY)
        if (raw) setTickets(JSON.parse(raw))
      } catch (e) {
        console.warn('Failed to load tickets', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Ajoute un ticket et met à jour le state + AsyncStorage
  const addTicket = useCallback(async (ticket) => {
    const newTickets = [ticket]
    try {
      const raw = await AsyncStorage.getItem(TICKETS_KEY)
      const existing = raw ? JSON.parse(raw) : []
      const updated = [...existing, ticket]
      await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated))
      setTickets(updated)
    } catch (e) {
      console.warn('Failed to save ticket', e)
    }
  }, [])

  // Recharge les tickets depuis AsyncStorage (utilisé au focus de l'écran)
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await AsyncStorage.getItem(TICKETS_KEY)
      setTickets(raw ? JSON.parse(raw) : [])
    } catch (e) {
      console.warn('Failed to refresh tickets', e)
    } finally {
      setLoading(false)
    }
  }, [])

  return { tickets, loading, addTicket, refresh }
}
