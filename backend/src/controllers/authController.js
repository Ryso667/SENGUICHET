const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

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

// Envoie un code OTP à l'email de l'acheteur pour confirmer sa connexion
// Stocke le code temporairement (5 min), retourne un accusé
const envoyerCodeOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { STOCKER_CODE } = require("../services/otpStore");
    await STOCKER_CODE(email, code);

    const { envoyerCodeOTP: envoyerEmail } = require("../services/emailService");
    await envoyerEmail(email, code);

    res.json({ message: "Code envoyé", code });
  } catch (err) {
    console.error("Erreur envoi OTP:", err);
    res.status(500).json({ message: "Erreur lors de l'envoi du code" });
  }
};

// Vérifie le code OTP et retourne un JWT de session pour l'acheteur
// Si l'acheteur n'existe pas en base, il est créé
const verifierCodeOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email et code requis" });
    }

    const { VERIFIER_CODE } = require("../services/otpStore");
    const codeValide = await VERIFIER_CODE(email, code);
    if (!codeValide) {
      return res.status(401).json({ message: "Code invalide ou expiré" });
    }

    let acheteur;
    try {
      const [existants] = await pool.query(
        "SELECT id, nom, email FROM acheteur WHERE email = ? LIMIT 1",
        [email]
      );
      if (existants.length > 0) {
        acheteur = existants[0];
        await pool.query(
          "UPDATE acheteur SET dernier_acces = NOW() WHERE id = ?",
          [acheteur.id]
        );
      } else {
        const [result] = await pool.query(
          "INSERT INTO acheteur (email, date_inscription, dernier_acces) VALUES (?, NOW(), NOW())",
          [email]
        );
        acheteur = { id: result.insertId, email };
      }
    } catch (dbErr) {
      // Mode démo : si la base n'est pas accessible, créer un acheteur factice
      console.warn("DB indisponible, mode démo:", dbErr.message);
      acheteur = { id: Date.now(), email };
    }

    const token = generateToken({ id: acheteur.id, email }, "ACHETEUR");
    res.json({
      token,
      user: { id: acheteur.id, email },
    });
  } catch (err) {
    console.error("Erreur vérification OTP:", err);
    res.status(500).json({ message: "Erreur lors de la vérification" });
  }
};

// Connexion sociale (Google/Apple) pour l'acheteur
// Crée un compte acheteur si inexistant, retourne un JWT
const connexionSociale = async (req, res) => {
  try {
    const { email, nom, provider } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    let acheteur;
    try {
      const [existants] = await pool.query(
        "SELECT id, nom, email FROM acheteur WHERE email = ? LIMIT 1",
        [email]
      );
      if (existants.length > 0) {
        acheteur = existants[0];
        await pool.query("UPDATE acheteur SET dernier_acces = NOW() WHERE id = ?", [acheteur.id]);
      } else {
        const [result] = await pool.query(
          "INSERT INTO acheteur (nom, email, date_inscription, dernier_acces) VALUES (?, ?, NOW(), NOW())",
          [nom || email.split("@")[0], email]
        );
        acheteur = { id: result.insertId, email };
      }
    } catch (dbErr) {
      console.warn("DB indisponible, mode démo:", dbErr.message);
      acheteur = { id: Date.now(), email };
    }

    const token = generateToken({ id: acheteur.id, email }, "ACHETEUR");
    res.json({ token, user: { id: acheteur.id, email } });
  } catch (err) {
    console.error("Connexion sociale error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Permet à un organisateur de changer son mot de passe en vérifiant l'ancien
// Reçoit : { ancienMotDePasse, nouveauMotDePasse } — met à jour si ancien correspond
const changerMotDePasse = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [rows] = await pool.query(
      "SELECT mot_de_passe FROM organisateur WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Organisateur introuvable" });
    }

    const valide = await bcrypt.compare(ancienMotDePasse, rows[0].mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    const hashed = await bcrypt.hash(nouveauMotDePasse, 10);
    await pool.query("UPDATE organisateur SET mot_de_passe = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (err) {
    console.error("Changer mot de passe error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionControleur = async (req, res) => {
  try {
    const { codeAcces } = req.body;
    if (!codeAcces) {
      return res.status(400).json({ message: "Code d'accès requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, telephone, nom, code_acces FROM controleur WHERE acces_actif = 1"
    );

    for (const c of rows) {
      if (!c.code_acces) continue;
      const valid = await bcrypt.compare(codeAcces, c.code_acces);
      if (valid) {
        const token = jwt.sign(
          { id: c.id, email: c.nom || c.telephone, role: "CONTROLEUR" },
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
        return res.status(200).json({
          token,
          user: { id: c.id, telephone: c.telephone, nom: c.nom, role: "CONTROLEUR" },
        });
      }
    }

    return res.status(401).json({ message: "Code d'accès invalide" });
  } catch (err) {
    console.error("Connexion controleur error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, connexionControleur, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur, connexionSociale, envoyerCodeOTP, verifierCodeOTP, changerMotDePasse };
