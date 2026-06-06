/**
 * Contrôleur des demandes de partenariat et des comptes partenaires
 * Routes publiques : POST /api/partenaires (soumettre)
 * Routes admin : GET, GET/:id, PUT/:id (liste, détail, traitement)
 * Routes admin gestion : POST /api/partenaires/creer-identifiants, GET /api/partenaires/identifiants, PUT /api/partenaires/:id/reinitialiser-mot-de-passe
 */
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire } = require("../services/EmailService");

/**
 * Soumet une nouvelle demande de partenariat (public)
 * POST /api/partenaires
 * Body: { nom, organisation, telephone, email, typeEvenement, nbEvenements, siteWeb, description }
 */
const soumettreDemande = async (req, res) => {
  try {
    const { nom, organisation, telephone, email, typeEvenement, nbEvenements, siteWeb, description } = req.body;

    if (!nom || !organisation || !telephone || !email || !typeEvenement || !description) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
    }

    const [result] = await pool.query(
      `INSERT INTO partenaire_demande (nom, organisation, telephone, email, type_evenement, nb_evenements, site_web, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom.trim(), organisation.trim(), telephone, email.trim().toLowerCase(), typeEvenement, nbEvenements || null, siteWeb || null, description.trim()]
    );

    const nouvelleDemande = {
      id: result.insertId,
      nom,
      organisation,
      telephone,
      email,
      type_evenement: typeEvenement,
      nb_evenements: nbEvenements,
      site_web: siteWeb,
      description,
    };

    // Envoi synchrone (Vercel serverless tue le processus après la réponse)
    try { await envoyerConfirmationDemandeur(nouvelleDemande); } catch (e) { console.error("Email error:", e.message); }
    try { await envoyerNotificationAdmin(nouvelleDemande); } catch (e) { console.error("Email error:", e.message); }

    res.status(201).json({
      message: "Votre demande a bien été envoyée. Nous vous contactons sous 48h.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Erreur soumission partenaire:", err);
    res.status(500).json({ message: "Erreur lors de l'envoi de la demande" });
  }
};

/**
 * Liste toutes les demandes de partenariat (admin)
 * GET /api/partenaires
 * Query: statut (filtre optionnel)
 */
const listerDemandes = async (req, res) => {
  try {
    const { statut } = req.query;
    let query = `
      SELECT pd.*, a.nom AS traite_par_nom
      FROM partenaire_demande pd
      LEFT JOIN administrateur a ON pd.administrateur_id = a.id
    `;
    const params = [];

    if (statut) {
      query += " WHERE pd.statut = ?";
      params.push(statut);
    }

    query += " ORDER BY pd.date_soumission DESC";

    const [rows] = await pool.query(query, params);

    res.json(rows.map((r) => ({
      id: r.id,
      nom: r.nom,
      organisation: r.organisation,
      telephone: r.telephone,
      email: r.email,
      type_evenement: r.type_evenement,
      nb_evenements: r.nb_evenements,
      site_web: r.site_web,
      description: r.description,
      statut: r.statut,
      note_admin: r.note_admin,
      email_confirme: !!r.email_confirme,
      traite_par: r.traite_par_nom,
      date: new Date(r.date_soumission).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      date_soumission: r.date_soumission,
      date_traitement: r.date_traitement,
      a_des_identifiants: r.a_des_identifiants,
    })));
  } catch (err) {
    console.error("Erreur liste partenaires:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Détail d'une demande (admin)
 * GET /api/partenaires/:id
 */
const detailDemande = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pd.*, a.nom AS traite_par_nom
       FROM partenaire_demande pd
       LEFT JOIN administrateur a ON pd.administrateur_id = a.id
       WHERE pd.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur détail partenaire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Traite une demande (admin)
 * PUT /api/partenaires/:id
 * Body: { statut, note_admin }
 */
const traiterDemande = async (req, res) => {
  try {
    const { statut, note_admin } = req.body;
    const adminId = req.user.id;

    if (!statut || !["EN_ATTENTE", "EN_COURS", "ACCEPTEE", "REFUSEE"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const [demande] = await pool.query(
      "SELECT * FROM partenaire_demande WHERE id = ?",
      [req.params.id]
    );

    if (!demande.length) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    await pool.query(
      `UPDATE partenaire_demande
       SET statut = ?, note_admin = ?, administrateur_id = ?, date_traitement = NOW()
       WHERE id = ?`,
      [statut, note_admin || null, adminId, req.params.id]
    );

    const data = demande[0];
    try {
      await envoyerStatutDemande(
        { nom: data.nom, organisation: data.organisation, email: data.email },
        statut,
        note_admin
      );
    } catch (e) {
      console.error("Erreur envoi statut email:", e.message);
    }

    res.json({ message: "Demande mise à jour avec succès" });
  } catch (err) {
    console.error("Erreur traitement partenaire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Statistiques pour le dashboard admin
 * GET /api/partenaires/stats
 */
const statsDemandes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(statut = 'EN_ATTENTE') AS en_attente,
        SUM(statut = 'EN_COURS') AS en_cours,
        SUM(statut = 'ACCEPTEE') AS acceptees,
        SUM(statut = 'REFUSEE') AS refusees
      FROM partenaire_demande
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur stats partenaires:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ──────────────────────────────────────────────
// Gestion des identifiants partenaires (admin)
// ──────────────────────────────────────────────

/**
 * Crée des identifiants de connexion pour un partenaire à partir d'une demande acceptée
 * POST /api/partenaires/creer-identifiants
 * Body: { demande_id, email, mot_de_passe }
 */
const creerIdentifiantsPartenaire = async (req, res) => {
  try {
    const { demande_id, email, mot_de_passe } = req.body;

    if (!demande_id || !email || !mot_de_passe) {
      return res.status(400).json({ message: "demande_id, email et mot_de_passe sont requis" });
    }

    if (mot_de_passe.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [demandes] = await pool.query(
      "SELECT * FROM partenaire_demande WHERE id = ? AND statut = 'ACCEPTEE'",
      [demande_id]
    );

    if (!demandes.length) {
      return res.status(404).json({ message: "Demande acceptée introuvable" });
    }

    const demande = demandes[0];

    const emailLower = email.trim().toLowerCase();

    // Vérifier si un organisateur ou partenaire existe déjà avec cet email
    const [existants] = await pool.query(
      "SELECT id, 'organisateur' AS type FROM organisateur WHERE email = ? UNION SELECT id, 'partenaire' AS type FROM partenaire WHERE email = ?",
      [emailLower, emailLower]
    );

    if (existants.length) {
      return res.status(409).json({ message: "Un compte existe déjà avec cet email" });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Créer un organisateur (statut VALIDE pour accès immédiat)
    const telephone = demande.telephone || `77${Date.now()}`.slice(0, 20);
    const nom = demande.organisation || demande.nom || "Partenaire";
    await pool.query(
      `INSERT INTO organisateur (nom, telephone, email, mot_de_passe, nom_structure, statut)
       VALUES (?, ?, ?, ?, ?, 'VALIDE')`,
      [nom, telephone, emailLower, hash, demande.organisation || null]
    );

    // Créer aussi le compte partenaire (pour la gestion admin)
    const [result] = await pool.query(
      `INSERT INTO partenaire (demande_id, nom_organisation, email, mot_de_passe, telephone, site_web, type_evenement)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        demande_id,
        demande.organisation,
        emailLower,
        hash,
        demande.telephone || null,
        demande.site_web || null,
        demande.type_evenement || null,
      ]
    );

    try {
      await envoyerIdentifiantsPartenaire({
        nom: demande.nom,
        organisation: demande.organisation,
        email: emailLower,
        motDePasse: mot_de_passe,
      });
    } catch (err) {
      console.error("Erreur envoi identifiants partenaire:", err.message);
    }

    res.status(201).json({
      message: "Identifiants créés avec succès. L'utilisateur peut se connecter comme organisateur.",
      id: result.insertId,
      email: emailLower,
    });
  } catch (err) {
    console.error("Erreur création identifiants partenaire:", err);
    res.status(500).json({ message: "Erreur lors de la création des identifiants" });
  }
};

/**
 * Liste les comptes partenaires créés (admin)
 * GET /api/partenaires/identifiants
 */
const listerIdentifiants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, pd.nom AS contact_nom, pd.statut AS demande_statut
      FROM partenaire p
      LEFT JOIN partenaire_demande pd ON p.demande_id = pd.id
      ORDER BY p.date_creation DESC
    `);

    res.json(rows.map((r) => ({
      id: r.id,
      demande_id: r.demande_id,
      nom_organisation: r.nom_organisation,
      email: r.email,
      telephone: r.telephone,
      site_web: r.site_web,
      type_evenement: r.type_evenement,
      statut: r.statut,
      contact_nom: r.contact_nom,
      date_creation: new Date(r.date_creation).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      derniere_connexion: r.derniere_connexion,
    })));
  } catch (err) {
    console.error("Erreur liste identifiants:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Réinitialise le mot de passe d'un partenaire (admin)
 * PUT /api/partenaires/:id/reinitialiser-mot-de-passe
 * Body: { nouveau_mot_de_passe }
 */
const reinitialiserMotDePasse = async (req, res) => {
  try {
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [partenaires] = await pool.query(
      "SELECT * FROM partenaire WHERE id = ?",
      [req.params.id]
    );

    if (!partenaires.length) {
      return res.status(404).json({ message: "Partenaire introuvable" });
    }

    const partenaire = partenaires[0];
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);

    await pool.query(
      "UPDATE partenaire SET mot_de_passe = ? WHERE id = ?",
      [hash, req.params.id]
    );

    // Synchroniser aussi le mot de passe dans la table organisateur
    await pool.query(
      "UPDATE organisateur SET mot_de_passe = ? WHERE email = ?",
      [hash, partenaire.email]
    );

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("Erreur réinitialisation mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  soumettreDemande,
  listerDemandes,
  detailDemande,
  traiterDemande,
  statsDemandes,
  creerIdentifiantsPartenaire,
  listerIdentifiants,
  reinitialiserMotDePasse,
};
