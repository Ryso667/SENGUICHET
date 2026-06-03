const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const generateToken = (user, role) => {
  return jwt.sign(
    { id: user.id, email: user.email, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const inscription = async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse } = req.body;

    if (!nom || !telephone || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM organisateur WHERE email = ? OR telephone = ?",
      [email, telephone]
    );
    if (existing.length) {
      return res.status(400).json({ message: "Email ou téléphone déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const [result] = await pool.query(
      "INSERT INTO organisateur (nom, telephone, email, mot_de_passe, statut) VALUES (?, ?, ?, ?, 'VALIDE')",
      [nom, telephone, email, hashedPassword]
    );

    const user = { id: result.insertId, nom, telephone, email };
    const token = generateToken(user, "ORGANISATEUR");

    res.status(201).json({ token, user: { ...user, role: "ORGANISATEUR", statut: "VALIDE" } });
  } catch (err) {
    console.error("Inscription error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionOrganisateur = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom, telephone, email, mot_de_passe, statut FROM organisateur WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(motDePasse, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (user.statut === "EN_ATTENTE") {
      const token = generateToken(user, "ORGANISATEUR");
      return res.status(200).json({
        token,
        user: { id: user.id, nom: user.nom, telephone: user.telephone, email: user.email, role: "ORGANISATEUR", statut: user.statut },
      });
    }

    const token = generateToken(user, "ORGANISATEUR");
    res.status(200).json({
      token,
      user: { id: user.id, nom: user.nom, telephone: user.telephone, email: user.email, role: "ORGANISATEUR", statut: user.statut },
    });
  } catch (err) {
    console.error("Connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionAdmin = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom, email, mot_de_passe, role FROM administrateur WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(motDePasse, admin.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(admin, "ADMIN");
    res.status(200).json({
      token,
      user: { id: admin.id, nom: admin.nom, email: admin.email, role: "ADMIN" },
    });
  } catch (err) {
    console.error("Admin connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionPartenaire = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom_organisation, email, mot_de_passe, telephone, statut FROM partenaire WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const partenaire = rows[0];
    const valid = await bcrypt.compare(motDePasse, partenaire.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (partenaire.statut === "INACTIF") {
      return res.status(403).json({ message: "Compte désactivé. Contactez l'administration." });
    }

    const token = generateToken({ id: partenaire.id, email: partenaire.email, nom: partenaire.nom_organisation }, "PARTENAIRE");
    res.status(200).json({
      token,
      user: { id: partenaire.id, nom: partenaire.nom_organisation, email: partenaire.email, telephone: partenaire.telephone, role: "PARTENAIRE" },
    });
  } catch (err) {
    console.error("Partenaire connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const adminListerOrganisateurs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nom, telephone, email, nom_structure, statut, date_inscription,
        (SELECT COUNT(*) FROM evenement WHERE organisateur_id = organisateur.id) AS nb_evenements
      FROM organisateur
      ORDER BY date_inscription DESC`
    );

    res.json(rows.map(r => ({
      id: r.id,
      nom: r.nom,
      telephone: r.telephone,
      email: r.email,
      nom_structure: r.nom_structure,
      date: new Date(r.date_inscription).toLocaleDateString("fr-FR"),
      statut: r.statut,
      nb_evenements: r.nb_evenements,
    })));
  } catch (err) {
    console.error("Admin lister organisateurs error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const reinitialiserMotDePasseOrganisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [rows] = await pool.query("SELECT id FROM organisateur WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Organisateur introuvable" });
    }

    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query("UPDATE organisateur SET mot_de_passe = ? WHERE id = ?", [hashedPassword, id]);

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("Réinitialisation mot de passe organisateur error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur };
