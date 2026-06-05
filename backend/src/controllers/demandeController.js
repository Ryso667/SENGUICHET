/**
 * Contrôleur des demandes d'événements
 * Gère le workflow : Organisateur soumet une demande → Admin traite
 * Types : CREATION, MODIFICATION, SUPPRESSION
 */
const pool = require("../config/db");
const { envoyerNotificationDemandeEvenement } = require("../services/emailService");

const soumettreDemande = async (req, res) => {
  try {
    const { type_action, evenement_id, titre, description, lieu,
      date_debut, date_fin, capacite, affiche_url, payload, categories_tickets } = req.body;

    if (!type_action || !["CREATION", "MODIFICATION", "SUPPRESSION"].includes(type_action)) {
      return res.status(400).json({ message: "Type d'action invalide" });
    }

    if (type_action === "CREATION") {
      if (!titre || !description || !lieu || !date_debut || !capacite) {
        return res.status(400).json({ message: "Champs obligatoires manquants pour la création" });
      }
    }

    if ((type_action === "MODIFICATION" || type_action === "SUPPRESSION") && !evenement_id) {
      return res.status(400).json({ message: "ID événement requis" });
    }

    const dateDebut = new Date(date_debut);
    const dateFin = date_fin ? new Date(date_fin) : null;

    const [result] = await pool.query(
      `INSERT INTO demande_evenement
       (organisateur_id, type_action, evenement_id, titre, description, lieu,
        date_debut, date_fin, capacite, affiche_url, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, type_action, evenement_id || null, titre || null,
       description || null, lieu || null, dateDebut, dateFin,
       capacite || 0, affiche_url || null,
       (payload || categories_tickets) ? JSON.stringify(payload || { categories_tickets }) : null]
    );

    // Notification email à l'admin
    try {
      const [org] = await pool.query("SELECT nom, email FROM organisateur WHERE id = ?", [req.user.id]);
      if (org.length) {
        await envoyerNotificationDemandeEvenement({
          nom: org[0].nom,
          email: org[0].email,
          type_action,
          titre: titre || "",
          id: result.insertId,
        });
      }
    } catch (emailErr) {
      console.error("Erreur envoi email admin:", emailErr.message);
    }

    res.status(201).json({
      message: "Demande soumise avec succès",
      demande: { id: result.insertId, type_action, statut: "soumis" },
    });
  } catch (err) {
    console.error("Erreur soumettre demande:", err);
    res.status(500).json({ message: "Erreur lors de la soumission" });
  }
};

const listerMesDemandes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*,
        COALESCE(e.titre, '—') AS evenement_nom
      FROM demande_evenement d
      LEFT JOIN evenement e ON e.id = d.evenement_id
      WHERE d.organisateur_id = ?
      ORDER BY d.date_soumission DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erreur lister demandes:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const detailDemande = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, e.titre AS evenement_nom
      FROM demande_evenement d
      LEFT JOIN evenement e ON e.id = d.evenement_id
      WHERE d.id = ? AND d.organisateur_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Demande introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur detail demande:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminListerDemandes = async (req, res) => {
  try {
    const { statut, type } = req.query;
    let sql = `SELECT d.*, o.nom AS organisateur_nom, o.email AS organisateur_email,
               COALESCE(e.titre, '—') AS evenement_nom
              FROM demande_evenement d
              JOIN organisateur o ON o.id = d.organisateur_id
              LEFT JOIN evenement e ON e.id = d.evenement_id`;
    const conditions = [];
    const params = [];

    if (statut) {
      conditions.push("d.statut = ?");
      params.push(statut);
    }
    if (type) {
      conditions.push("d.type_action = ?");
      params.push(type);
    }

    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY d.date_soumission DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur admin lister demandes:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const adminDetailDemande = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, o.nom AS organisateur_nom, o.email AS organisateur_email,
        o.telephone AS organisateur_telephone, e.titre AS evenement_nom
      FROM demande_evenement d
      JOIN organisateur o ON o.id = d.organisateur_id
      LEFT JOIN evenement e ON e.id = d.evenement_id
      WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Demande introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur admin detail demande:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const creerEvenementDepuisDemande = async (conn, demande) => {
  const scanCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  // Extraire ville et categorie du payload JSON de la demande
  const payload = typeof demande.payload === "string"
    ? JSON.parse(demande.payload) : demande.payload;
  const ville = payload?.ville || null;
  const categorie = payload?.categorie || null;

  const [evResult] = await conn.query(
    `INSERT INTO evenement (organisateur_id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, affiche_url, scan_code, statut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`,
    [demande.organisateur_id, demande.titre, demande.description, demande.lieu,
     ville, categorie,
     demande.date_debut, demande.date_fin, demande.capacite, demande.affiche_url || null, scanCode]
  );
  const evenementId = evResult.insertId;

  // Créer les catégories de tickets depuis le payload de la demande
  // payload déjà parsé ci-dessus
  if (payload?.categories_tickets?.length) {
    const ticketValues = payload.categories_tickets.map(t => [
      evenementId, t.nom, null, parseInt(t.prix), parseInt(t.places), parseInt(t.places)
    ]);
    await conn.query(
      `INSERT INTO categorie_ticket (evenement_id, nom, description, prix, capacite, places_disponibles) VALUES ?`,
      [ticketValues]
    );
  }

  return evenementId;
};

const adminTraiterDemande = async (req, res) => {
  const { id } = req.params;
  const { action, commentaire } = req.body;

  if (!action || !["approuve", "refuse"].includes(action)) {
    return res.status(400).json({ message: "Action invalide (approuve/refuse)" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [demandes] = await conn.query("SELECT * FROM demande_evenement WHERE id = ? FOR UPDATE", [id]);
    if (!demandes.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    const demande = demandes[0];
    if (demande.statut !== "soumis" && demande.statut !== "en_analyse") {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Cette demande a déjà été traitée" });
    }

    await conn.query(
      `UPDATE demande_evenement SET statut = ?, commentaire_admin = ?,
       administrateur_id = ?, date_traitement = NOW()
       WHERE id = ?`,
      [action, commentaire || null, req.user.id, id]
    );

    let evenementId = null;

    // Si approuvé, exécuter l'action
    if (action === "approuve") {
      if (demande.type_action === "CREATION") {
        // Pour CREATION : approuver seulement, l'admin créera l'événement plus tard via un bouton dédié
        // L'événement n'est pas créé automatiquement
      } else if (demande.type_action === "MODIFICATION" && demande.evenement_id) {
        const payload = typeof demande.payload === "string"
          ? JSON.parse(demande.payload) : demande.payload;
        if (payload) {
          const updates = [];
          const params = [];
          if (payload.titre) { updates.push("titre = ?"); params.push(payload.titre); }
          if (payload.description) { updates.push("description = ?"); params.push(payload.description); }
          if (payload.lieu) { updates.push("lieu = ?"); params.push(payload.lieu); }
          if (payload.date_debut) { updates.push("date_debut = ?"); params.push(new Date(payload.date_debut)); }
          if (payload.date_fin) { updates.push("date_fin = ?"); params.push(new Date(payload.date_fin)); }
          if (payload.capacite) { updates.push("capacite_totale = ?"); params.push(payload.capacite); }

          if (updates.length) {
            params.push(demande.evenement_id);
            await conn.query(
              `UPDATE evenement SET ${updates.join(", ")} WHERE id = ?`,
              params
            );
          }
        }
        evenementId = demande.evenement_id;
      } else if (demande.type_action === "SUPPRESSION" && demande.evenement_id) {
        await conn.query("UPDATE evenement SET statut = 'annule' WHERE id = ?", [demande.evenement_id]);
        evenementId = demande.evenement_id;
      }
    }

    await conn.commit();

    // Notification email
    try {
      const [org] = await conn.query("SELECT nom, email FROM organisateur WHERE id = ?", [demande.organisateur_id]);
      if (org.length) {
        await envoyerNotificationDemandeEvenement({
          nom: org[0].nom,
          email: org[0].email,
          type_action: demande.type_action,
          titre: demande.titre || "",
          statut: action,
          commentaire: commentaire || "",
          id: demande.id,
          destinataire: "organisateur",
        });
      }
    } catch (emailErr) {
      console.error("Erreur envoi email organisateur:", emailErr.message);
    }

    res.json({
      message: action === "approuve" ? "Demande approuvée" : "Demande refusée",
      statut: action,
      evenement_id: evenementId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Erreur admin traiter demande:", err);
    res.status(500).json({ message: "Erreur lors du traitement" });
  } finally {
    conn.release();
  }
};

/**
 * Crée l'événement à partir d'une demande approuvée (admin)
 * L'admin approuve d'abord la demande, puis clique sur "Créer l'événement"
 */
const adminCreerEvenement = async (req, res) => {
  const { id } = req.params;

  try {
    const [demandes] = await pool.query("SELECT * FROM demande_evenement WHERE id = ?", [id]);
    if (!demandes.length) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    const demande = demandes[0];
    if (demande.statut !== "approuve") {
      return res.status(400).json({ message: "La demande doit être approuvée d'abord" });
    }
    if (demande.type_action !== "CREATION") {
      return res.status(400).json({ message: "Seules les demandes de création peuvent générer un événement" });
    }
    if (demande.evenement_id) {
      return res.status(400).json({ message: "L'événement a déjà été créé pour cette demande" });
    }

    const conn = await pool.getConnection();
    let evenementId;
    try {
      await conn.beginTransaction();
      evenementId = await creerEvenementDepuisDemande(conn, demande);

      await conn.query(
        "UPDATE demande_evenement SET evenement_id = ? WHERE id = ?",
        [evenementId, id]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
    conn.release();

    // Notification email à l'organisateur
    try {
      const [org] = await pool.query("SELECT nom, email FROM organisateur WHERE id = ?", [demande.organisateur_id]);
      if (org.length) {
        await envoyerNotificationDemandeEvenement({
          nom: org[0].nom,
          email: org[0].email,
          type_action: demande.type_action,
          titre: demande.titre || "",
          statut: "evenement_cree",
          id: demande.id,
          evenement_nom: demande.titre,
          destinataire: "organisateur",
        });
      }
    } catch (emailErr) {
      console.error("Erreur envoi email création événement:", emailErr.message);
    }

    res.json({
      message: "Événement créé avec succès",
      evenement_id: evenementId,
    });
  } catch (err) {
    console.error("Erreur admin créer événement:", err);
    res.status(500).json({ message: "Erreur lors de la création de l'événement" });
  }
};

module.exports = {
  soumettreDemande, listerMesDemandes, detailDemande,
  adminListerDemandes, adminDetailDemande, adminTraiterDemande,
  adminCreerEvenement,
};
