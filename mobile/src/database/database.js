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

    CREATE TABLE IF NOT EXISTS buyer_tickets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_nom TEXT NOT NULL,
      event_date TEXT NOT NULL,
      categorie_nom TEXT NOT NULL,
      prix REAL NOT NULL DEFAULT 0,
      telephone TEXT NOT NULL,
      numero TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'valide',
      date_achat TEXT NOT NULL,
      qr_data TEXT,
      qr_secret TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_buyer_tickets_tel ON buyer_tickets(telephone);
    CREATE INDEX IF NOT EXISTS idx_buyer_tickets_deleted ON buyer_tickets(deleted_at);
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

// ─── Tickets achetés (buyer_tickets) ─────────────────────────────────────────

// Garantit que la table buyer_tickets existe (sécurité même si getDb déjà appelée)
async function garantirTableBuyer() {
  const bd = await getDb()
  await bd.execAsync(`
    CREATE TABLE IF NOT EXISTS buyer_tickets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_nom TEXT NOT NULL,
      event_date TEXT NOT NULL,
      categorie_nom TEXT NOT NULL,
      prix REAL NOT NULL DEFAULT 0,
      telephone TEXT NOT NULL,
      numero TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'valide',
      date_achat TEXT NOT NULL,
      qr_data TEXT,
      qr_secret TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_buyer_tickets_tel ON buyer_tickets(telephone);
    CREATE INDEX IF NOT EXISTS idx_buyer_tickets_deleted ON buyer_tickets(deleted_at);
  `)
}

// Ajoute un ticket acheté dans la base SQLite
// Retourne le ticket avec ses champs enrichis
export async function insererTicketAchete(ticket) {
  await garantirTableBuyer()
  const bd = await getDb()
  const now = new Date().toISOString()
  await bd.runAsync(
    `INSERT OR REPLACE INTO buyer_tickets
      (id, event_id, event_nom, event_date, categorie_nom, prix, telephone, numero, statut, date_achat, qr_data, qr_secret, created_at, updated_at)
     VALUES
      ($id, $event_id, $event_nom, $event_date, $categorie_nom, $prix, $telephone, $numero, $statut, $date_achat, $qr_data, $qr_secret, $created_at, $updated_at)`,
    {
      $id: ticket.id,
      $event_id: ticket.eventId,
      $event_nom: ticket.eventNom,
      $event_date: ticket.eventDate,
      $categorie_nom: ticket.categorie,
      $prix: ticket.prix,
      $telephone: (ticket.telephone || '').replace(/\s/g, ''),
      $numero: ticket.numero,
      $statut: ticket.statut || 'valide',
      $date_achat: ticket.dateAchat,
      $qr_data: ticket.qrData || null,
      $qr_secret: ticket.qrSecret || null,
      $created_at: now,
      $updated_at: now,
    }
  )
  return await getTicketAchete(ticket.id)
}

// Récupère un ticket acheté par son ID (soft delete compris)
export async function getTicketAchete(id) {
  const bd = await getDb()
  return await bd.getFirstAsync('SELECT * FROM buyer_tickets WHERE id = $id', { $id: id })
}

function formatTicket(t) {
  if (!t) return null
  return {
    id: t.id,
    eventId: t.event_id,
    eventNom: t.event_nom,
    eventDate: t.event_date,
    categorie: t.categorie_nom,
    prix: t.prix,
    telephone: t.telephone,
    numero: t.numero,
    statut: t.statut,
    dateAchat: t.date_achat,
    dateScan: null,
    deletedAt: t.deleted_at,
    ...(t.qr_data ? { qrData: t.qr_data, qrSecret: t.qr_secret } : {}),
  }
}

// Récupère les tickets actifs (non supprimés) d'un acheteur
export async function getTicketsActifs(telephone) {
  await garantirTableBuyer()
  const bd = await getDb()
  const telNu = telephone.replace(/\s/g, '')
  const rows = await bd.getAllAsync(
    'SELECT * FROM buyer_tickets WHERE telephone = $tel AND deleted_at IS NULL ORDER BY date_achat DESC',
    { $tel: telNu }
  )
  return rows.map(formatTicket)
}

// Récupère les tickets supprimés (soft delete) d'un acheteur
export async function getTicketsSupprimes(telephone) {
  await garantirTableBuyer()
  const bd = await getDb()
  const rows = await bd.getAllAsync(
    'SELECT * FROM buyer_tickets WHERE telephone = $tel AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
    { $tel: telephone }
  )
  return rows.map(formatTicket)
}

// Récupère tous les tickets d'un acheteur (actifs + supprimés)
export async function getToutTicketsAcheteur(telephone) {
  const bd = await getDb()
  return await bd.getAllAsync(
    'SELECT * FROM buyer_tickets WHERE telephone = $tel ORDER BY deleted_at ASC, date_achat DESC',
    { $tel: telephone }
  )
}

// Soft delete : marque un ticket comme supprimé sans l'effacer
export async function supprimerTicket(id) {
  const bd = await getDb()
  await bd.runAsync(
    'UPDATE buyer_tickets SET deleted_at = $now, updated_at = $now WHERE id = $id',
    { $id: id, $now: new Date().toISOString() }
  )
}

// Restaure un ticket supprimé
export async function restaurerTicket(id) {
  const bd = await getDb()
  await bd.runAsync(
    'UPDATE buyer_tickets SET deleted_at = NULL, updated_at = $now WHERE id = $id',
    { $id: id, $now: new Date().toISOString() }
  )
}

// Vide la base locale (tickets + scans + buyer_tickets)
export async function viderTickets() {
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets')
  await bd.runAsync('DELETE FROM scans')
  await bd.runAsync('DELETE FROM buyer_tickets')
}
