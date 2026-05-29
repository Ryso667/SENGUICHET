const pool = require("../config/db");

const creer = async (req, res) => {
  try {
    const { titre, description, lieu, ville, categorie, dateDebut, dateFin, heureDebut, capacite, ticketTypes } = req.body;

    if (!titre || !description || !lieu || !ville || !dateDebut || !heureDebut || !capacite) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const dateDebutFull = `${dateDebut} ${heureDebut}:00`;
    const dateFinFull = dateFin ? `${dateFin} 23:59:00` : null;

    const scanCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [evResult] = await conn.query(
        `INSERT INTO evenement (organisateur_id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, scan_code, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, titre, description, lieu, ville || null, categorie || null, dateDebutFull, dateFinFull, parseInt(capacite), scanCode, 'en_attente']
      );

      const evenementId = evResult.insertId;

      if (ticketTypes && ticketTypes.length > 0) {
        const ticketValues = ticketTypes.map(t => [
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
        evenement: { id: evenementId, titre, scanCode, statut: 'en_attente' }
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
      `SELECT e.*,
        COALESCE(SUM(ct.places_disponibles), 0) AS places_restantes,
        COALESCE(SUM(ct.capacite), 0) AS capacite_billets,
        (SELECT COALESCE(SUM(b.prix_paye), 0) FROM billet b JOIN categorie_ticket ct2 ON b.categorie_ticket_id = ct2.id WHERE ct2.evenement_id = e.id) AS revenus
      FROM evenement e
      LEFT JOIN categorie_ticket ct ON ct.evenement_id = e.id
      WHERE e.organisateur_id = ? AND e.statut != 'annule'
      GROUP BY e.id
      ORDER BY e.date_creation DESC`,
      [req.user.id]
    );

    const events = rows.map(r => {
      const remplies = r.capacite_billets - r.places_restantes;
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
        img: `/images/event-${(r.id % 3) + 1}.jpg`,
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

    res.json({ evenement: rows[0], tickets });
  } catch (err) {
    console.error("Detail evenement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const modifier = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, lieu, ville, categorie, dateDebut, dateFin, heureDebut, capacite, ticketTypes } = req.body;

    const [existing] = await pool.query("SELECT id, statut FROM evenement WHERE id = ? AND organisateur_id = ?", [id, req.user.id]);
    if (!existing.length) return res.status(404).json({ message: "Événement introuvable" });
    if (existing[0].statut !== 'en_attente' && existing[0].statut !== 'actif') {
      return res.status(400).json({ message: "Impossible de modifier un événement qui n'est plus en attente ou actif" });
    }

    const dateDebutFull = `${dateDebut} ${heureDebut}:00`;
    const dateFinFull = dateFin ? `${dateFin} 23:59:00` : null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE evenement SET titre=?, description=?, lieu=?, ville=?, categorie=?, date_debut=?, date_fin=?, capacite_totale=?
         WHERE id=?`,
        [titre, description, lieu, ville || null, categorie || null, dateDebutFull, dateFinFull, parseInt(capacite), id]
      );

      await conn.query("DELETE FROM categorie_ticket WHERE evenement_id = ?", [id]);

      if (ticketTypes && ticketTypes.length > 0) {
        const ticketValues = ticketTypes.map(t => [
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
      `SELECT e.*, o.nom AS organisateur_nom, o.email AS organisateur_email, o.telephone AS organisateur_telephone
      FROM evenement e
      JOIN organisateur o ON o.id = e.organisateur_id
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

module.exports = { creer, lister, detail, modifier, annuler, adminLister, adminAccepter, adminRefuser, adminSuspendre, adminDetail };

