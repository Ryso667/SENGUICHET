import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const TICKETS_KEY = '@senguichet_tickets'

export function useTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

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

  return { tickets, loading, addTicket }
}
