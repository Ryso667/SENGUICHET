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
    const afficheUrl = req.body.affiche_url || (req.file ? `/uploads/${req.file.filename}` : null);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [evResult] = await conn.query(
        `INSERT INTO evenement (organisateur_id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, affiche_url, scan_code, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, titre, description, lieu, ville || null, categorie || null, dateDebutFull, dateFinFull, parseInt(capacite), afficheUrl, null, 'en_attente']
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
        evenement: { id: evenementId, titre, statut: 'en_attente', affiche_url: afficheUrl }
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
        e.date_debut, e.date_fin, e.capacite_totale, e.affiche_url, e.est_actif,
        e.statut, e.date_creation, e.commentaire_admin,
        COALESCE((SELECT SUM(ct.places_disponibles) FROM categorie_ticket ct WHERE ct.evenement_id = e.id), 0) AS places_restantes,
        COALESCE((SELECT SUM(ct.capacite) FROM categorie_ticket ct WHERE ct.evenement_id = e.id), 0) AS capacite_billets,
        (SELECT COALESCE(SUM(b.prix_paye), 0) FROM billet b JOIN categorie_ticket ct2 ON b.categorie_ticket_id = ct2.id WHERE ct2.evenement_id = e.id AND b.statut = 'ACTIF') AS revenus,
        (SELECT COUNT(*) FROM billet b JOIN categorie_ticket ct2 ON b.categorie_ticket_id = ct2.id WHERE ct2.evenement_id = e.id AND b.statut = 'ACTIF') AS billets_vendus
      FROM evenement e
      WHERE e.organisateur_id = ? AND e.statut != 'annule'
      ORDER BY e.date_creation DESC`,
      [req.user.id]
    );

    const events = rows.map(r => {
      const remplies = r.billets_vendus;
      const statut =
        r.statut === 'actif' && r.places_restantes <= 0 ? 'sold-out'
        : r.statut === 'actif' ? 'active'
        : r.statut;
      return {
        id: r.id,
        nom: r.titre,
        categorie: r.categorie,
        date_debut: r.date_debut,
        date_fin: r.date_fin,
        lieu: r.lieu,
        ville: r.ville,
        remplis: remplies,
        capacite: r.capacite_billets || r.capacite_totale,
        revenus: `${parseInt(r.revenus || 0).toLocaleString()} FCFA`,
        statut,
        code: '',
        affiche_url: r.affiche_url || null,
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
    const [rows] = await pool.query("SELECT e.*, cc.code AS code_controleur FROM evenement e LEFT JOIN code_controleur cc ON cc.evenement_id = e.id AND cc.statut = 'ACTIF' WHERE e.id = ? AND e.organisateur_id = ?", [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "Événement introuvable" });

    const [tickets] = await pool.query("SELECT * FROM categorie_ticket WHERE evenement_id = ?", [id]);

    // Stats des billets vendus (uniquement ACTIF = payés)
    const [ventes] = await pool.query(
      `SELECT
        COALESCE(COUNT(*), 0) AS total_vendus,
        COALESCE(SUM(b.prix_paye), 0) AS revenus
      FROM billet b
      JOIN categorie_ticket ct ON b.categorie_ticket_id = ct.id
      WHERE ct.evenement_id = ? AND b.statut = 'ACTIF'`,
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
// Calcule aussi popularite = nombre de billets ACTIF vendus
const listerPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.titre, e.description, e.lieu, e.ville, e.categorie,
        e.date_debut, e.date_fin, e.capacite_totale, e.affiche_url,
        (SELECT MIN(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_min,
        (SELECT MAX(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_max,
        (SELECT COUNT(*) FROM billet b JOIN categorie_ticket ct ON b.categorie_ticket_id = ct.id WHERE ct.evenement_id = e.id AND b.statut = 'ACTIF') AS popularite
      FROM evenement e
      WHERE e.statut = 'actif' AND (e.date_fin IS NULL OR e.date_fin >= NOW())
      ORDER BY popularite DESC, e.date_debut ASC`
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
      popularite: r.popularite || 0,
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

// Retourne le code_controleur (admin-managé) et la liste des contrôleurs affectés avec leurs stats
const getEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await pool.query("SELECT id FROM evenement WHERE id = ? AND organisateur_id = ?", [id, req.user.id]);
    if (!events.length) return res.status(404).json({ message: "Événement introuvable" });

    const [codes] = await pool.query(
      "SELECT code, statut FROM code_controleur WHERE evenement_id = ? AND statut = 'ACTIF' LIMIT 1",
      [id]
    );
    const codeControleur = codes.length > 0 ? codes[0].code : null;

    const [controleurs] = await pool.query(
      `SELECT c.id, c.nom, c.telephone, ac.zone,
        (SELECT COUNT(*) FROM scan_billet sb WHERE sb.controleur_id = c.id AND sb.evenement_id = ?) AS scans_effectues
      FROM affectation_controleur ac
      JOIN controleur c ON c.id = ac.controleur_id
      WHERE ac.evenement_id = ?
      ORDER BY c.nom ASC`,
      [id, id]
    );
    res.json({ code_controleur: codeControleur, controleurs });
  } catch (err) {
    console.error("Get equipe error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Page HTML publique d'un événement (pour partage par lien)
// GET /api/evenements/public/:id/page
const pageEvenement = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, titre, description, lieu, ville, categorie, date_debut, date_fin,
        capacite_totale, affiche_url, statut, heure_debut
      FROM evenement WHERE id = ? AND statut = 'actif'`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Événement introuvable — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#F9F6EE"><h1 style="color:#1B4332;">SENGUICHET</h1><p style="color:#40916C;">Événement introuvable</p></body></html>`);
    }

    const e = rows[0];
    const [categories] = await pool.query(
      "SELECT nom, prix, capacite, places_disponibles FROM categorie_ticket WHERE evenement_id = ?",
      [id]
    );

    const dateDebut = new Date(e.date_debut).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });
    const heureDebut = e.heure_debut || new Date(e.date_debut).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });
    const dateFin = e.date_fin ? new Date(e.date_fin).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    }) : null;

    const categoriesHtml = categories.map(c => `
      <div class="cat">
        <div class="cat-n">${c.nom}</div>
        <div class="cat-p">${Number(c.prix).toLocaleString()} FCFA</div>
        <div class="cat-d">${c.places_disponibles}/${c.capacite} places</div>
      </div>
    `).join('');

    const afficheStyle = e.affiche_url
      ? `<div class="af" style="background-image:url(${e.affiche_url})"></div>`
      : '<div class="af" style="background:linear-gradient(135deg,#5C6BC0,#7986CB);display:flex;align-items:center;justify-content:center"><span style="font-size:60px;opacity:.3">🎭</span></div>';

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e.titre} — SENGUICHET</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#0F1A0F;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px}
.c{max-width:420px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(92,107,192,.15);margin-top:20px}
.af{height:200px;background-size:cover;background-position:center;position:relative}
.af::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(15,26,15,.8),transparent)}
.bd{background:#F9F6EE;padding:24px}
.ct{font-size:10px;font-weight:700;letter-spacing:3px;color:#7986CB;margin-bottom:8px}
.tt{font-size:24px;font-weight:700;color:#1E2250;line-height:30px;margin-bottom:16px}
.gr{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.fd{background:rgba(92,107,192,.06);border-radius:12px;padding:10px 14px}
.fd-l{font-size:9px;font-weight:700;letter-spacing:2px;color:#7986CB;margin-bottom:2px}
.fd-v{font-size:13px;font-weight:600;color:#1E2250}
.ds{font-size:13px;line-height:20px;color:#374151;margin-bottom:16px;padding:0 2px}
.st{font-size:11px;font-weight:700;letter-spacing:2px;color:#7986CB;margin-bottom:10px}
.cat{border:1px solid rgba(92,107,192,.1);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.cat-n{font-size:13px;font-weight:600;color:#1E2250;flex:1}
.cat-p{font-size:14px;font-weight:700;color:#10B981}
.cat-d{font-size:10px;color:#7986CB;text-align:right;min-width:60px}
.ft{background:#F0EAD6;padding:16px;text-align:center}
.ft-l{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#5C6BC0}
.ft-p{font-size:8px;color:rgba(92,107,192,.3);margin-top:8px}
@media(max-width:480px){.c{margin-top:10px;border-radius:16px}.tt{font-size:20px}.af{height:160px}}
@media print{body{background:#fff;padding:0}.c{box-shadow:none;margin-top:0}}
</style>
</head>
<body>
<div class="c">
  ${afficheStyle}
  <div class="bd">
    <div class="ct">${e.categorie ? e.categorie.toUpperCase() : 'ÉVÉNEMENT'}</div>
    <div class="tt">${e.titre}</div>
    <div class="gr">
      <div class="fd">
        <div class="fd-l">DATE</div>
        <div class="fd-v">${dateDebut}</div>
      </div>
      <div class="fd">
        <div class="fd-l">HEURE</div>
        <div class="fd-v">${heureDebut}</div>
      </div>
      <div class="fd">
        <div class="fd-l">LIEU</div>
        <div class="fd-v">${e.lieu}</div>
      </div>
      <div class="fd">
        <div class="fd-l">VILLE</div>
        <div class="fd-v">${e.ville}</div>
      </div>
    </div>
    ${e.description ? `<div class="ds">${e.description}</div>` : ''}
    ${dateFin ? `<div class="fd" style="margin-bottom:16px"><div class="fd-l">DATE DE FIN</div><div class="fd-v">${dateFin}</div></div>` : ''}
    <div class="st">TARIFS</div>
    ${categoriesHtml || '<p style="color:#7986CB;font-size:13px">Aucun billet disponible</p>'}
  </div>
  <div class="ft">
    <div class="ft-l">SENGUICHET</div>
    <div class="ft-p">Billetterie en ligne</div>
  </div>
</div>
</body>
</html>`);
  } catch (err) {
    console.error("Page evenement error:", err);
    res.status(500).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Erreur — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#F9F6EE"><h1 style="color:#1B4332;">SENGUICHET</h1><p style="color:#40916C;">Erreur serveur</p></body></html>`);
  }
};
const statsEvenement = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifie que l'événement appartient bien à l'organisateur connecté
    const [events] = await pool.query(
      "SELECT id, titre, capacite_totale FROM evenement WHERE id = ? AND organisateur_id = ?",
      [id, req.user.id]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable" });

    // Total des billets ACTIF (payés) et revenu généré
    const [ventes] = await pool.query(
      `SELECT COUNT(*) AS total_vendus, COALESCE(SUM(b.prix_paye), 0) AS total_revenu
       FROM billet b
       JOIN categorie_ticket ct ON b.categorie_ticket_id = ct.id
       WHERE ct.evenement_id = ? AND b.statut = 'ACTIF'`,
      [id]
    );
    const billetsVendus = Number(ventes[0].total_vendus);
    const totalRevenu = Number(ventes[0].total_revenu);

    // Capacité totale de billets pour l'événement
    const [capaciteRows] = await pool.query(
      "SELECT COALESCE(SUM(capacite), 0) AS total FROM categorie_ticket WHERE evenement_id = ?",
      [id]
    );
    const totalBillets = Number(capaciteRows[0].total);

    // Taux de remplissage arrondi à 2 décimales
    const tauxRemplissage = totalBillets > 0
      ? Math.round((billetsVendus / totalBillets) * 10000) / 100
      : 0;

    // Ventes agrégées par jour (date de création du billet)
    const [ventesParJour] = await pool.query(
      `SELECT DATE(b.date_creation) AS date, COUNT(*) AS total
       FROM billet b
       JOIN categorie_ticket ct ON b.categorie_ticket_id = ct.id
       WHERE ct.evenement_id = ? AND b.statut = 'ACTIF'
       GROUP BY DATE(b.date_creation)
       ORDER BY DATE(b.date_creation) ASC`,
      [id]
    );

    // Répartition des ventes par catégorie de billet
    const [repartition] = await pool.query(
      `SELECT ct.nom AS categorie,
              COUNT(b.id) AS vendus,
              ct.capacite AS total,
              COALESCE(SUM(b.prix_paye), 0) AS revenu
       FROM categorie_ticket ct
       LEFT JOIN billet b ON b.categorie_ticket_id = ct.id AND b.statut = 'ACTIF'
       WHERE ct.evenement_id = ?
       GROUP BY ct.id, ct.nom, ct.capacite
       ORDER BY ct.nom ASC`,
      [id]
    );

    res.json({
      totalBillets,
      billetsVendus,
      tauxRemplissage,
      ventesParJour,
      repartitionParCategorie: repartition.map(r => ({
        ...r,
        vendus: Number(r.vendus),
        total: Number(r.total),
        revenu: Number(r.revenu),
      })),
      totalRevenu,
    });
  } catch (err) {
    console.error("Stats evenement error:", err);
    res.status(500).json({ message: "Erreur lors du calcul des statistiques" });
  }
};

module.exports = { creer, upload, lister, detail, modifier, annuler, adminLister, adminAccepter, adminRefuser, adminSuspendre, adminDetail, listerPublic, detailPublic, pageEvenement, getEquipe, statsEvenement };

