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

// Connexion sociale via Firebase (Google/Apple)
// Reçoit un token ID Firebase, le vérifie, crée ou lie l'acheteur
const connexionSociale = async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ message: "Token Firebase requis" });
    }

    const { verifierTokenFirebase } = require("../services/firebaseAdmin");
    let profil;
    try {
      profil = await verifierTokenFirebase(firebaseToken);
    } catch (err) {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    if (!profil.email) {
      return res.status(400).json({ message: "Email requis pour la connexion sociale" });
    }

    // Chercher un acheteur existant par email ou provider_id
    const [existants] = await pool.query(
      `SELECT id, nom, email, telephone, photo_url, auth_provider, provider_id
       FROM acheteur
       WHERE email = ? OR (auth_provider = ? AND provider_id = ?)
       LIMIT 1`,
      [profil.email, profil.auth_provider, profil.uid]
    );

    let acheteur;
    if (existants.length > 0) {
      // Mettre à jour l'existant (photo, nom, provider)
      acheteur = existants[0];
      await pool.query(
        `UPDATE acheteur
         SET nom = COALESCE(?, nom),
             photo_url = COALESCE(?, photo_url),
             auth_provider = ?,
             provider_id = ?,
             dernier_acces = NOW()
         WHERE id = ?`,
        [profil.nom, profil.photo_url, profil.auth_provider, profil.uid, acheteur.id]
      );
    } else {
      // Créer un nouvel acheteur
      const [result] = await pool.query(
        `INSERT INTO acheteur (nom, email, photo_url, auth_provider, provider_id, date_inscription, dernier_acces)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [profil.nom, profil.email, profil.photo_url, profil.auth_provider, profil.uid]
      );
      acheteur = { id: result.insertId, nom: profil.nom, email: profil.email, photo_url: profil.photo_url, auth_provider: profil.auth_provider };
    }

    // Générer le JWT de session
    const token = generateToken(
      { id: acheteur.id, email: profil.email },
      "ACHETEUR"
    );

    res.json({
      token,
      user: {
        id: acheteur.id,
        nom: profil.nom,
        email: profil.email,
        photo_url: profil.photo_url,
        auth_provider: profil.auth_provider,
      },
    });
  } catch (err) {
    console.error("Connexion sociale error:", err);
    res.status(500).json({ message: "Erreur lors de la connexion sociale" });
  }
};

module.exports = { inscription, connexionOrganisateur, connexionAdmin, adminListerOrganisateurs, connexionSociale };
