import * as SQLite from 'expo-sqlite'

// Base de données SQLite locale pour le mode offline-first
// Tables : tickets (billets téléchargés) et scans (historique des vérifications)
let db = null

// Initialisation : ouvre la base et crée les tables si elles n'existent pas
export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('senguichet.db')
    await initTables()
  }
  return db
}

async function initTables() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tickets (
      uuid TEXT PRIMARY KEY,
      hmac TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      timestamp_gen TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'DISPONIBLE'
    );

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid_billet TEXT NOT NULL,
      hmac TEXT NOT NULL,
      timestamp_scan TEXT NOT NULL,
      resultat TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_scans_synced ON scans(synced);
    CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
  `)
}

// Insère ou remplace une liste de tickets dans la base locale
export async function insererTickets(tickets) {
  const bd = await getDb()
  const ins = bd.prepareAsync(
    'INSERT OR REPLACE INTO tickets (uuid, hmac, event_id, category, timestamp_gen, statut) VALUES ($uuid, $hmac, $event_id, $category, $timestamp_gen, $statut)'
  )
  for (const t of tickets) {
    await ins.executeAsync({
      $uuid: t.uuid,
      $hmac: t.hmac,
      $event_id: t.event_id,
      $category: t.category,
      $timestamp_gen: t.timestamp_gen || new Date().toISOString(),
      $statut: 'DISPONIBLE',
    })
  }
  await ins.finalizeAsync()
}

// Recherche un ticket par son UUID
export async function chercherTicket(uuid) {
  const bd = await getDb()
  return await bd.getFirstAsync('SELECT * FROM tickets WHERE uuid = $uuid', { $uuid: uuid })
}

// Marque un ticket comme utilisé localement (anti re-scan)
export async function marquerUtilise(uuid) {
  const bd = await getDb()
  await bd.runAsync('UPDATE tickets SET statut = $statut WHERE uuid = $uuid', {
    $uuid: uuid,
    $statut: 'UTILISE_LOCAL',
  })
}

// Enregistre un scan dans l'historique local (synced = 0 = en attente de synchro)
export async function enregistrerScan(uuid, hmac, resultat) {
  const bd = await getDb()
  await bd.runAsync(
    'INSERT INTO scans (uuid_billet, hmac, timestamp_scan, resultat, synced) VALUES ($uuid, $hmac, $ts, $res, 0)',
    {
      $uuid: uuid,
      $hmac: hmac,
      $ts: new Date().toISOString(),
      $res: resultat,
    }
  )
}

// Récupère les scans non encore synchronisés
export async function scansEnAttente() {
  const bd = await getDb()
  return await bd.getAllAsync('SELECT * FROM scans WHERE synced = 0 ORDER BY timestamp_scan ASC')
}

// Marque tous les scans en attente comme synchronisés
export async function marquerScansSync() {
  const bd = await getDb()
  await bd.runAsync('UPDATE scans SET synced = 1 WHERE synced = 0')
}

// Récupère l'historique complet des scans (du plus récent au plus ancien)
export async function historiqueScans() {
  const bd = await getDb()
  return await bd.getAllAsync('SELECT * FROM scans ORDER BY timestamp_scan DESC')
}

// Compte le nombre de tickets stockés localement
export async function compterTickets() {
  const bd = await getDb()
  const row = await bd.getFirstAsync('SELECT COUNT(*) as total FROM tickets')
  return row?.total || 0
}

// Vide la base locale (tickets + scans)
export async function viderTickets() {
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets')
  await bd.runAsync('DELETE FROM scans')
}
