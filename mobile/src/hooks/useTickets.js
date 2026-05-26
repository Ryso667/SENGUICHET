// Hook useTickets : lecture des tickets acheteur depuis SQLite
// Gère le soft delete et la migration depuis AsyncStorage
import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTicketsActifs, getTicketsSupprimes, supprimerTicket, restaurerTicket, insererTicketAchete } from '../database/database'
import { useAuth } from '../context/AuthContext'

export function useTickets() {
  const { numeroTel } = useAuth()
  const [tickets, setTickets] = useState([])
  const [ticketsSupprimes, setTicketsSupprimes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!numeroTel) { setLoading(false); return }
    setLoading(true)
    try {
      // Migration unique par téléphone : tickets AsyncStorage → SQLite
      // Normalise les numéros (avec/sans espace) avant comparaison
      const cleMigree = `@senguichet_migrated_db_${numeroTel.replace(/\D/g, '')}`
      const migree = await AsyncStorage.getItem(cleMigree)
      if (!migree) {
        const raw = await AsyncStorage.getItem('@senguichet_tickets')
        const anciens = raw ? JSON.parse(raw) : []
        const telNu = numeroTel.replace(/\D/g, '')
        for (const t of anciens) {
          const tTelNu = (t.telephone || '').replace(/\D/g, '')
          if (tTelNu === telNu) await insererTicketAchete(t)
        }
        await AsyncStorage.setItem(cleMigree, '1')
      }

      const actifs = await getTicketsActifs(numeroTel)
      const supprimes = await getTicketsSupprimes(numeroTel)
      setTickets(actifs || [])
      setTicketsSupprimes(supprimes || [])
    } catch (e) {
      console.warn('useTickets load error:', e.message)
      setTickets([])
      setTicketsSupprimes([])
    } finally {
      setLoading(false)
    }
  }, [numeroTel])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(() => load(), [load])

  const softDelete = useCallback(async (id) => {
    await supprimerTicket(id)
    await refresh()
  }, [refresh])

  const restore = useCallback(async (id) => {
    await restaurerTicket(id)
    await refresh()
  }, [refresh])

  return { tickets, ticketsSupprimes, loading, refresh, softDelete, restore }
}
