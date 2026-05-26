import * as SQLite from 'expo-sqlite'

let db = null

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

export async function chercherTicket(uuid) {
  const bd = await getDb()
  return await bd.getFirstAsync('SELECT * FROM tickets WHERE uuid = $uuid', { $uuid: uuid })
}

export async function marquerUtilise(uuid) {
  const bd = await getDb()
  await bd.runAsync('UPDATE tickets SET statut = $statut WHERE uuid = $uuid', {
    $uuid: uuid,
    $statut: 'UTILISE_LOCAL',
  })
}

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

export async function scansEnAttente() {
  const bd = await getDb()
  return await bd.getAllAsync('SELECT * FROM scans WHERE synced = 0 ORDER BY timestamp_scan ASC')
}

export async function marquerScansSync() {
  const bd = await getDb()
  await bd.runAsync('UPDATE scans SET synced = 1 WHERE synced = 0')
}

export async function historiqueScans() {
  const bd = await getDb()
  return await bd.getAllAsync('SELECT * FROM scans ORDER BY timestamp_scan DESC')
}

export async function compterTickets() {
  const bd = await getDb()
  const row = await bd.getFirstAsync('SELECT COUNT(*) as total FROM tickets')
  return row?.total || 0
}

export async function viderTickets() {
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets')
  await bd.runAsync('DELETE FROM scans')
}
