// Base de données SQLite locale pour le mode offline
// Tables : tickets (billets téléchargés contrôleur), scans (historique), acheteur_tickets (billets achetés)
import * as SQLite from 'expo-sqlite'
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

    CREATE TABLE IF NOT EXISTS acheteur_tickets (
      uuid TEXT PRIMARY KEY,
      event_id INTEGER NOT NULL,
      event_nom TEXT NOT NULL,
      event_date TEXT,
      event_heure TEXT,
      event_lieu TEXT,
      categorie TEXT NOT NULL,
      numero TEXT NOT NULL,
      prix REAL DEFAULT 0,
      statut TEXT NOT NULL DEFAULT 'actif',
      telephone TEXT NOT NULL,
      date_achat TEXT NOT NULL,
      qr_data TEXT
    );
  `)
}

// Insère ou remplace une liste de tickets dans la base locale (tickets téléchargés pour offline)
export async function insererTickets(tickets) {
  const bd = await getDb()
  const ins = await bd.prepareAsync(
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

// Recherche un ticket (table tickets) par son UUID
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

// Récupère les scans non encore synchronisés (synced=0)
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

// Récupère l'historique des scans enrichi avec les infos de l'événement
export async function historiqueScansAvecDetails() {
  const bd = await getDb()
  return await bd.getAllAsync(`
    SELECT s.*, t.event_id, t.category
    FROM scans s
    LEFT JOIN tickets t ON s.uuid_billet = t.uuid
    ORDER BY s.timestamp_scan DESC
  `)
}

// Compte les scans par résultat (pour les stats)
export async function compterScansParResultat() {
  const bd = await getDb()
  return await bd.getAllAsync(`
    SELECT resultat, COUNT(*) as nombre FROM scans GROUP BY resultat
  `)
}

// Compte le nombre de tickets stockés localement
export async function compterTickets() {
  const bd = await getDb()
  const row = await bd.getFirstAsync('SELECT COUNT(*) as total FROM tickets')
  return row?.total || 0
}

// Sauvegarde un ticket acheté dans la base locale (consultation hors-ligne)
export async function sauvegarderTicketAcheteur(t) {
  const bd = await getDb()
  await bd.runAsync(
    `INSERT OR REPLACE INTO acheteur_tickets
     (uuid, event_id, event_nom, event_date, event_heure, event_lieu,
      categorie, numero, prix, statut, telephone, date_achat, qr_data)
     VALUES ($uuid, $event_id, $event_nom, $event_date, $event_heure, $event_lieu,
      $categorie, $numero, $prix, $statut, $telephone, $date_achat, $qr_data)`,
    {
      $uuid: t.uuid,
      $event_id: t.eventId,
      $event_nom: t.eventNom || '',
      $event_date: t.eventDate || null,
      $event_heure: t.eventHeure || null,
      $event_lieu: t.eventLieu || null,
      $categorie: t.categorie,
      $numero: t.numero || '',
      $prix: t.prix || 0,
      $statut: t.statut || 'actif',
      $telephone: t.telephone || '',
      $date_achat: t.dateAchat || new Date().toISOString(),
      $qr_data: t.qrData || t.qrPayload || null,
    }
  )
}

// Retourne tous les tickets achetés stockés localement, du plus récent au plus ancien
export async function mesTicketsLocaux() {
  const bd = await getDb()
  const rows = await bd.getAllAsync('SELECT * FROM acheteur_tickets ORDER BY date_achat DESC')
  return rows.map(r => ({
    ...r,
    eventNom: r.event_nom,
    eventDate: r.event_date,
    eventHeure: r.event_heure,
    eventLieu: r.event_lieu,
    dateAchat: r.date_achat,
    qrData: r.qr_data || r.qrData,
  }))
}

// Supprime un ticket local par son uuid
export async function supprimerTicketLocal(uuid) {
  const bd = await getDb()
  await bd.runAsync('DELETE FROM acheteur_tickets WHERE uuid = $uuid', { $uuid: uuid })
}

// Vide les tables locales (tickets + scans)
export async function viderTickets() {
  const bd = await getDb()
  await bd.runAsync('DELETE FROM tickets')
  await bd.runAsync('DELETE FROM scans')
}
