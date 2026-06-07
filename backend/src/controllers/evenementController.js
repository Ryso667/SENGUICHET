const pool = require("../config/db");
const multer = require("multer");
const path = require("path");

// Configuration multer pour l'upload d'affiches
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => cb(null, `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Seuls les fichiers JPG et PNG sont acceptés"));
  },
});

const creer = async (req, res) => {
  try {
    const { titre, description, lieu, ville, categorie, dateDebut, dateFin, heureDebut, capacite, ticketTypes } = req.body;
    const ticketTypesArr = typeof ticketTypes === "string" ? JSON.parse(ticketTypes) : ticketTypes;

    if (!titre || !description || !lieu || !ville || !dateDebut || !heureDebut || !capacite) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const dateDebutFull = `${dateDebut} ${heureDebut}:00`;
    const dateFinFull = dateFin ? `${dateFin} 23:59:00` : null;
    const afficheUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const scanCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [evResult] = await conn.query(
        `INSERT INTO evenement (organisateur_id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, affiche_url, scan_code, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, titre, description, lieu, ville || null, categorie || null, dateDebutFull, dateFinFull, parseInt(capacite), afficheUrl, scanCode, 'en_attente']
      );

      const evenementId = evResult.insertId;

      if (ticketTypesArr && ticketTypesArr.length > 0) {
        const ticketValues = ticketTypesArr.map(t => [
          evenementId, t.nom, t.description || null,
          parseInt(t.prix), parseInt(t.quantite), parseInt(t.quantite)
        ]);
        await conn.query(
          `INSERT INTO categorie_ticket (evenement_id, nom, description, prix, capacite, places_disponibles) VALUES ?`,
          [ticketValues]
        );
      }

      await conn.commit();

      res.status(201).json({
        message: "Événement créé avec succès. En attente de validation par l'administrateur.",
        evenement: { id: evenementId, titre, scanCode, statut: 'en_attente', affiche_url: afficheUrl }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Creer evenement error:", err);
    res.status(500).json({ message: "Erreur lors de la création" });
  }
};

const lister = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.organisateur_id, e.titre, e.description, e.categorie, e.lieu, e.ville,
        e.date_debut, e.date_fin, e.capacite_totale, e.affiche_url, e.scan_code, e.est_actif,
        e.statut, e.date_creation, e.commentaire_admin,
        COALESCE((SELECT SUM(ct.places_disponibles) FROM categorie_ticket ct WHERE ct.evenement_id = e.id), 0) AS places_restantes,
        COALESCE((SELECT SUM(ct.capacite) FROM categorie_ticket ct WHERE ct.evenement_id = e.id), 0) AS capacite_billets,
        (SELECT COALESCE(SUM(b.prix_paye), 0) FROM billet b JOIN categorie_ticket ct2 ON b.categorie_ticket_id = ct2.id WHERE ct2.evenement_id = e.id AND b.est_utilise = 0) AS revenus
      FROM evenement e
      WHERE e.organisateur_id = ? AND e.statut != 'annule'
      ORDER BY e.date_creation DESC`,
      [req.user.id]
    );

    const events = rows.map(r => {
      const remplies = r.billets_vendus || (r.capacite_billets - r.places_restantes);
      const statut =
        r.statut === 'actif' && r.places_restantes <= 0 ? 'sold-out'
        : r.statut === 'actif' ? 'active'
        : r.statut;
      return {
        id: r.id,
        nom: r.titre,
        categorie: r.categorie,
        date: new Date(r.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        lieu: r.lieu,
        remplis: remplies,
        capacite: r.capacite_billets || r.capacite_totale,
        revenus: `${parseInt(r.revenus || 0).toLocaleString()} FCFA`,
        statut,
        code: r.scan_code || '',
        img: r.affiche_url || `/images/event-${(r.id % 3) + 1}.jpg`,
      };
    });

    res.json(events);
  } catch (err) {
    console.error("Lister evenements error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const detail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM evenement WHERE id = ? AND organisateur_id = ?", [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "Événement introuvable" });

    const [tickets] = await pool.query("SELECT * FROM categorie_ticket WHERE evenement_id = ?", [id]);

    // Stats des billets vendus (uniquement ACTIF = payés)
    const [ventes] = await pool.query(
      `SELECT
        COALESCE(COUNT(*), 0) AS total_vendus,
        COALESCE(SUM(b.prix_paye), 0) AS revenus
      FROM billet b
      JOIN categorie_ticket ct ON b.categorie_ticket_id = ct.id
      WHERE ct.evenement_id = ? AND b.est_utilise = 0`,
      [id]
    );

    const capacite_billets = tickets.reduce((s, t) => s + t.capacite, 0);
    const places_restantes = tickets.reduce((s, t) => s + t.places_disponibles, 0);
    const remplis = capacite_billets - places_restantes;
    const taux_remplissage = capacite_billets > 0
      ? Math.round((remplis / capacite_billets) * 100)
      : 0;

    res.json({
      evenement: rows[0],
      tickets,
      stats: {
        capacite_billets,
        places_restantes,
        billets_vendus: ventes[0].total_vendus,
        revenus: ventes[0].revenus,
        remplis,
        taux_remplissage,
      },
    });
  } catch (err) {
    console.error("Detail evenement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const modifier = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, lieu, ville, categorie, dateDebut, dateFin, heureDebut, capacite, ticketTypes } = req.body;
    const ticketTypesArr = typeof ticketTypes === "string" ? JSON.parse(ticketTypes) : (ticketTypes || []);

    const [existing] = await pool.query("SELECT id, statut, affiche_url FROM evenement WHERE id = ? AND organisateur_id = ?", [id, req.user.id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });
    if (existing[0].statut !== 'en_attente' && existing[0].statut !== 'actif') {
      return res.status(400).json({ message: "Impossible de modifier un événement qui n'est plus en attente ou actif" });
    }

    const dateDebutFull = `${dateDebut} ${heureDebut}:00`;
    const dateFinFull = dateFin ? `${dateFin} 23:59:00` : null;
    const afficheUrl = req.file ? `/uploads/${req.file.filename}` : existing[0].affiche_url;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE evenement SET titre=?, description=?, lieu=?, ville=?, categorie=?, date_debut=?, date_fin=?, capacite_totale=?, affiche_url=?
         WHERE id=?`,
        [titre, description, lieu, ville || null, categorie || null, dateDebutFull, dateFinFull, parseInt(capacite), afficheUrl, id]
      );

      await conn.query("DELETE FROM categorie_ticket WHERE evenement_id = ?", [id]);

      if (ticketTypesArr && ticketTypesArr.length > 0) {
        const ticketValues = ticketTypesArr.map(t => [
          id, t.nom, t.description || null,
          parseInt(t.prix), parseInt(t.quantite), parseInt(t.quantite)
        ]);
        await conn.query(
          `INSERT INTO categorie_ticket (evenement_id, nom, description, prix, capacite, places_disponibles) VALUES ?`,
          [ticketValues]
        );
      }

      await conn.commit();
      res.json({ message: "Événement modifié avec succès" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Modifier evenement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const annuler = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query("SELECT id, statut FROM evenement WHERE id = ? AND organisateur_id = ?", [id, req.user.id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });

    await pool.query("UPDATE evenement SET statut = 'annule' WHERE id = ?", [id]);
    res.json({ message: "Événement annulé avec succès" });
  } catch (err) {
    console.error("Annuler evenement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminLister = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, o.nom AS organisateur_nom, o.email AS organisateur_email,
        (SELECT COUNT(*) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS types_billets
      FROM evenement e
      JOIN organisateur o ON o.id = e.organisateur_id
      ORDER BY e.date_creation DESC`
    );

    res.json(rows.map(r => ({
      id: r.id,
      nom: r.titre,
      description: r.description,
      organisateur: r.organisateur_nom,
      email: r.organisateur_email,
      categorie: r.categorie,
      ville: r.ville,
      date: new Date(r.date_debut).toLocaleDateString("fr-FR"),
      lieu: r.lieu,
      capacite: r.capacite_totale,
      types_billets: r.types_billets,
      statut: r.statut,
      commentaire_admin: r.commentaire_admin,
    })));
  } catch (err) {
    console.error("Admin lister error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminAccepter = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query("SELECT id, statut FROM evenement WHERE id = ?", [id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });
    if (existing[0].statut !== 'en_attente') {
      return res.status(400).json({ message: "Seul un événement en attente peut être accepté" });
    }

    await pool.query("UPDATE evenement SET statut = 'actif' WHERE id = ?", [id]);
    res.json({ message: "Événement accepté et publié", statut: 'actif' });
  } catch (err) {
    console.error("Admin accepter error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminRefuser = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const [existing] = await pool.query("SELECT id, statut FROM evenement WHERE id = ?", [id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });
    if (existing[0].statut !== 'en_attente') {
      return res.status(400).json({ message: "Seul un événement en attente peut être refusé" });
    }

    await pool.query("UPDATE evenement SET statut = 'refuse', commentaire_admin = ? WHERE id = ?", [commentaire || null, id]);
    res.json({ message: "Événement refusé", statut: 'refuse' });
  } catch (err) {
    console.error("Admin refuser error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminSuspendre = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query("SELECT id, statut FROM evenement WHERE id = ?", [id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });

    const current = existing[0].statut;
    if (current === 'actif') {
      await pool.query("UPDATE evenement SET statut = 'suspendu' WHERE id = ?", [id]);
      res.json({ message: "Événement suspendu", statut: 'suspendu' });
    } else if (current === 'suspendu') {
      await pool.query("UPDATE evenement SET statut = 'actif' WHERE id = ?", [id]);
      res.json({ message: "Événement réactivé", statut: 'actif' });
    } else {
      res.status(400).json({ message: "Impossible de suspendre un événement qui n'est pas actif" });
    }
  } catch (err) {
    console.error("Admin suspendre error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT e.*, o.nom AS organisateur_nom, o.email AS organisateur_email, o.telephone AS organisateur_telephone,
        COALESCE(
          e.ville,
          JSON_UNQUOTE(JSON_EXTRACT(d.payload, '$.ville')),
          TRIM(SUBSTRING_INDEX(d.lieu, ',', -1))
        ) AS ville,
        COALESCE(
          e.categorie,
          JSON_UNQUOTE(JSON_EXTRACT(d.payload, '$.categorie'))
        ) AS categorie
      FROM evenement e
      JOIN organisateur o ON o.id = e.organisateur_id
      LEFT JOIN demande_evenement d ON d.evenement_id = e.id AND d.type_action = 'CREATION'
      WHERE e.id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Événement introuvable" });

    const [tickets] = await pool.query("SELECT * FROM categorie_ticket WHERE evenement_id = ?", [id]);

    res.json({ evenement: rows[0], tickets });
  } catch (err) {
    console.error("Admin detail error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Liste les événements publics avec statut='actif' et date_fin >= NOW
// Accessible sans authentification — uniquement les événements validés par l'admin
const listerPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.titre, e.description, e.lieu, e.ville, e.categorie,
        e.date_debut, e.date_fin, e.capacite_totale, e.affiche_url,
        (SELECT MIN(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_min,
        (SELECT MAX(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_max
      FROM evenement e
      WHERE e.statut = 'actif' AND (e.date_fin IS NULL OR e.date_fin >= NOW())
      ORDER BY e.date_debut ASC`
    );

    res.json(rows.map(r => ({
      id: r.id,
      titre: r.titre,
      description: r.description,
      lieu: r.lieu,
      ville: r.ville,
      categorie: r.categorie,
      date_debut: r.date_debut,
      date_fin: r.date_fin,
      capacite_totale: r.capacite_totale,
      affiche_url: r.affiche_url,
      prix_min: r.prix_min || 0,
      prix_max: r.prix_max || 0,
    })));
  } catch (err) {
    console.error("Lister public error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Détail public d'un événement avec ses catégories de billets
const detailPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, affiche_url FROM evenement WHERE id = ? AND statut = 'actif'",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Événement introuvable" });

    const [tickets] = await pool.query(
      "SELECT id, nom, description, prix, capacite, places_disponibles FROM categorie_ticket WHERE evenement_id = ?",
      [id]
    );

    res.json({ evenement: rows[0], categories: tickets });
  } catch (err) {
    console.error("Detail public error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Retourne le scan_code de l'événement et la liste des contrôleurs affectés avec leurs stats
const getEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await pool.query(
      "SELECT id, scan_code FROM evenement WHERE id = ? AND organisateur_id = ?",
      [id, req.user.id]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable" });
    const scanCode = events[0].scan_code;
    const [controleurs] = await pool.query(
      `SELECT c.id, c.nom, c.telephone, ac.zone,
        (SELECT COUNT(*) FROM scan_billet sb WHERE sb.controleur_id = c.id AND sb.evenement_id = ?) AS scans_effectues
      FROM affectation_controleur ac
      JOIN controleur c ON c.id = ac.controleur_id
      WHERE ac.evenement_id = ?
      ORDER BY c.nom ASC`,
      [id, id]
    );
    res.json({ scan_code: scanCode, controleurs });
  } catch (err) {
    console.error("Get equipe error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Génère un nouveau code scan à 4 caractères pour l'événement
const regenererScanCode = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      "SELECT id FROM evenement WHERE id = ? AND organisateur_id = ?",
      [id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });
    const nouveauCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    await pool.query("UPDATE evenement SET scan_code = ? WHERE id = ?", [nouveauCode, id]);
    res.json({ scan_code: nouveauCode, message: "Code de scan régénéré avec succès" });
  } catch (err) {
    console.error("Regenerer scan code error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { creer, upload, lister, detail, modifier, annuler, adminLister, adminAccepter, adminRefuser, adminSuspendre, adminDetail, listerPublic, detailPublic, getEquipe, regenererScanCode };

