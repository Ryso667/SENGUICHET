// Utilitaires de nettoyage des données legacy stockées localement
// Nettoie AsyncStorage et SQLite des vieilles données de test
// Appelé une seule fois après mise à jour
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SQLite from 'expo-sqlite'

const CLEANUP_KEY = '@senguichet_cleanup_v2'

// Nettoie toutes les données mockées stockées localement
export async function nettoyerDonneesLegacy() {
  try {
    const dejaNettoye = await AsyncStorage.getItem(CLEANUP_KEY)
    if (dejaNettoye) return

    // Supprimer les clés de tickets et événements mockés
    await AsyncStorage.multiRemove([
      '@senguichet_tickets',
      '@senguichet_evenements',
      '@senguichet_audit',
    ])

    // Supprimer les marqueurs de migration (seront recréés si besoin)
    const toutesClefs = await AsyncStorage.getAllKeys()
    const clefsMigration = toutesClefs.filter(k => k.startsWith('@senguichet_migrated_db_'))
    if (clefsMigration.length > 0) {
      await AsyncStorage.multiRemove(clefsMigration)
    }

    // Nettoyer SQLite buyer_tickets
    const db = await SQLite.openDatabaseAsync('senguichet.db')
    await db.execAsync('DROP TABLE IF EXISTS buyer_tickets;')
    await db.closeAsync()

    await AsyncStorage.setItem(CLEANUP_KEY, '1')
    console.log('✅ Nettoyage données legacy effectué')
  } catch (e) {
    console.warn('⚠️ Nettoyage legacy ignoré:', e.message)
  }
}
